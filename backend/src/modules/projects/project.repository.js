
//  * All DB queries for projects, payments, and payment forecasts.
//  * Every query is scoped to tenantId — never queries across tenants.


const mongoose = require('mongoose');
const Project  = require('./project.model');
const { Payment, PaymentForecast } = require('../payments/payment.model');

const withLifecycleProgress = (project) => {
  if (!project || typeof project !== 'object') return project;
  const stage = Number(project.currentStage);
  const bounded = Number.isFinite(stage) ? Math.max(0, Math.min(10, Math.round(stage))) : 0;
  return {
    ...project,
    percentComplete: Math.round((bounded / 10) * 100),
  };
};

//  Project queries 

const buildProjectFilter = (tenantId, query = {}) => {
  const filter = { tenantId, deletedAt: null };

  if (query.status)            filter.status            = query.status;
  if (query.serviceCategory)   filter.serviceCategory   = query.serviceCategory;
  if (query.localMunicipality) filter.localMunicipality = query.localMunicipality;
  if (query.deptId)            filter.deptId            = query.deptId;
  if (query.stage)             filter.currentStage      = parseInt(query.stage, 10);
  if (query.contractType)      filter.contractTypes     = query.contractType;

  if (query.search) {
    filter.$or = [
      { name:         { $regex: query.search, $options: 'i' } },
      { refCode:      { $regex: query.search, $options: 'i' } },
      { idpProjectNo: { $regex: query.search, $options: 'i' } },
    ];
  }

  return filter;
};

const findProjects = async (tenantId, query = {}) => {
  const filter = buildProjectFilter(tenantId, query);
  const skip   = ((query.page || 1) - 1) * (query.limit || 20);

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit || 20)
      .populate('projectManager', 'fullName email avatarUrl')
      .lean(),
    Project.countDocuments(filter),
  ]);

  return { projects: projects.map(withLifecycleProgress), total };
};

// CLIENT_TEMP: only return projects in their explicit list
const findProjectsForClient = async (tenantId, projectIds) => {
  const projects = await Project.find({
    tenantId,
    _id:       { $in: projectIds },
    deletedAt: null,
  })
    .populate('projectManager', 'fullName email')
    .lean();

  // Strip financial fields for client view
  return projects.map((project) => withLifecycleProgress(stripFinancialFields(project)));
};

const stripFinancialFields = (project) => {
  const p = { ...project };
  delete p.contractValue;
  delete p.expenditureToDate;
  return p;
};

const findById = (id, tenantId) =>
  Project.findOne({ _id: id, tenantId, deletedAt: null })
    .populate('projectManager', 'fullName email avatarUrl')
    .populate('teamMembers',    'fullName email avatarUrl');

const findByIdLean = (id, tenantId) =>
  Project.findOne({ _id: id, tenantId, deletedAt: null })
    .lean()
    .then((project) => withLifecycleProgress(project));

const create = (data) => Project.create(data);

const updateById = (id, tenantId, updates) =>
  Project.findOneAndUpdate(
    { _id: id, tenantId, deletedAt: null },
    updates,
    { new: true, runValidators: true }
  );

const softDelete = (id, tenantId) =>
  Project.findOneAndUpdate(
    { _id: id, tenantId },
    { deletedAt: new Date() },
    { new: true }
  );

// Budget KPI summary for dashboard
const getBudgetSummary = (tenantId, deptId = null) => {
  const match = { tenantId, deletedAt: null };
  if (deptId) match.deptId = new mongoose.Types.ObjectId(deptId);

  return Project.aggregate([
    { $match: match },
    {
      $group: {
        _id:                null,
        totalContractValue: { $sum: '$contractValueAdjusted' },
        totalExpenditure:   { $sum: '$expenditureToDate' },
        projectCount:       { $sum: 1 },
        activeCount:        { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        completeCount:      { $sum: { $cond: [{ $eq: ['$status', 'complete'] }, 1, 0] } },
      },
    },
    {
      $project: {
        _id:                0,
        totalContractValue: 1,
        totalExpenditure:   1,
        totalBalance:       { $subtract: ['$totalContractValue', '$totalExpenditure'] },
        projectCount:       1,
        activeCount:        1,
        completeCount:      1,
      },
    },
  ]);
};

// Service category summary for Normal Services screen
const getServiceCategorySummary = (tenantId) =>
  Project.aggregate([
    { $match: { tenantId, deletedAt: null } },
    {
      $group: {
        _id:               '$serviceCategory',
        projectCount:      { $sum: 1 },
        totalBudget:       { $sum: '$contractValueAdjusted' },
        totalExpenditure:  { $sum: '$expenditureToDate' },
      },
    },
    {
      $project: {
        serviceCategory:  '$_id',
        _id:              0,
        projectCount:     1,
        totalBudget:      1,
        totalExpenditure: 1,
        totalBalance:     { $subtract: ['$totalBudget', '$totalExpenditure'] },
      },
    },
  ]);

// IDP view data for provincial tenants
const getIdpData = (tenantId, filters = {}) => {
  const match = { tenantId, deletedAt: null, idpProjectNo: { $ne: null } };
  if (filters.localMunicipality) match.localMunicipality = filters.localMunicipality;
  if (filters.serviceCategory)   match.serviceCategory   = filters.serviceCategory;
  if (filters.stage)             match.currentStage      = parseInt(filters.stage, 10);
  if (filters.status)            match.status            = filters.status;

  return Project.find(match)
    .sort({ localMunicipality: 1, idpProjectNo: 1 })
    .populate('projectManager', 'fullName')
    .lean();
};

//  Payment queries 

const findPayments = (tenantId, projectId) =>
  Payment.find({ tenantId, projectId }).sort({ paymentDate: -1 });

const findPaymentById = (id, tenantId, projectId) =>
  Payment.findOne({ _id: id, tenantId, projectId });

const createPayment = (data) => Payment.create(data);

const updatePayment = (id, tenantId, projectId, updates) =>
  Payment.findOneAndUpdate(
    { _id: id, tenantId, projectId },
    updates,
    { new: true, runValidators: true }
  );

//  Payment forecast queries 

const findForecast = (tenantId, projectId) =>
  PaymentForecast.find({ tenantId, projectId }).sort({ month: 1, contractType: 1 });

const upsertForecastEntry = (tenantId, projectId, month, contractType, forecastAmount) =>
  PaymentForecast.findOneAndUpdate(
    { tenantId, projectId, month, contractType },
    { $set: { forecastAmount } },
    { upsert: true, new: true, runValidators: true }
  );

module.exports = {
  findProjects,
  findProjectsForClient,
  stripFinancialFields,
  findById,
  findByIdLean,
  create,
  updateById,
  softDelete,
  getBudgetSummary,
  getServiceCategorySummary,
  getIdpData,
  findPayments,
  findPaymentById,
  createPayment,
  updatePayment,
  findForecast,
  upsertForecastEntry,
  Payment,
  PaymentForecast,
};