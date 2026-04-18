
//  * Thin HTTP layer. The advance-stage endpoint handles the gate error
//  * specially — it must return the exact 422 shape from the spec:
//  *   { success: false, error: 'STAGE_GATE_FAILED', stage, missing: [...] }


const projectService = require('./project.service');
const {
  sendSuccess,
  sendCreated,
  sendStageGateFailed,
} = require('../../utils/apiResponse');

//  Projects 

const list = async (req, res) => {
  const result = await projectService.listProjects(req.tenant, req.query, req.user);
  return sendSuccess(res, result);
}; 

const getOne = async (req, res) => {
  const project = await projectService.getProject(req.tenant, req.params.id, req.user);
  return sendSuccess(res, { project });
};

const create = async (req, res) => {
  const project = await projectService.createProject(req.tenant, req.body, req.user.sub);
  return sendCreated(res, { project });
};

const update = async (req, res) => {
  const project = await projectService.updateProject(
    req.tenant, req.params.id, req.body, req.user
  );
  return sendSuccess(res, { project });
};

const remove = async (req, res) => {
  const result = await projectService.deleteProject(req.tenant, req.params.id);
  return sendSuccess(res, result);
};

//  Stage gate 

const getStageStatus = async (req, res) => {
  const result = await projectService.getStageStatus(req.tenant, req.params.id);
  return sendSuccess(res, result);
};

const getClientAccessCheck = async (req, res) => {
  const result = await projectService.getClientAccessCheck(
    req.tenant,
    req.params.id,
    req.clientAccess,
  );
  return sendSuccess(res, result);
};

/**
 * POST /:id/advance-stage
 *
 * On gate failure → 422 with spec-exact body.
 * On success (stages 1–5) → 200 with newStage.
 * On success (stage 6) → 200, project marked complete.
 */
const advanceStage = async (req, res) => {
  try {
    const result = await projectService.advanceStage(req.tenant, req.params.id, req.user.sub);

    return sendSuccess(res, result, result.completed ? 'Project completed' : `Advanced to Stage ${result.newStage}`);
  } catch (err) {
    // Gate failure — return the spec-exact 422 shape
    if (err.gateError) {
      return sendStageGateFailed(res, err.stage, err.missing, err.activitiesMissingImages);
    }
    throw err; // Re-throw for global error handler
  }
};

//  Payments 

const listPayments = async (req, res) => {
  const payments = await projectService.listPayments(req.tenant, req.params.id);
  return sendSuccess(res, { payments });
};

const addPayment = async (req, res) => {
  const payment = await projectService.addPayment(
    req.tenant, req.params.id, req.body, req.user.sub
  );
  return sendCreated(res, { payment });
};

const updatePayment = async (req, res) => {
  const payment = await projectService.updatePayment(
    req.tenant, req.params.id, req.params.payId, req.body
  );
  return sendSuccess(res, { payment });
};

//  Payment forecast 

const getPaymentForecast = async (req, res) => {
  const forecast = await projectService.getPaymentForecast(req.tenant, req.params.id);
  return sendSuccess(res, { forecast });
};

const upsertForecast = async (req, res) => {
  const entry = await projectService.upsertForecastEntry(req.tenant, req.params.id, req.body);
  return sendSuccess(res, { entry });
};

//  Aggregations 

const getBudgetSummary = async (req, res) => {
  const summary = await projectService.getBudgetSummary(req.tenant, req.query.deptId);
  return sendSuccess(res, { summary });
};

const listDeliverables = async (req, res) => {
  const stage = req.query.stage ? Number(req.query.stage) : undefined;
  const deliverables = await projectService.listDeliverables(req.tenant, req.params.id, stage);
  return sendSuccess(res, { deliverables });
};

const getDeliverable = async (req, res) => {
  const stage = req.query.stage ? Number(req.query.stage) : undefined;
  const deliverable = await projectService.getDeliverable(req.tenant, req.params.id, req.params.key, stage);
  return sendSuccess(res, { deliverable });
};

const uploadDeliverable = async (req, res) => {
  const stage = req.query.stage ? Number(req.query.stage) : undefined;
  const deliverable = await projectService.uploadDeliverable(
    req.tenant,
    req.params.id,
    req.params.key,
    req.body.fileId,
    req.user.sub,
    stage,
  );
  return sendSuccess(res, { deliverable });
};

const approveDeliverable = async (req, res) => {
  const stage = req.query.stage ? Number(req.query.stage) : undefined;
  const deliverable = await projectService.approveDeliverable(
    req.tenant,
    req.params.id,
    req.params.key,
    {
      userId: req.user.sub,
      role: req.tenantMembership?.role || req.user.role,
      name: req.user.fullName || req.user.name || null,
    },
    stage,
  );
  return sendSuccess(res, { deliverable });
};

const rejectDeliverable = async (req, res) => {
  const stage = req.query.stage ? Number(req.query.stage) : undefined;
  const deliverable = await projectService.rejectDeliverable(
    req.tenant,
    req.params.id,
    req.params.key,
    req.body.reason,
    {
      userId: req.user.sub,
      role: req.tenantMembership?.role || req.user.role,
      name: req.user.fullName || req.user.name || null,
    },
    stage,
  );
  return sendSuccess(res, { deliverable });
};

const listAppointments = async (req, res) => {
  const appointments = await projectService.listAppointments(req.tenant, req.params.id);
  return sendSuccess(res, { appointments });
};

