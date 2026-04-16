const mongoose = require('mongoose');
const Project = require('../projects/project.model');
const Task = require('../tasks/task.model');
const Sprint = require('../sprints/sprint.model');
const Grant = require('../grants/grant.model');
const Department = require('../departments/department.model');
const CalendarEvent = require('../calendar/calendarEvent.model');
const projectRepo = require('../projects/project.repository');
const { Payment, PaymentForecast } = projectRepo;
const Report = require('./report.model');

const getDashboardReport = async (tenant) => {
  const tid = tenant._id;

  const [budgetRows, paymentAgg, taskAgg, sprintCounts, grantAgg, departments, recentProjects, outstandingTasks, upcomingEvents, serviceCategories] = await Promise.all([
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
    Department.find({ tenantId: tid }).sort({ name: 1 }).lean(),
    Project.find({ tenantId: tid, deletedAt: null })
      .sort({ updatedAt: -1 })
      .limit(6)
      .populate('deptId', 'name')
      .lean(),
    Task.find({ tenantId: tid, status: { $ne: 'done' } })
      .sort({ dueDate: 1, updatedAt: -1 })
      .limit(8)
      .lean(),
    CalendarEvent.find({ tenantId: tid, date: { $gte: new Date() } })
      .sort({ date: 1 })
      .limit(8)
      .lean(),
    projectRepo.getServiceCategorySummary(tid),
  ]);

  const budget = budgetRows[0] || {};
  const payments = paymentAgg[0] || { totalPaid: 0, paymentCount: 0 };
  const grants = grantAgg[0] || { totalGrantValue: 0, totalDisbursed: 0, grantCount: 0 };

  const tasksByStatus = Object.fromEntries(taskAgg.map((t) => [t._id, t.count]));
  const now = Date.now();

  const departmentRows = departments.map((dept) => {
    const budgetValue = Number(dept.budgetTotal) || 0;
    const spentValue = Number(dept.budgetSpent) || 0;
    return {
      id: dept._id.toString(),
      name: dept.slug || dept.name,
      fullName: dept.name,
      deptName: dept.name,
      budget: budgetValue,
      totalBudget: budgetValue,
      spent: spentValue,
      totalExpenditure: spentValue,
      remaining: Math.max(0, budgetValue - spentValue),
    };
  });

  const projectRows = recentProjects.map((project) => ({
    id: project._id.toString(),
    name: project.name,
    dept: project.deptId?.name || project.localMunicipality || 'Unassigned',
    status:
      project.status === 'complete'
        ? 'completed'
        : project.status === 'on-hold'
          ? 'review'
          : project.status,
    updatedAt: project.updatedAt,
  }));

  const outstandingTaskRows = outstandingTasks.map((task) => {
    const dueTs = task.dueDate ? new Date(task.dueDate).getTime() : null;
    const daysUntilDue = dueTs == null ? null : Math.ceil((dueTs - now) / 86400000);
    return {
      id: task._id.toString(),
      title: task.title,
      dueStatus:
        daysUntilDue != null && daysUntilDue < 0
          ? 'danger'
          : daysUntilDue != null && daysUntilDue <= 7
            ? 'review'
            : 'planning',
      due: task.dueDate ? task.dueDate : task.updatedAt,
    };
  });

  const upcomingEventRows = upcomingEvents.map((event) => ({
    id: event._id.toString(),
    title: event.title,
    eventType: event.eventType,
    date: event.date,
    projectId: event.projectId ? event.projectId.toString() : undefined,
  }));

  const serviceCategoryRows = serviceCategories.map((row) => ({
    category: row.serviceCategory,
    totalValue: Number(row.totalBudget) || 0,
    disbursedToDate: Number(row.totalExpenditure) || 0,
    remaining: Number(row.totalBalance) || 0,
  }));

  return {
    kpis: {
      allocated: Number(budget.totalContractValue) || 0,
      spent: Number(budget.totalExpenditure) || 0,
      remaining: Number(budget.totalBalance) || 0,
    },
    departments: departmentRows,
    recentProjects: projectRows,
    outstandingTasks: outstandingTaskRows,
    upcomingEvents: upcomingEventRows,
    grants: {
      totalValue: Number(grants.totalGrantValue) || 0,
      disbursedToDate: Number(grants.totalDisbursed) || 0,
      remaining: Math.max(
        0,
        (Number(grants.totalGrantValue) || 0) - (Number(grants.totalDisbursed) || 0),
      ),
    },
    serviceCategories: serviceCategoryRows,
    budget,
    payments,
    tasksByStatus,
    activeSprints: sprintCounts,
    grantTotals: grants,
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

const getPaymentHistory = async (tenant) => {
  const payments = await Payment.find({ tenantId: tenant._id })
    .sort({ paymentDate: -1, createdAt: -1 })
    .populate('projectId', 'name')
    .lean();

  return payments.map((payment) => ({
    id: payment._id.toString(),
    tenantId: payment.tenantId.toString(),
    projectId: payment.projectId?._id?.toString?.() || payment.projectId?.toString?.(),
    projectName: payment.projectId?.name || 'N/A',
    consultantName: payment.contractType
      ? `${payment.contractType.charAt(0).toUpperCase()}${payment.contractType.slice(1)} payment`
      : 'Project payment',
    invoiceNumber: payment.certificateNo || payment._id.toString().slice(-8).toUpperCase(),
    paymentDate: payment.paymentDate,
    paymentAmount: payment.amount,
    paymentStatus: 'completed',
    createdAt: payment.createdAt,
  }));
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
  getPaymentHistory,
  persistGeneratedReport,
};
