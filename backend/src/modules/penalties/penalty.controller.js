const service = require('./penalty.service');
const { sendSuccess, sendCreated } = require('../../utils/apiResponse');
const { logEvent } = require('../audit/audit.service');

const LEGACY_PENALTY_TYPE_MAP = {
  delay: 'late_completion',
  quality: 'defective_work',
  contractual: 'other',
  other: 'other',
};

const serializePenalty = (row) => {
  if (!row) return row;
  const payload = row.toObject ? row.toObject() : row;
  return {
    ...payload,
    // Migration-safe aliases for v9 schema consumers.
    amountRecommended: payload.amountCents,
    amountApproved: payload.status === 'approved' ? payload.amountCents : null,
    penaltyTypeLegacy: LEGACY_PENALTY_TYPE_MAP[payload.penaltyType] || 'other',
  };
};

const list = async (req, res) => {
  const penalties = await service.list(req.tenant._id, req.params.id);
  return sendSuccess(res, { penalties: penalties.map(serializePenalty) });
};

const create = async (req, res) => {
  const penalty = await service.create(req.tenant._id, req.params.id, req.body);
  await logEvent({
    tenantId: req.tenant._id,
    projectId: req.params.id,
    entityType: 'penalty',
    entityId: penalty._id,
    action: 'penalty.created',
    actor: {
      userId: req.user.sub,
      name: req.user.fullName || req.user.name || null,
      role: req.tenantMembership?.role || req.user.role,
    },
    after: penalty.toObject ? penalty.toObject() : penalty,
    req,
  });
  return sendCreated(res, { penalty: serializePenalty(penalty) });
};

const update = async (req, res) => {
  const existing = await service.getOne(req.tenant._id, req.params.id, req.params.penaltyId);
  if (!existing) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Penalty not found' });
  const penalty = await service.update(req.tenant._id, req.params.id, req.params.penaltyId, req.body);
  if (!penalty) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Penalty not found' });
  await logEvent({
    tenantId: req.tenant._id,
    projectId: req.params.id,
    entityType: 'penalty',
    entityId: penalty._id,
    action: 'penalty.updated',
    actor: {
      userId: req.user.sub,
      name: req.user.fullName || req.user.name || null,
      role: req.tenantMembership?.role || req.user.role,
    },
    before: existing.toObject ? existing.toObject() : existing,
    after: penalty.toObject ? penalty.toObject() : penalty,
    req,
  });
  return sendSuccess(res, { penalty: serializePenalty(penalty) });
};

const submit = async (req, res) => {
  const existing = await service.getOne(req.tenant._id, req.params.id, req.params.penaltyId);
  if (!existing) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Penalty not found' });
  const penalty = await service.submit(req.tenant._id, req.params.id, req.params.penaltyId);
  if (!penalty) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Penalty not found' });
  await logEvent({
    tenantId: req.tenant._id,
    projectId: req.params.id,
    entityType: 'penalty',
    entityId: penalty._id,
    action: 'penalty.submitted',
    actor: {
      userId: req.user.sub,
      name: req.user.fullName || req.user.name || null,
      role: req.tenantMembership?.role || req.user.role,
    },
    before: existing.toObject ? existing.toObject() : existing,
    after: penalty.toObject ? penalty.toObject() : penalty,
    req,
  });
  return sendSuccess(res, { penalty: serializePenalty(penalty) });
};

const approve = async (req, res) => {
  const existing = await service.getOne(req.tenant._id, req.params.id, req.params.penaltyId);
  if (!existing) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Penalty not found' });
  const penalty = await service.approve(req.tenant._id, req.params.id, req.params.penaltyId, req.user.sub);
  if (!penalty) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Penalty not found' });
  await logEvent({
    tenantId: req.tenant._id,
    projectId: req.params.id,
    entityType: 'penalty',
    entityId: penalty._id,
    action: 'penalty.approved',
    actor: {
      userId: req.user.sub,
      name: req.user.fullName || req.user.name || null,
      role: req.tenantMembership?.role || req.user.role,
    },
    before: existing.toObject ? existing.toObject() : existing,
    after: penalty.toObject ? penalty.toObject() : penalty,
    req,
  });
  return sendSuccess(res, { penalty: serializePenalty(penalty) });
};

const reject = async (req, res) => {
  const existing = await service.getOne(req.tenant._id, req.params.id, req.params.penaltyId);
  if (!existing) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Penalty not found' });
  const penalty = await service.reject(req.tenant._id, req.params.id, req.params.penaltyId, req.body.reason);
  if (!penalty) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Penalty not found' });
  await logEvent({
    tenantId: req.tenant._id,
    projectId: req.params.id,
    entityType: 'penalty',
    entityId: penalty._id,
    action: 'penalty.rejected',
    actor: {
      userId: req.user.sub,
      name: req.user.fullName || req.user.name || null,
      role: req.tenantMembership?.role || req.user.role,
    },
    before: existing.toObject ? existing.toObject() : existing,
    after: penalty.toObject ? penalty.toObject() : penalty,
    req,
  });
  return sendSuccess(res, { penalty: serializePenalty(penalty) });
};

const waive = async (req, res) => {
  const existing = await service.getOne(req.tenant._id, req.params.id, req.params.penaltyId);
  if (!existing) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Penalty not found' });
  const penalty = await service.waive(req.tenant._id, req.params.id, req.params.penaltyId, req.user.sub);
  if (!penalty) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Penalty not found' });
  await logEvent({
    tenantId: req.tenant._id,
    projectId: req.params.id,
    entityType: 'penalty',
    entityId: penalty._id,
    action: 'penalty.waived',
    actor: {
      userId: req.user.sub,
      name: req.user.fullName || req.user.name || null,
      role: req.tenantMembership?.role || req.user.role,
    },
    before: existing.toObject ? existing.toObject() : existing,
    after: penalty.toObject ? penalty.toObject() : penalty,
    req,
  });
  return sendSuccess(res, { penalty: serializePenalty(penalty) });
};

module.exports = {
  list,
  create,
  update,
  submit,
  approve,
  reject,
  waive,
};
