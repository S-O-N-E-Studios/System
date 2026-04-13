
//  * Thin HTTP layer. The advance-stage endpoint handles the gate error
//  * specially — it must return the exact 422 shape from the spec:
//  *   { success: false, error: 'STAGE_GATE_FAILED', stage, missing: [...] }


const projectService = require('./project.service');
const {
  sendSuccess,
  sendCreated,
  sendError,
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

/**
 * POST /:id/advance-stage
 *
 * On gate failure → 422 with spec-exact body.
 * On success (stages 1–5) → 200 with newStage.
 * On success (stage 6) → 200, project marked complete.
 */
const advanceStage = async (req, res) => {
  try {
    // Check current stage first to route to the right handler
    const { projectId: _projectId } = { projectId: req.params.id };
    const Project = require('./project.model');
    const project = await Project.findOne({
      _id:       req.params.id,
      tenantId:  req.tenant._id,
      deletedAt: null,
    }).select('currentStage');

    if (!project) {
      return sendError(res, 'NOT_FOUND', 'Project not found', 404);
    }

    let result;
    if (project.currentStage === 6) {
      result = await projectService.completeProject(req.tenant, req.params.id, req.user.sub);
    } else {
      result = await projectService.advanceStage(req.tenant, req.params.id, req.user.sub);
    }

    return sendSuccess(res, result, result.completed ? 'Project completed' : `Advanced to Stage ${result.newStage}`);
  } catch (err) {
    // Gate failure — return the spec-exact 422 shape
    if (err.gateError) {
      return sendStageGateFailed(res, err.stage, err.missing);
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

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  getStageStatus,
  advanceStage,
  listPayments,
  addPayment,
  updatePayment,
  getPaymentForecast,
  upsertForecast,
  getBudgetSummary,
};