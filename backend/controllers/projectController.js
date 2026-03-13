const Project = require('../models/Project');

// GET /api/projects
exports.getProjects = async (req, res) => {
  try {
    const tenantId = req.tenant ? req.tenant._id : null;
    const { page = 1, pageSize = 20, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const filter = {};
    if (tenantId) filter.tenantId = tenantId;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { referenceCode: { $regex: search, $options: 'i' } },
      ];
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [data, total] = await Promise.all([
      Project.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Project.countDocuments(filter),
    ]);

    const projects = data.map(formatProject);

    res.json({
      data: projects,
      total,
      page: parseInt(page),
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/projects/:id
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('projectManagerId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .lean();

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ data: formatProject(project) });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/projects
exports.createProject = async (req, res) => {
  try {
    const tenantId = req.tenant ? req.tenant._id : null;
    const projectData = {
      ...req.body,
      tenantId,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    };

    const project = await Project.create(projectData);
    res.status(201).json({ data: formatProject(project.toObject()) });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/projects/:id
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const updates = { ...req.body, updatedBy: req.user._id };
    Object.assign(project, updates);
    await project.save();

    res.json({ data: formatProject(project.toObject()) });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/projects/:id
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    await Project.findByIdAndDelete(req.params.id);
    res.json({ data: null, message: 'Project removed' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/projects/export/xlsx
exports.exportXlsx = async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const tenantId = req.tenant ? req.tenant._id : null;
    const filter = tenantId ? { tenantId } : {};

    const projects = await Project.find(filter).lean();

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

// GET /api/projects/export/pdf
exports.exportPdf = async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const tenantId = req.tenant ? req.tenant._id : null;
    const filter = tenantId ? { tenantId } : {};

    const projects = await Project.find(filter).lean();

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

// GET /api/projects/:projectId/activities
exports.getActivities = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId).lean();
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const activities = [];
    if (project.startDate && project.completionDate) {
      const totalDays = (new Date(project.completionDate) - new Date(project.startDate)) / (1000 * 60 * 60 * 24);
      const phases = ['Site Preparation', 'Foundation', 'Structure', 'MEP Installation', 'Finishing', 'Handover'];

      phases.forEach((name, i) => {
        const start = new Date(project.startDate);
        start.setDate(start.getDate() + Math.floor((totalDays / phases.length) * i));
        const end = new Date(project.startDate);
        end.setDate(end.getDate() + Math.floor((totalDays / phases.length) * (i + 1)));

        const pct = project.percentComplete || 0;
        const phaseThreshold = ((i + 1) / phases.length) * 100;
        let status = 'on_track';
        if (pct < phaseThreshold - 20) status = 'delayed';
        else if (pct < phaseThreshold - 5) status = 'at_risk';

        activities.push({
          id: `${project._id}-phase-${i}`,
          name,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          status,
        });
      });
    }

    res.json({ data: activities });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

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
    gpsLatitude: p.gpsLatitude || null,
    gpsLongitude: p.gpsLongitude || null,
    geoTecEngineer: p.geoTecEngineer || null,
    geoTecReportStatus: p.geoTecReportStatus || null,
    ddrStatus: p.ddrStatus || null,
    contractor: p.contractor || null,
    constructionStatus: p.constructionStatus || null,
    startDate: p.startDate ? p.startDate.toISOString ? p.startDate.toISOString() : p.startDate : null,
    completionDate: p.completionDate ? p.completionDate.toISOString ? p.completionDate.toISOString() : p.completionDate : null,
    percentComplete: p.percentComplete || 0,
    challenges: p.challenges || null,
    recommendation: p.recommendation || null,
    totalEmployees: p.totalEmployees || 0,
    roePercent: p.roePercent || 0,
    projectManagerId: p.projectManagerId ? p.projectManagerId.toString() : null,
    attachmentCount: p.attachmentCount || 0,
    createdAt: p.createdAt ? (p.createdAt.toISOString ? p.createdAt.toISOString() : p.createdAt) : null,
    updatedAt: p.updatedAt ? (p.updatedAt.toISOString ? p.updatedAt.toISOString() : p.updatedAt) : null,
  };
}
