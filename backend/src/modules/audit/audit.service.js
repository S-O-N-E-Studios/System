const AuditLog = require('./auditLog.model');

const normalizeAction = ({ action, entityType, before, after }) => {
  if (!action) return action;
  if (action === 'workflow.advanced') return 'stage.advanced';
  if (action === 'document.approved' && entityType === 'stage_approval') return 'deliverable.approved';
  if (action === 'document.rejected' && entityType === 'stage_approval') return 'deliverable.rejected';
  if (action === 'procurement_step.reviewed') {
    const status = String(after?.status || before?.status || '').toLowerCase();
    if (status === 'approved') return 'procurement.step.approved';
    if (status === 'not_approved') return 'procurement.step.rejected';
    if (status === 'not_applicable') return 'procurement.step.not_applicable';
  }
  return action;
};

const logEvent = async ({
  tenantId,
  projectId = null,
  entityType,
  entityId = null,
  action,
  actor = {},
  before = null,
  after = null,
  overrideFlag = false,
  overrideReason = null,
  evidenceCountAtTime = null,
  checkResultsAtTime = null,
  checksAtTime = null,
  metadata = null,
  req = null,
}) => {
  if (!tenantId || !entityType || !action || !actor.userId) return null;

  const normalizedCheckResultsAtTime = checkResultsAtTime || checksAtTime || null;

  return AuditLog.create({
    tenantId,
    projectId,
    entityType,
    entityId,
    action: normalizeAction({ action, entityType, before, after }),
    actorUserId: actor.userId,
    actorName: actor.name || null,
    actorRole: actor.role || null,
    timestamp: new Date(),
    before,
    after,
    overrideFlag,
    overrideReason,
    evidenceCountAtTime,
    checkResultsAtTime: normalizedCheckResultsAtTime,
    metadata,
    ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || null,
    userAgent: req?.headers?.['user-agent'] || null,
  });
};

module.exports = {
  logEvent,
};
