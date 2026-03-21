const Project = require('../models/Project');
const { CalendarEvent } = require('../models/models');
const { checkStageGate, getStageStatus } = require('../services/stageGate.service');

// ─── List projects ────────────────────────────────────────────────────────────
const listProjects = async (req, res) => {
  const { tenantId, role } = req.user;
  const {
    status, serviceCategory, localMunicipality, stage,
    deptId, search, page = 1, limit = 20,
  } = req.query;

  const filter = { tenantId, isDeleted: false };

  if (status)            filter.status = status;
  if (serviceCategory)   filter.serviceCategory = serviceCategory;
  if (localMunicipality) filter.localMunicipality = localMunicipality;
  if (stage)             filter.currentStage = parseInt(stage);
  if (deptId)            filter.deptId = deptId;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { refCode: { $regex: search, $options: 'i' } },
      { idpProjectNo: { $regex: search, $options: 'i' } },
    ];
  }

  // CLIENT_TEMP: scope to their projects only
  if (role === 'CLIENT_TEMP' && req.temporaryAccess) {
    filter._id = { $in: req.temporaryAccess.projectIds };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [projects, total] = await Promise.all([
    Project.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('projectManager', 'fullName email avatarUrl')
      .lean(),
    Project.countDocuments(filter),
  ]);

  res.json({
    data: projects,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
  });
};

// ─── Get single project ───────────────────────────────────────────────────────
const getProject = async (req, res) => {
  const { tenantId, role } = req.user;
  const project = await Project.findOne({ _id: req.params.id, tenantId, isDeleted: false })
    .populate('projectManager', 'fullName email avatarUrl')
    .populate('teamMembers', 'fullName email avatarUrl');

  if (!project) return res.status(404).json({ error: 'Project not found.' });

  // Strip financial data from CLIENT_TEMP
  const data = project.toObject();
  if (role === 'CLIENT_TEMP') {
    data.contractValue = null;
    data.expenditureToDate = null;
    data.balance = null;
    data._financialRestricted = true;
  }

  res.json(data);
};

// ─── Create project ───────────────────────────────────────────────────────────
const createProject = async (req, res) => {
  const { tenantId } = req.user;
  const project = await Project.create({
    ...req.body,
    tenantId,
    createdBy: req.user.id,
    currentStage: 1,
  });
  res.status(201).json(project);
};

// ─── Update project ───────────────────────────────────────────────────────────
const updateProject = async (req, res) => {
  const { tenantId } = req.user;
  // Capture before state for audit log
  req.auditBefore = await Project.findOne({ _id: req.params.id, tenantId }).lean();

  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, tenantId, isDeleted: false },
    { ...req.body },
    { new: true, runValidators: true }
  );
  if (!project) return res.status(404).json({ error: 'Project not found.' });
  res.json(project);
};

// ─── Soft delete project ──────────────────────────────────────────────────────
const deleteProject = async (req, res) => {
  const { tenantId } = req.user;
  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, tenantId, isDeleted: false },
    { isDeleted: true, deletedAt: new Date(), deletedBy: req.user.id },
    { new: true }
  );
  if (!project) return res.status(404).json({ error: 'Project not found.' });
  res.json({ message: 'Project deleted.' });
};

