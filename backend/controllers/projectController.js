const Project = require('../models/Project');
const Activity = require('../models/Activity');
const Payment = require('../models/Payment');
const PaymentForecast = require('../models/PaymentForecast');

function getTenantId(req) {
  return req.tenant ? req.tenant._id : null;
}

function formatProject(p) {
  return {
    id: (p._id || p.id).toString(),
    tenantId: p.tenantId ? p.tenantId.toString() : null,
    name: p.name,
    referenceCode: p.referenceCode || '',
    contractValue: p.contractValue || 0,
    expenditureToDate: p.expenditureToDate || 0,
    balance: (p.contractValue || 0) - (p.expenditureToDate || 0),
    status: p.status,
    contractTypes: p.contractTypes || [],
    gpsLatitude: p.gpsLatitude || null,
    gpsLongitude: p.gpsLongitude || null,
    geoTecEngineer: p.geoTecEngineer || null,
    geoTecReportStatus: p.geoTecReportStatus || null,
    ddrStatus: p.ddrStatus || null,
    contractor: p.contractor || null,
    constructionStatus: p.constructionStatus || null,
    startDate: p.startDate ? (p.startDate.toISOString ? p.startDate.toISOString() : p.startDate) : null,
    completionDate: p.completionDate ? (p.completionDate.toISOString ? p.completionDate.toISOString() : p.completionDate) : null,
    appointmentDate: p.appointmentDate ? (p.appointmentDate.toISOString ? p.appointmentDate.toISOString() : p.appointmentDate) : null,
    percentComplete: p.percentComplete || 0,
    challenges: p.challenges || null,
    recommendation: p.recommendation || null,
    totalEmployees: p.totalEmployees || 0,
    roePercent: p.roePercent || 0,
    projectManagerId: p.projectManagerId ? (typeof p.projectManagerId === 'object' ? p.projectManagerId._id?.toString() : p.projectManagerId.toString()) : null,
    projectManagerName: p.projectManagerId && typeof p.projectManagerId === 'object'
      ? `${p.projectManagerId.firstName || ''} ${p.projectManagerId.lastName || ''}`.trim() : null,
    attachmentCount: p.attachmentCount || 0,
    mtef: p.mtef || { year1Budget: 0, year2Budget: 0, year3Budget: 0 },
    description: p.description || '',
    createdAt: p.createdAt ? (p.createdAt.toISOString ? p.createdAt.toISOString() : p.createdAt) : null,
    updatedAt: p.updatedAt ? (p.updatedAt.toISOString ? p.updatedAt.toISOString() : p.updatedAt) : null,
  };
}

