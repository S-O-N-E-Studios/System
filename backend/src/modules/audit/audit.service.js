const AuditLog = require('./auditLog.model');

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
  req = null,
}) => {
  if (!tenantId || !entityType || !action || !actor.userId) return null;

  return AuditLog.create({
    tenantId,
    projectId,
    entityType,
    entityId,
    action,
    actorUserId: actor.userId,
    actorName: actor.name || null,
    actorRole: actor.role || null,
    timestamp: new Date(),
    before,
    after,
    overrideFlag,
    overrideReason,
    evidenceCountAtTime,
    checkResultsAtTime,
    ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || null,
    userAgent: req?.headers?.['user-agent'] || null,
  });
};

module.exports = {
  logEvent,
};
