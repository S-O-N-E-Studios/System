const service = require('./extensionOfTime.service');
const { sendSuccess, sendCreated } = require('../../utils/apiResponse');
const { logEvent } = require('../audit/audit.service');

const list = async (req, res) => {
  const requests = await service.list(req.tenant._id, req.params.id);
  return sendSuccess(res, { requests });
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
  return sendCreated(res, { request });
};

const getOne = async (req, res) => {
  const request = await service.getOne(req.tenant._id, req.params.id, req.params.eotId);
  if (!request) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'EOT request not found' });
  return sendSuccess(res, { request });
};

const update = async (req, res) => {
  const request = await service.update(req.tenant._id, req.params.id, req.params.eotId, req.body);
  if (!request) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'EOT request not found' });
  return sendSuccess(res, { request });
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
  return sendSuccess(res, { request });
};

const approve = async (req, res) => {
  const existing = await service.getOne(req.tenant._id, req.params.id, req.params.eotId);
  const request = await service.setStatus(req.tenant._id, req.params.id, req.params.eotId, {
    status: 'approved',
    approvedBy: req.user.sub,
    approvedAt: new Date(),
    rejectionReason: null,
  });
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
  return sendSuccess(res, { request });
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
  return sendSuccess(res, { request });
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
