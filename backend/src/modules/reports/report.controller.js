const reportService = require('./report.service');
const { sendSuccess, sendCreated } = require('../../utils/apiResponse');

const dashboardReport = async (req, res) => {
  const data = await reportService.getDashboardReport(req.tenant);
  return sendSuccess(res, data);
};

const deptSummary = async (req, res) => {
  const data = await reportService.getDeptSummary(req.tenant, req.query.deptId);
  return sendSuccess(res, data);
};

const paymentForecast = async (req, res) => {
  const data = await reportService.getPaymentForecast(req.tenant);
  return sendSuccess(res, data);
};

const projectStatus = async (req, res) => {
  const data = await reportService.getProjectStatus(req.tenant);
  return sendSuccess(res, { byStatus: data });
};

const sprintBurndown = async (req, res) => {
  const data = await reportService.getSprintBurndown(req.tenant);
  return sendSuccess(res, { sprints: data });
};

const grantsSummary = async (req, res) => {
  const data = await reportService.getGrantsSummary(req.tenant);
  return sendSuccess(res, data);
};

const generateReport = async (req, res) => {
  const { reportType, filters, format } = req.body;

  let data;
  switch (reportType) {
    case 'dashboard':
      data = await reportService.getDashboardReport(req.tenant);
      break;
    case 'dept-summary': {
      const deptId = filters?.deptId;
      if (!deptId) {
        throw Object.assign(new Error('filters.deptId is required for dept-summary'), { status: 400 });
      }
      data = await reportService.getDeptSummary(req.tenant, deptId);
      break;
    }
    case 'payment-forecast':
      data = await reportService.getPaymentForecast(req.tenant);
      break;
    case 'project-status':
      data = { byStatus: await reportService.getProjectStatus(req.tenant) };
      break;
    case 'sprint-burndown':
      data = { sprints: await reportService.getSprintBurndown(req.tenant) };
      break;
    case 'grants-summary':
      data = await reportService.getGrantsSummary(req.tenant);
      break;
    default:
      throw Object.assign(new Error('Unsupported report type'), { status: 400 });
  }

  const saved = await reportService.persistGeneratedReport(
    req.tenant,
    req.user.sub,
    reportType,
    filters,
    format,
    data,
  );

  return sendCreated(res, { report: saved });
};

module.exports = {
  dashboardReport,
  deptSummary,
  paymentForecast,
  projectStatus,
  sprintBurndown,
  grantsSummary,
  generateReport,
};
