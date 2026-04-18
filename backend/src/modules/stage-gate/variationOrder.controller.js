const variationOrderService = require('./variationOrder.service');
const { sendSuccess, sendCreated } = require('../../utils/apiResponse');
const { logEvent } = require('../audit/audit.service');

const list = async (req, res) => {
  const variations = await variationOrderService.listForProject(
    req.tenant._id,
    req.params.id,
  );
  return sendSuccess(res, { variations });
};

const create = async (req, res) => {
  const variation = await variationOrderService.create(
    req.tenant._id,
    req.params.id,
    req.body,
    req.user.sub,
  );
  await logEvent({
    tenantId: req.tenant._id,
    projectId: req.params.id,
    entityType: 'variation_order',
    entityId: variation._id,
    action: 'variation.created',
    actor: {
      userId: req.user.sub,
      name: req.user.fullName || req.user.name || null,
      role: req.tenantMembership?.role || req.user.role,
    },
    after: variation.toObject ? variation.toObject() : variation,
    req,
  });
  return sendCreated(res, { variation });
};

const getOne = async (req, res) => {
  const variation = await variationOrderService.getById(
    req.tenant._id,
    req.params.id,
    req.params.voId,
  );
  return sendSuccess(res, { variation });
};

const update = async (req, res) => {
  const before = await variationOrderService.getById(
    req.tenant._id,
    req.params.id,
    req.params.voId,
  );
  const variation = await variationOrderService.update(
    req.tenant._id,
    req.params.id,
    req.params.voId,
    req.body,
  );
  await logEvent({
    tenantId: req.tenant._id,
    projectId: req.params.id,
    entityType: 'variation_order',
    entityId: variation._id,
    action: 'variation.updated',
    actor: {
      userId: req.user.sub,
      name: req.user.fullName || req.user.name || null,
      role: req.tenantMembership?.role || req.user.role,
    },
    before,
    after: variation.toObject ? variation.toObject() : variation,
    req,
  });
  return sendSuccess(res, { variation });
};

const submit = async (req, res) => {
  const before = await variationOrderService.getById(
    req.tenant._id,
    req.params.id,
    req.params.voId,
  );
  const variation = await variationOrderService.submit(
    req.tenant._id,
    req.params.id,
    req.params.voId,
  );
  await logEvent({
    tenantId: req.tenant._id,
    projectId: req.params.id,
    entityType: 'variation_order',
    entityId: variation._id,
    action: 'variation.submitted',
    actor: {
      userId: req.user.sub,
      name: req.user.fullName || req.user.name || null,
      role: req.tenantMembership?.role || req.user.role,
    },
    before,
    after: variation.toObject ? variation.toObject() : variation,
    req,
  });
  return sendSuccess(res, { variation });
};

const approve = async (req, res) => {
  const before = await variationOrderService.getById(
    req.tenant._id,
    req.params.id,
    req.params.voId,
  );
  const variation = await variationOrderService.approve(
    req.tenant._id,
    req.params.id,
    req.params.voId,
    req.user.sub,
    req.body.approvedAmount,
  );
  await logEvent({
    tenantId: req.tenant._id,
    projectId: req.params.id,
    entityType: 'variation_order',
    entityId: variation._id,
    action: 'variation.approved',
    actor: {
      userId: req.user.sub,
      name: req.user.fullName || req.user.name || null,
      role: req.tenantMembership?.role || req.user.role,
    },
    before,
    after: variation.toObject ? variation.toObject() : variation,
    req,
  });
  return sendSuccess(res, { variation });
};

const reject = async (req, res) => {
  const before = await variationOrderService.getById(
    req.tenant._id,
    req.params.id,
    req.params.voId,
  );
  const variation = await variationOrderService.reject(
    req.tenant._id,
    req.params.id,
    req.params.voId,
    req.body.reason,
  );
  await logEvent({
    tenantId: req.tenant._id,
    projectId: req.params.id,
    entityType: 'variation_order',
    entityId: variation._id,
    action: 'variation.rejected',
    actor: {
      userId: req.user.sub,
      name: req.user.fullName || req.user.name || null,
      role: req.tenantMembership?.role || req.user.role,
    },
    before,
    after: variation.toObject ? variation.toObject() : variation,
    req,
  });
  return sendSuccess(res, { variation });
};

const withdraw = async (req, res) => {
  const before = await variationOrderService.getById(
    req.tenant._id,
    req.params.id,
    req.params.voId,
  );
  const variation = await variationOrderService.withdraw(
    req.tenant._id,
    req.params.id,
    req.params.voId,
  );
  await logEvent({
    tenantId: req.tenant._id,
    projectId: req.params.id,
    entityType: 'variation_order',
    entityId: variation._id,
    action: 'variation.withdrawn',
    actor: {
      userId: req.user.sub,
      name: req.user.fullName || req.user.name || null,
      role: req.tenantMembership?.role || req.user.role,
    },
    before,
    after: variation.toObject ? variation.toObject() : variation,
    req,
  });
  return sendSuccess(res, { variation });
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
