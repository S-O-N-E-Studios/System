const service = require('./extensionOfTime.service');
const { sendSuccess, sendCreated } = require('../../utils/apiResponse');
const { logEvent } = require('../audit/audit.service');

const serializeEot = (row) => {
  if (!row) return row;
  const payload = row.toObject ? row.toObject() : row;
  return {
    ...payload,
    // Migration-safe aliases for v9 terminology.
    eotNumber: payload.referenceNumber,
    daysRequested: payload.requestedDays,
  };
};

const list = async (req, res) => {
  const requests = await service.list(req.tenant._id, req.params.id);
  return sendSuccess(res, { requests: requests.map(serializeEot) });
};

const create = async (req, res) => {
  const request = await service.create(req.tenant._id, req.params.id, req.user.sub, req.body);
  await logEvent({
    tenantId: req.tenant._id,
    projectId: req.params.id,
    entityType: 'extension_of_time',
    entityId: request._id,
    action: 'eot.created',
    actor: {
      userId: req.user.sub,
      name: req.user.fullName || req.user.name || null,
      role: req.tenantMembership?.role || req.user.role,
    },
    after: request.toObject ? request.toObject() : request,
    req,
  });
  return sendCreated(res, { request: serializeEot(request) });
};

const getOne = async (req, res) => {
  const request = await service.getOne(req.tenant._id, req.params.id, req.params.eotId);
  if (!request) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'EOT request not found' });
  return sendSuccess(res, { request: serializeEot(request) });
};

const update = async (req, res) => {
  const request = await service.update(req.tenant._id, req.params.id, req.params.eotId, req.body);
  if (!request) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'EOT request not found' });
  return sendSuccess(res, { request: serializeEot(request) });
};

const submit = async (req, res) => {
  const existing = await service.getOne(req.tenant._id, req.params.id, req.params.eotId);
  const request = await service.setStatus(req.tenant._id, req.params.id, req.params.eotId, {
    status: 'pending_approval',
  });
  await logEvent({
    tenantId: req.tenant._id,
    projectId: req.params.id,
    entityType: 'extension_of_time',
    entityId: request._id,
    action: 'eot.submitted',
    actor: {
      userId: req.user.sub,
      name: req.user.fullName || req.user.name || null,
      role: req.tenantMembership?.role || req.user.role,
    },
    before: existing?.toObject ? existing.toObject() : existing,
    after: request.toObject ? request.toObject() : request,
    req,
  });
  return sendSuccess(res, { request: serializeEot(request) });
};

const approve = async (req, res) => {
  const existing = await service.getOne(req.tenant._id, req.params.id, req.params.eotId);
  if (!existing) {
    return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'EOT request not found' });
  }
  if (existing.status !== 'pending_approval') {
    return res.status(422).json({
      success: false,
      error: 'INVALID_STATE',
      message: 'Only EOT requests pending approval can be approved.',
    });
  }
  const requested = Number(existing.requestedDays);
  let daysApproved = req.body?.daysApproved;
  if (daysApproved === undefined || daysApproved === null) {
    daysApproved = requested;
  }
  daysApproved = Number(daysApproved);
  if (!Number.isFinite(daysApproved) || daysApproved < 0 || daysApproved > requested) {
    return res.status(422).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: `daysApproved must be between 0 and ${requested} (requested days).`,
    });
  }
  const request = await service.setStatus(req.tenant._id, req.params.id, req.params.eotId, {
    status: 'approved',
    daysApproved,
    approvedBy: req.user.sub,
    approvedAt: new Date(),
    rejectionReason: null,
  });
  await service.syncProjectCompletionFromApprovedEots(req.tenant._id, req.params.id);
  await logEvent({
    tenantId: req.tenant._id,
    projectId: req.params.id,
    entityType: 'extension_of_time',
    entityId: request._id,
    action: 'eot.approved',
    actor: {
      userId: req.user.sub,
      name: req.user.fullName || req.user.name || null,
      role: req.tenantMembership?.role || req.user.role,
    },
    before: existing?.toObject ? existing.toObject() : existing,
    after: request.toObject ? request.toObject() : request,
    req,
  });
  return sendSuccess(res, { request: serializeEot(request) });
};

const reject = async (req, res) => {
  const existing = await service.getOne(req.tenant._id, req.params.id, req.params.eotId);
  const request = await service.setStatus(req.tenant._id, req.params.id, req.params.eotId, {
    status: 'rejected',
    rejectionReason: req.body?.reason || 'Rejected',
  });
  await logEvent({
    tenantId: req.tenant._id,
    projectId: req.params.id,
    entityType: 'extension_of_time',
    entityId: request._id,
    action: 'eot.rejected',
    actor: {
      userId: req.user.sub,
      name: req.user.fullName || req.user.name || null,
      role: req.tenantMembership?.role || req.user.role,
    },
    before: existing?.toObject ? existing.toObject() : existing,
    after: request.toObject ? request.toObject() : request,
    req,
  });
  return sendSuccess(res, { request: serializeEot(request) });
};

const withdraw = async (req, res) => {
  const existing = await service.getOne(req.tenant._id, req.params.id, req.params.eotId);
  const request = await service.setStatus(req.tenant._id, req.params.id, req.params.eotId, {
    status: 'withdrawn',
  });
  await logEvent({
    tenantId: req.tenant._id,
    projectId: req.params.id,
    entityType: 'extension_of_time',
    entityId: request._id,
    action: 'eot.withdrawn',
    actor: {
      userId: req.user.sub,
      name: req.user.fullName || req.user.name || null,
      role: req.tenantMembership?.role || req.user.role,
    },
    before: existing?.toObject ? existing.toObject() : existing,
    after: request.toObject ? request.toObject() : request,
    req,
  });
  return sendSuccess(res, { request });
};

module.exports = {
  list,
  create,
  getOne,
  update,
  submit,
  approve,
  reject,
  withdraw,
};