// ─── Budget summary (dashboard KPIs) ─────────────────────────────────────────
const getBudgetSummary = async (req, res) => {
  const { tenantId } = req.user;
  const result = await Project.aggregate([
    { $match: { tenantId: require('mongoose').Types.ObjectId(tenantId), isDeleted: false } },
    { $group: {
      _id: null,
      totalContractValue: { $sum: '$contractValue' },
      totalExpenditure:   { $sum: '$expenditureToDate' },
      totalBalance:       { $sum: '$balance' },
      projectCount:       { $sum: 1 },
      activeCount:        { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
      completeCount:      { $sum: { $cond: [{ $eq: ['$status', 'complete'] }, 1, 0] } },
    }},
  ]);
  res.json(result[0] || {});
};

// ─── Get stage status ─────────────────────────────────────────────────────────
const getStageStatusHandler = async (req, res) => {
  const { tenantId } = req.user;
  const project = await Project.findOne({ _id: req.params.id, tenantId, isDeleted: false });
  if (!project) return res.status(404).json({ error: 'Project not found.' });

  const status = await getStageStatus(project, tenantId);
  res.json(status);
};

// ─── Advance stage ────────────────────────────────────────────────────────────
const advanceStage = async (req, res) => {
  const { tenantId } = req.user;
  const project = await Project.findOne({ _id: req.params.id, tenantId, isDeleted: false });
  if (!project) return res.status(404).json({ error: 'Project not found.' });

  if (project.currentStage === 6) {
    return res.status(400).json({ error: 'Project is already at the final stage.' });
  }
  if (project.status === 'complete') {
    return res.status(400).json({ error: 'Project is already complete.' });
  }

  // Check the gate for the current stage
  const { passed, missing } = await checkStageGate(project._id, tenantId, project.currentStage);

  if (!passed) {
    return res.status(422).json({
      success: false,
      error: 'STAGE_GATE_FAILED',
      stage: project.currentStage,
      missing,
    });
  }

  // Record history snapshot
  const File = require('../models/File');
  const stageDocs = await File.find({
    tenantId, projectId: project._id, stage: project.currentStage, isDeleted: false
  }).select('_id');

  project.stageHistory.push({
    stage: project.currentStage,
    advancedAt: new Date(),
    advancedBy: req.user.id,
    documentsSnapshot: stageDocs.map(f => f._id),
  });

  const previousStage = project.currentStage;
  project.currentStage = previousStage + 1;

  // Stage 6 passed → mark complete
  if (project.currentStage === 6) {
    const finalGate = await checkStageGate(project._id, tenantId, 6);
    if (finalGate.passed) {
      project.status = 'complete';
    }
  }

  await project.save();

  // Auto-generate CalendarEvent
  await CalendarEvent.create({
    tenantId,
    projectId: project._id,
    title: `Stage ${previousStage} Complete — ${project.name}`,
    eventType: 'stage_advanced',
    date: new Date(),
    allDay: true,
    linkedEntity: { type: 'project', id: project._id },
    autoGenerated: true,
    createdBy: req.user.id,
  });

  res.json({
    success: true,
    previousStage,
    currentStage: project.currentStage,
    status: project.status,
    message: `Advanced to Stage ${project.currentStage}.`,
  });
};

// ─── Payment forecast ─────────────────────────────────────────────────────────
const getPaymentForecast = async (req, res) => {
  const { tenantId } = req.user;
  const { PaymentForecast } = require('../models/models');
  const forecasts = await PaymentForecast.find({ tenantId, projectId: req.params.id }).sort('month');
  res.json(forecasts);
};

const upsertPaymentForecast = async (req, res) => {
  const { tenantId } = req.user;
  const { PaymentForecast } = require('../models/models');
  const { month, forecastAmount, actualAmount } = req.body;
  const forecast = await PaymentForecast.findOneAndUpdate(
    { tenantId, projectId: req.params.id, month },
    { forecastAmount, actualAmount },
    { new: true, upsert: true, runValidators: true }
  );
  res.json(forecast);
};

// ─── Payments ─────────────────────────────────────────────────────────────────
const listPayments = async (req, res) => {
  const { tenantId } = req.user;
  const { Payment } = require('../models/models');
  const payments = await Payment.find({ tenantId, projectId: req.params.id }).sort('-paymentDate');
  res.json(payments);
};

const addPayment = async (req, res) => {
  const { tenantId } = req.user;
  const { Payment } = require('../models/models');
  const payment = await Payment.create({
    ...req.body,
    tenantId,
    projectId: req.params.id,
    createdBy: req.user.id,
  });

  // Update project expenditure
  await Project.findByIdAndUpdate(req.params.id, {
    $inc: { expenditureToDate: payment.amount },
  });

  // Auto-generate CalendarEvent
  await CalendarEvent.create({
    tenantId,
    projectId: req.params.id,
    title: `Payment: R${(payment.amount / 100).toLocaleString('en-ZA')}`,
    eventType: 'payment',
    date: payment.paymentDate,
    allDay: true,
    linkedEntity: { type: 'project', id: req.params.id },
    autoGenerated: true,
    createdBy: req.user.id,
  });

  res.status(201).json(payment);
};

module.exports = {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getBudgetSummary,
  getStageStatusHandler,
  advanceStage,
  getPaymentForecast,
  upsertPaymentForecast,
  listPayments,
  addPayment,
};
