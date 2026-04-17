const service = require('./workflow.service');
const { sendSuccess } = require('../../utils/apiResponse');
const { logEvent } = require('../audit/audit.service');

const getWorkflow = async (req, res) => {
  const summary = await service.getWorkflowSummary(req.tenant, req.params.id);
  return sendSuccess(res, summary);
};

const advance = async (req, res) => {
  const result = await service.advanceWorkflow(req.tenant, req.params.id, req.user.sub);
  await logEvent({
    tenantId: req.tenant._id,
    projectId: req.params.id,
    entityType: 'project_workflow',
    entityId: req.params.id,
    action: 'workflow.advanced',
    actor: {
      userId: req.user.sub,
      name: req.user.fullName || req.user.name || null,
      role: req.tenantMembership?.role || req.user.role,
    },
    after: result,
    req,
  });
  return sendSuccess(res, result);
};

module.exports = {
  getWorkflow,
  advance,
};
