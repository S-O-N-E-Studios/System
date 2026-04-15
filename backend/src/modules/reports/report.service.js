const mongoose = require('mongoose');
const Project = require('../projects/project.model');
const Task = require('../tasks/task.model');
const Sprint = require('../sprints/sprint.model');
const Grant = require('../grants/grant.model');
const projectRepo = require('../projects/project.repository');
const { Payment, PaymentForecast } = projectRepo;
const Report = require('./report.model');

const getDashboardReport = async (tenant) => {
  const tid = tenant._id;

  const [budgetRows, paymentAgg, taskAgg, sprintCounts, grantAgg] = await Promise.all([
    projectRepo.getBudgetSummary(tid),
    Payment.aggregate([
      { $match: { tenantId: tid } },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: '$amount' },
          paymentCount: { $sum: 1 },
        },
      },
    ]),
    Task.aggregate([
      { $match: { tenantId: tid } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
    Sprint.countDocuments({ tenantId: tid, status: 'active' }),
    Grant.aggregate([
      { $match: { tenantId: tid } },
      {
        $group: {
          _id: null,
          totalGrantValue: { $sum: '$totalValue' },
          totalDisbursed: { $sum: '$disbursedToDate' },
          grantCount: { $sum: 1 },
        },
      },
    ]),
  ]);

  const budget = budgetRows[0] || {};
  const payments = paymentAgg[0] || { totalPaid: 0, paymentCount: 0 };
  const grants = grantAgg[0] || { totalGrantValue: 0, totalDisbursed: 0, grantCount: 0 };

  const tasksByStatus = Object.fromEntries(taskAgg.map((t) => [t._id, t.count]));

  return {
    budget,
    payments,
    tasksByStatus,
    activeSprints: sprintCounts,
    grants,
  };
};

const getDeptSummary = async (tenant, deptId) => {
  const tid = tenant._id;
  const did = new mongoose.Types.ObjectId(deptId);

  const rows = await Project.aggregate([
    {
      $match: {
        tenantId: tid,
        deptId: did,
        deletedAt: null,
      },
    },
    {
      $group: {
        _id: null,
        projectCount: { $sum: 1 },
        totalContractValue: { $sum: '$contractValueAdjusted' },
        totalExpenditure: { $sum: '$expenditureToDate' },
        byStatus: {
          $push: '$status',
        },
      },
    },
    {
      $project: {
        _id: 0,
        projectCount: 1,
        totalContractValue: 1,
        totalExpenditure: 1,
        totalBalance: { $subtract: ['$totalContractValue', '$totalExpenditure'] },
        byStatus: 1,
      },
    },
  ]);

  const summary = rows[0] || {
    projectCount: 0,
    totalContractValue: 0,
    totalExpenditure: 0,
    totalBalance: 0,
    byStatus: [],
  };

  const statusCounts = summary.byStatus.reduce((acc, s) => {
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  delete summary.byStatus;
  summary.projectsByStatus = statusCounts;

  return { deptId, ...summary };
};

const getPaymentForecast = async (tenant) => {
  const tid = tenant._id;

  const [forecast, actuals] = await Promise.all([
    PaymentForecast.aggregate([
      { $match: { tenantId: tid } },
      {
        $group: {
          _id: { month: '$month', contractType: '$contractType' },
          forecastAmount: { $sum: '$forecastAmount' },
          actualAmount: { $sum: '$actualAmount' },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]),
    Payment.aggregate([
      { $match: { tenantId: tid } },
      {
        $group: {
          _id: {
            month: {
              $dateToString: { format: '%Y-%m', date: '$paymentDate' },
            },
            contractType: '$contractType',
          },
          paidAmount: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]),
  ]);

  return { forecastByMonth: forecast, paymentsByMonth: actuals };
};

const getProjectStatus = async (tenant) => {
  const tid = tenant._id;
  return Project.aggregate([
    { $match: { tenantId: tid, deletedAt: null } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        contractValue: { $sum: '$contractValueAdjusted' },
        expenditure: { $sum: '$expenditureToDate' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

const getSprintBurndown = async (tenant) => {
  const tid = tenant._id;

  const sprints = await Sprint.find({ tenantId: tid })
    .sort({ endDate: -1 })
    .limit(12)
    .lean();

  const sprintIds = sprints.map((s) => s._id);

  const taskAgg = await Task.aggregate([
    {
      $match: {
        tenantId: tid,
        sprintId: { $in: sprintIds },
      },
    },
    {
      $group: {
        _id: { sprintId: '$sprintId', status: '$status' },
        count: { $sum: 1 },
      },
    },
  ]);

  const bySprint = {};
  for (const s of sprintIds) {
    bySprint[s.toString()] = { todo: 0, 'in-progress': 0, review: 0, done: 0, total: 0 };
  }
  for (const row of taskAgg) {
    const sid = row._id.sprintId.toString();
    if (!bySprint[sid]) continue;
    const st = row._id.status;
    bySprint[sid][st] = row.count;
    bySprint[sid].total += row.count;
  }

  return sprints.map((sp) => {
    const t = bySprint[sp._id.toString()] || { total: 0, done: 0 };
    const completionRate = t.total ? t.done / t.total : 0;
    return {
      sprint: { _id: sp._id, name: sp.name, startDate: sp.startDate, endDate: sp.endDate, status: sp.status },
      tasks: t,
      completionRate,
    };
  });
};

const getGrantsSummary = async (tenant) => {
  const tid = tenant._id;
  const byStatus = await Grant.aggregate([
    { $match: { tenantId: tid } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalValue: { $sum: '$totalValue' },
        disbursedToDate: { $sum: '$disbursedToDate' },
        allocatedToProjects: { $sum: '$allocatedToProjects' },
      },
    },
  ]);

  const totals = await Grant.aggregate([
    { $match: { tenantId: tid } },
    {
      $group: {
        _id: null,
        totalValue: { $sum: '$totalValue' },
        disbursedToDate: { $sum: '$disbursedToDate' },
        grantCount: { $sum: 1 },
      },
    },
  ]);

  return {
    byStatus,
    totals: totals[0] || { totalValue: 0, disbursedToDate: 0, grantCount: 0 },
  };
};

const persistGeneratedReport = async (tenant, userId, reportType, filters, format, data) =>
  Report.create({
    tenantId: tenant._id,
    reportType,
    generatedBy: userId,
    filters: filters || {},
    data,
    format: format || 'json',
  });

module.exports = {
  getDashboardReport,
  getDeptSummary,
  getPaymentForecast,
  getProjectStatus,
  getSprintBurndown,
  getGrantsSummary,
  persistGeneratedReport,
};