const createAppointment = async (req, res) => {
  const appointment = await projectService.createAppointment(
    req.tenant,
    req.params.id,
    req.body,
    {
      userId: req.user.sub,
      role: req.tenantMembership?.role || req.user.role,
      name: req.user.fullName || req.user.name || null,
    },
  );
  return sendCreated(res, { appointment });
};

const updateAppointment = async (req, res) => {
  const appointment = await projectService.updateAppointment(
    req.tenant,
    req.params.id,
    req.params.appId,
    req.body,
  );
  return sendSuccess(res, { appointment });
};

const approveAppointmentStep = async (req, res) => {
  const appointment = await projectService.reviewAppointmentStep(
    req.tenant,
    req.params.id,
    req.params.appId,
    req.params.step,
    'approve',
    req.body,
    {
      userId: req.user.sub,
      role: req.tenantMembership?.role || req.user.role,
      name: req.user.fullName || req.user.name || null,
    },
  );
  return sendSuccess(res, { appointment });
};

const rejectAppointmentStep = async (req, res) => {
  const appointment = await projectService.reviewAppointmentStep(
    req.tenant,
    req.params.id,
    req.params.appId,
    req.params.step,
    'reject',
    req.body,
    {
      userId: req.user.sub,
      role: req.tenantMembership?.role || req.user.role,
      name: req.user.fullName || req.user.name || null,
    },
  );
  return sendSuccess(res, { appointment });
};

const getAppointmentStageStatus = async (req, res) => {
  const status = await projectService.getAppointmentStageStatus(req.tenant, req.params.id);
  return sendSuccess(res, status);
};

const listInterimPaymentCertificates = async (req, res) => {
  const certificates = await projectService.listInterimPaymentCertificates(req.tenant, req.params.id);
  return sendSuccess(res, { certificates });
};

const getInterimPaymentCertificate = async (req, res) => {
  const certificate = await projectService.getInterimPaymentCertificate(
    req.tenant,
    req.params.id,
    req.params.pcId,
  );
  return sendSuccess(res, { certificate });
};

const createInterimPaymentCertificate = async (req, res) => {
  const certificate = await projectService.createInterimPaymentCertificate(
    req.tenant,
    req.params.id,
    req.body,
    req.user.sub,
  );
  return sendCreated(res, { certificate });
};

const approveInterimPaymentCertificate = async (req, res) => {
  const certificate = await projectService.approveInterimPaymentCertificate(
    req.tenant,
    req.params.id,
    req.params.pcId,
    {
      userId: req.user.sub,
      role: req.tenantMembership?.role || req.user.role,
      name: req.user.fullName || req.user.name || null,
    },
    req.body.overrideReason,
  );
  return sendSuccess(res, { certificate });
};

const rejectInterimPaymentCertificate = async (req, res) => {
  const certificate = await projectService.rejectInterimPaymentCertificate(
    req.tenant,
    req.params.id,
    req.params.pcId,
    {
      userId: req.user.sub,
      role: req.tenantMembership?.role || req.user.role,
      name: req.user.fullName || req.user.name || null,
    },
    req.body.reason,
  );
  return sendSuccess(res, { certificate });
};

const listBillingPeriods = async (req, res) => {
  const billingPeriods = await projectService.listBillingPeriods(req.tenant, req.params.id);
  return sendSuccess(res, { billingPeriods });
};

const getBillingPeriodDetail = async (req, res) => {
  const billingPeriod = await projectService.getBillingPeriodDetail(
    req.tenant,
    req.params.id,
    req.params.period,
  );
  return sendSuccess(res, { billingPeriod });
};

const listCloseOutReports = async (req, res) => {
  const reports = await projectService.listCloseOutReports(req.tenant, req.params.id);
  return sendSuccess(res, { reports });
};

const createCloseOutReport = async (req, res) => {
  const report = await projectService.createCloseOutReport(
    req.tenant,
    req.params.id,
    req.body,
    req.user.sub,
  );
  return sendCreated(res, { report });
};

const approveCloseOutReport = async (req, res) => {
  const report = await projectService.approveCloseOutReport(
    req.tenant,
    req.params.id,
    req.params.reportType,
    {
      userId: req.user.sub,
      role: req.tenantMembership?.role || req.user.role,
      name: req.user.fullName || req.user.name || null,
    },
  );
  return sendSuccess(res, { report });
};

const rejectCloseOutReport = async (req, res) => {
  const report = await projectService.rejectCloseOutReport(
    req.tenant,
    req.params.id,
    req.params.reportType,
    req.body.reason,
    {
      userId: req.user.sub,
      role: req.tenantMembership?.role || req.user.role,
      name: req.user.fullName || req.user.name || null,
    },
  );
  return sendSuccess(res, { report });
};

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  getStageStatus,
  getClientAccessCheck,
  advanceStage,
  listPayments,
  addPayment,
  updatePayment,
  getPaymentForecast,
  upsertForecast,
  listDeliverables,
  getDeliverable,
  uploadDeliverable,
  approveDeliverable,
  rejectDeliverable,
  listAppointments,
  createAppointment,
  updateAppointment,
  approveAppointmentStep,
  rejectAppointmentStep,
  getAppointmentStageStatus,
  listInterimPaymentCertificates,
  getInterimPaymentCertificate,
  createInterimPaymentCertificate,
  approveInterimPaymentCertificate,
  rejectInterimPaymentCertificate,
  listBillingPeriods,
  getBillingPeriodDetail,
  listCloseOutReports,
  createCloseOutReport,
  approveCloseOutReport,
  rejectCloseOutReport,
  getBudgetSummary,
};