const service = require('./performance.service');
const { sendSuccess, sendCreated } = require('../../utils/apiResponse');
const { logEvent } = require('../audit/audit.service');

const list = async (req, res) => {
  const snapshots = await service.list(req.tenant._id, req.params.id);
  return sendSuccess(res, {
    latest: snapshots[0] || null,
    snapshots,
  });
};

const upsert = async (req, res) => {
  const beforeList = await service.list(req.tenant._id, req.params.id);
  const before = beforeList.find((row) => row.period === req.body.period) || null;
  const snapshot = await service.upsert(req.tenant._id, req.params.id, req.user.sub, req.body);
  await logEvent({
    tenantId: req.tenant._id,
    projectId: req.params.id,
    entityType: 'performance_snapshot',
    entityId: snapshot._id,
    action: 'performance.snapshot_upserted',
    actor: {
      userId: req.user.sub,
      name: req.user.fullName || req.user.name || null,
      role: req.tenantMembership?.role || req.user.role,
    },
    before,
    after: snapshot.toObject ? snapshot.toObject() : snapshot,
    req,
  });
  return sendCreated(res, { snapshot }, 'Performance snapshot saved');
};

module.exports = {
  list,
  upsert,
};
