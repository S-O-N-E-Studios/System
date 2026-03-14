const Project = require('../models/Project');
const Task = require('../models/Task');
const Sprint = require('../models/Sprint');
const Payment = require('../models/Payment');
const PaymentForecast = require('../models/PaymentForecast');

function getTenantId(req) {
  return req.tenant ? req.tenant._id : null;
}

exports.getDashboard = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const filter = { tenantId, isDeleted: { $ne: true } };

    const [projects, tasks, sprints] = await Promise.all([
      Project.find(filter).sort({ updatedAt: -1 }).lean(),
      Task.find({ tenantId, isDeleted: { $ne: true } })
        .populate('assignee', 'firstName lastName').lean(),
      Sprint.find({ tenantId, isActive: true }).lean(),
    ]);

    const totalProjects = projects.length;
    const portfolioValue = projects.reduce((s, p) => s + (p.contractValue || 0), 0);
    const expenditureToDate = projects.reduce((s, p) => s + (p.expenditureToDate || 0), 0);
    const expenditurePercent = portfolioValue > 0
      ? Math.round((expenditureToDate / portfolioValue) * 100) : 0;
    const reportsPending = projects.filter((p) => p.status === 'in_review').length;

    const mtefY1Total = projects.reduce((s, p) => s + (p.mtef?.year1Budget || 0), 0);
    const mtefY1Spent = expenditureToDate;
    const mtefY1Remaining = Math.max(0, mtefY1Total - mtefY1Spent);

    const stats = {
      totalProjects,
      portfolioValue,
      expenditureToDate,
      expenditurePercent,
      reportsPending,
      mtefYear1Total: mtefY1Total,
      mtefYear1Remaining: mtefY1Remaining,
    };

    const recentProjects = projects.slice(0, 5).map((p) => ({
      id: p._id.toHexString(),
      name: p.name,
      referenceCode: p.referenceCode || '',
      status: p.status,
      contractValue: p.contractValue || 0,
      percentComplete: p.percentComplete || 0,
      updatedAt: p.updatedAt ? p.updatedAt.toISOString() : new Date().toISOString(),
    }));

    const now = new Date();
    const outstandingTasks = tasks
      .filter((t) => t.status !== 'done' && t.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5)
      .map((t) => {
        const due = new Date(t.dueDate);
        const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
        let dueStatus = 'planning';
        if (diffDays < 0) dueStatus = 'danger';
        else if (diffDays <= 3) dueStatus = 'review';

        return {
          id: t._id.toHexString(),
          title: t.title,
          priority: t.priority,
          dueStatus,
          due: due.toISOString(),
          assigneeName: t.assignee && typeof t.assignee === 'object'
            ? `${t.assignee.firstName || ''} ${t.assignee.lastName || ''}`.trim() : null,
        };
      });

    const sprintProgress = sprints.map((s) => {
      const sprintTasks = tasks.filter(
        (t) => t.sprintId && t.sprintId.toString() === s._id.toString()
      );
      const doneTasks = sprintTasks.filter((t) => t.status === 'done').length;
      const progress = sprintTasks.length > 0
        ? Math.round((doneTasks / sprintTasks.length) * 100) : 0;

      return {
        name: s.name,
        sprint: `Sprint ${s.number}`,
        progress,
        status: s.isActive ? 'active' : 'planning',
        totalTasks: sprintTasks.length,
        doneTasks,
      };
    });

    res.json({
      data: { stats, recentProjects, outstandingTasks, sprintProgress },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMtefSummary = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const projects = await Project.find({ tenantId, isDeleted: { $ne: true } }).lean();
    const totalExpenditure = projects.reduce((s, p) => s + (p.expenditureToDate || 0), 0);

    const year1Budget = projects.reduce((s, p) => s + (p.mtef?.year1Budget || 0), 0);
    const year2Budget = projects.reduce((s, p) => s + (p.mtef?.year2Budget || 0), 0);
    const year3Budget = projects.reduce((s, p) => s + (p.mtef?.year3Budget || 0), 0);

    res.json({
      data: {
        year1: { budget: year1Budget, spent: totalExpenditure, remaining: Math.max(0, year1Budget - totalExpenditure) },
        year2: { budget: year2Budget, spent: 0, remaining: year2Budget },
        year3: { budget: year3Budget, spent: 0, remaining: year3Budget },
        total: { budget: year1Budget + year2Budget + year3Budget, spent: totalExpenditure },
      },
    });
  } catch (error) {
    console.error('MTEF summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPaymentForecastReport = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const year = parseInt(req.query.year) || new Date().getFullYear();

    const [forecasts, payments] = await Promise.all([
      PaymentForecast.find({ tenantId, year }).lean(),
      Payment.find({
        tenantId,
        paymentDate: {
          $gte: new Date(year, 0, 1),
          $lte: new Date(year, 11, 31),
        },
      }).lean(),
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = [];

    for (let m = 0; m < 12; m++) {
      const monthForecasts = forecasts.filter((f) => f.month === m + 1);
      const forecastTotal = monthForecasts.reduce((s, f) => s + (f.forecastAmount || 0), 0);

      const monthPayments = payments.filter((p) => {
        const d = new Date(p.paymentDate);
        return d.getMonth() === m;
      });
      const actualTotal = monthPayments.reduce((s, p) => s + (p.paymentAmount || 0), 0);

      data.push({
        month: monthNames[m],
        monthNum: m + 1,
        year,
        forecast: forecastTotal,
        actual: actualTotal,
      });
    }

    res.json({ data });
  } catch (error) {
    console.error('Payment forecast report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getProjectStatus = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const projects = await Project.find({ tenantId, isDeleted: { $ne: true } }).lean();

    const statusCounts = {};
    projects.forEach((p) => {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    });

    const distribution = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: projects.length > 0 ? Math.round((count / projects.length) * 100) : 0,
    }));

    res.json({ data: { total: projects.length, distribution } });
  } catch (error) {
    console.error('Project status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.generateReport = async (req, res) => {
  try {
    const reportId = `RPT-${Date.now().toString(36).toUpperCase()}`;
    res.json({ data: { reportId, status: 'completed', message: 'Report ready for download' } });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getReportStatus = async (req, res) => {
  res.json({ data: { reportId: req.params.reportId, status: 'completed' } });
};

exports.downloadReport = async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const projects = await Project.find({ tenantId, isDeleted: { $ne: true } }).lean();
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report-${req.params.reportId}.pdf`);
    doc.pipe(res);

    doc.fontSize(18).text('SONE Studios — Portfolio Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    const totalValue = projects.reduce((s, p) => s + (p.contractValue || 0), 0);
    const totalExpenditure = projects.reduce((s, p) => s + (p.expenditureToDate || 0), 0);

    doc.fontSize(12).text('Portfolio Summary', { underline: true });
    doc.fontSize(10)
      .text(`Total Projects: ${projects.length}`)
      .text(`Portfolio Value: R ${totalValue.toLocaleString()}`)
      .text(`Total Expenditure: R ${totalExpenditure.toLocaleString()}`)
      .text(`Balance: R ${(totalValue - totalExpenditure).toLocaleString()}`);
    doc.moveDown(2);

    projects.forEach((p, i) => {
      if (doc.y > 700) doc.addPage();
      doc.fontSize(11).text(`${i + 1}. ${p.name}`, { underline: true });
      doc.fontSize(9)
        .text(`Ref: ${p.referenceCode || 'N/A'} | Status: ${p.status}`)
        .text(`Value: R ${(p.contractValue || 0).toLocaleString()} | Spent: R ${(p.expenditureToDate || 0).toLocaleString()}`);
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