exports.getProjects = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const { page = 1, pageSize = 25, limit, status, search, sortBy = 'createdAt', sortOrder = 'desc', type } = req.query;
    const perPage = parseInt(limit || pageSize);
    const skip = (parseInt(page) - 1) * perPage;

    const filter = { tenantId, isDeleted: { $ne: true } };
    if (status) filter.status = status;
    if (type) filter.contractTypes = type;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { referenceCode: { $regex: search, $options: 'i' } },
        { contractor: { $regex: search, $options: 'i' } },
      ];
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [data, total] = await Promise.all([
      Project.find(filter)
        .populate('projectManagerId', 'firstName lastName email')
        .sort(sort).skip(skip).limit(perPage).lean(),
      Project.countDocuments(filter),
    ]);

    res.json({
      data: data.map(formatProject),
      total,
      page: parseInt(page),
      pageSize: perPage,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const project = await Project.findOne({ _id: req.params.id, tenantId, isDeleted: { $ne: true } })
      .populate('projectManagerId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .lean();

    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json({ data: formatProject(project) });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createProject = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const project = await Project.create({
      ...req.body,
      tenantId,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    res.status(201).json({ data: formatProject(project.toObject()) });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const project = await Project.findOne({ _id: req.params.id, tenantId, isDeleted: { $ne: true } });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    Object.assign(project, { ...req.body, updatedBy: req.user._id });
    await project.save();

    res.json({ data: formatProject(project.toObject()) });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const project = await Project.findOne({ _id: req.params.id, tenantId });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    project.isDeleted = true;
    await project.save();
    res.json({ data: null, message: 'Project removed' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getBudgetSummary = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const projects = await Project.find({ tenantId, isDeleted: { $ne: true } }).lean();
    const totalContractValue = projects.reduce((s, p) => s + (p.contractValue || 0), 0);
    const totalExpenditure = projects.reduce((s, p) => s + (p.expenditureToDate || 0), 0);
    const totalMtefY1 = projects.reduce((s, p) => s + (p.mtef?.year1Budget || 0), 0);
    const totalMtefY2 = projects.reduce((s, p) => s + (p.mtef?.year2Budget || 0), 0);
    const totalMtefY3 = projects.reduce((s, p) => s + (p.mtef?.year3Budget || 0), 0);

    res.json({
      data: {
        totalProjects: projects.length,
        totalContractValue,
        totalExpenditure,
        totalBalance: totalContractValue - totalExpenditure,
        mtef: { year1: totalMtefY1, year2: totalMtefY2, year3: totalMtefY3 },
      },
    });
  } catch (error) {
    console.error('Budget summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── Activities CRUD ─────────────────────────────────────────────────────

function formatActivity(a) {
  const obj = a.toObject ? a.toObject() : a;
  return {
    id: (obj._id || obj.id).toString(),
    tenantId: obj.tenantId ? obj.tenantId.toString() : null,
    projectId: obj.projectId ? obj.projectId.toString() : null,
    name: obj.name,
    startDate: obj.startDate ? (obj.startDate.toISOString ? obj.startDate.toISOString() : obj.startDate) : null,
    endDate: obj.endDate ? (obj.endDate.toISOString ? obj.endDate.toISOString() : obj.endDate) : null,
    status: obj.status,
    scheduleDate: obj.scheduleDate ? (obj.scheduleDate.toISOString ? obj.scheduleDate.toISOString() : obj.scheduleDate) : null,
    createdAt: obj.createdAt ? (obj.createdAt.toISOString ? obj.createdAt.toISOString() : obj.createdAt) : null,
  };
}

exports.getActivities = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const projectId = req.params.projectId || req.params.id;
    const project = await Project.findOne({ _id: projectId, tenantId, isDeleted: { $ne: true } });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const activities = await Activity.find({ tenantId, projectId }).sort({ startDate: 1 });
    res.json({ data: activities.map(formatActivity) });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createActivity = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const projectId = req.params.projectId || req.params.id;
    const project = await Project.findOne({ _id: projectId, tenantId, isDeleted: { $ne: true } });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const activity = await Activity.create({ ...req.body, tenantId, projectId });
    res.status(201).json({ data: formatActivity(activity) });
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateActivity = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const activity = await Activity.findOne({ _id: req.params.actId, tenantId });
    if (!activity) return res.status(404).json({ message: 'Activity not found' });

    Object.assign(activity, req.body);
    await activity.save();
    res.json({ data: formatActivity(activity) });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteActivity = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const activity = await Activity.findOneAndDelete({ _id: req.params.actId, tenantId });
    if (!activity) return res.status(404).json({ message: 'Activity not found' });

    res.json({ data: null, message: 'Activity removed' });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── Payments CRUD ───────────────────────────────────────────────────────

function formatPayment(p) {
  const obj = p.toObject ? p.toObject() : p;
  return {
    id: (obj._id || obj.id).toString(),
    tenantId: obj.tenantId ? obj.tenantId.toString() : null,
    projectId: obj.projectId ? obj.projectId.toString() : null,
    projectName: obj.projectName || null,
    consultantName: obj.consultantName,
    invoiceNumber: obj.invoiceNumber,
    paymentDate: obj.paymentDate ? (obj.paymentDate.toISOString ? obj.paymentDate.toISOString() : obj.paymentDate) : null,
    paymentAmount: obj.paymentAmount,
    paymentStatus: obj.paymentStatus,
    createdAt: obj.createdAt ? (obj.createdAt.toISOString ? obj.createdAt.toISOString() : obj.createdAt) : null,
  };
}

exports.getProjectPayments = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const projectId = req.params.id;
    const project = await Project.findOne({ _id: projectId, tenantId, isDeleted: { $ne: true } });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const payments = await Payment.find({ tenantId, projectId }).sort({ paymentDate: -1 });
    res.json({ data: payments.map(formatPayment) });
  } catch (error) {
    console.error('Get project payments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createProjectPayment = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const projectId = req.params.id;
    const project = await Project.findOne({ _id: projectId, tenantId, isDeleted: { $ne: true } });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const payment = await Payment.create({
      ...req.body,
      tenantId,
      projectId,
      projectName: project.name,
    });

    res.status(201).json({ data: formatPayment(payment) });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProjectPayment = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const payment = await Payment.findOne({ _id: req.params.payId, tenantId, projectId: req.params.id });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    Object.assign(payment, req.body);
    await payment.save();
    res.json({ data: formatPayment(payment) });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── Payment Forecast ────────────────────────────────────────────────────

exports.getPaymentForecast = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const projectId = req.params.id;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const forecasts = await PaymentForecast.find({ tenantId, projectId, year }).sort({ month: 1 });

    const months = [];
    for (let m = 1; m <= 12; m++) {
      const entry = forecasts.find((f) => f.month === m);
      months.push({
        month: m,
        year,
        forecastAmount: entry ? entry.forecastAmount : 0,
        actualAmount: entry ? entry.actualAmount : 0,
      });
    }

    res.json({ data: months });
  } catch (error) {
    console.error('Get payment forecast error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.upsertPaymentForecast = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const projectId = req.params.id;
    const { year, month, forecastAmount, actualAmount } = req.body;

    const forecast = await PaymentForecast.findOneAndUpdate(
      { tenantId, projectId, year, month },
      { tenantId, projectId, year, month, forecastAmount, actualAmount },
      { upsert: true, new: true }
    );

    res.json({ data: forecast });
  } catch (error) {
    console.error('Upsert forecast error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── Exports ─────────────────────────────────────────────────────────────

exports.exportXlsx = async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const projects = await Project.find({ tenantId, isDeleted: { $ne: true } }).lean();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Projects');

    sheet.columns = [
      { header: 'Reference', key: 'referenceCode', width: 15 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Contract Value', key: 'contractValue', width: 18 },
      { header: 'Expenditure', key: 'expenditureToDate', width: 18 },
      { header: 'Balance', key: 'balance', width: 18 },
      { header: '% Complete', key: 'percentComplete', width: 12 },
      { header: 'Contractor', key: 'contractor', width: 25 },
    ];

    projects.forEach((p) => {
      sheet.addRow({
        referenceCode: p.referenceCode || '',
        name: p.name,
        status: p.status,
        contractValue: p.contractValue || 0,
        expenditureToDate: p.expenditureToDate || 0,
        balance: (p.contractValue || 0) - (p.expenditureToDate || 0),
        percentComplete: p.percentComplete || 0,
        contractor: p.contractor || '',
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=projects.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export XLSX error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.exportPdf = async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const projects = await Project.find({ tenantId, isDeleted: { $ne: true } }).lean();
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=projects.pdf');
    doc.pipe(res);

    doc.fontSize(18).text('Project Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    projects.forEach((p, i) => {
      if (doc.y > 700) doc.addPage();
      doc.fontSize(12).text(`${i + 1}. ${p.name}`, { underline: true });
      doc.fontSize(10)
        .text(`Reference: ${p.referenceCode || 'N/A'}`)
        .text(`Status: ${p.status}`)
        .text(`Contract Value: R ${(p.contractValue || 0).toLocaleString()}`)
        .text(`Expenditure: R ${(p.expenditureToDate || 0).toLocaleString()}`)
        .text(`Progress: ${p.percentComplete || 0}%`);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
