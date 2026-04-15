const mongoose = require('mongoose');
const VariationOrder = require('./variationOrder.model');
const Project = require('../projects/project.model');

const notFound = (msg) => Object.assign(new Error(msg), { status: 404 });
const badRequest = (msg) => Object.assign(new Error(msg), { status: 400 });

const ensureProject = async (tenantId, projectId) => {
  const project = await Project.findOne({
    _id: projectId,
    tenantId,
    deletedAt: null,
  });
  if (!project) throw notFound('Project not found');
  return project;
};

const listForProject = async (tenantId, projectId) => {
  await ensureProject(tenantId, projectId);
  return VariationOrder.find({ tenantId, projectId }).sort({ createdAt: -1 }).lean();
};

const getById = async (tenantId, projectId, voId) => {
  await ensureProject(tenantId, projectId);
  const vo = await VariationOrder.findOne({ _id: voId, tenantId, projectId }).lean();
  if (!vo) throw notFound('Variation order not found');
  return vo;
};

const create = async (tenantId, projectId, body, userId) => {
  await ensureProject(tenantId, projectId);
  return VariationOrder.create({
    ...body,
    tenantId,
    projectId,
    createdBy: userId,
  });
};

const update = async (tenantId, projectId, voId, body) => {
  await ensureProject(tenantId, projectId);
  const vo = await VariationOrder.findOne({ _id: voId, tenantId, projectId });
  if (!vo) throw notFound('Variation order not found');
  if (vo.status !== 'draft') {
    throw badRequest('Only draft variation orders can be updated.');
  }
  Object.assign(vo, body);
  await vo.save();
  return vo;
};

const submit = async (tenantId, projectId, voId) => {
  await ensureProject(tenantId, projectId);
  const vo = await VariationOrder.findOne({ _id: voId, tenantId, projectId });
  if (!vo) throw notFound('Variation order not found');
  if (vo.status !== 'draft') {
    throw badRequest('Only draft variation orders can be submitted.');
  }
  vo.status = 'pending_approval';
  await vo.save();
  return vo;
};

const recalculateContractValueAdjusted = async (tenantId, projectId, variationOrderId) => {
  const tenantObjectId =
    tenantId instanceof mongoose.Types.ObjectId
      ? tenantId
      : new mongoose.Types.ObjectId(tenantId);
  const projectObjectId =
    projectId instanceof mongoose.Types.ObjectId
      ? projectId
      : new mongoose.Types.ObjectId(projectId);

  const [agg] = await VariationOrder.aggregate([
    {
      $match: {
        tenantId: tenantObjectId,
        projectId: projectObjectId,
        status: 'approved',
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: { $ifNull: ['$approvedAmount', 0] } },
      },
    },
  ]);

  const approvedVoSum = agg?.total ?? 0;

  const project = await Project.findOne({
    _id: projectId,
    tenantId,
    deletedAt: null,
  });
  if (!project) throw notFound('Project not found');

  const previousAdjusted = project.contractValueAdjusted;
  const newAdjusted = project.contractValueOriginal + approvedVoSum;

  project.contractValueAdjusted = newAdjusted;
  project.contractValueHistory.push({
    date: new Date(),
    previousValue: previousAdjusted,
    newValue: newAdjusted,
    variationOrderId,
    note: 'Approved variation orders recalculation',
  });

  await project.save();
  return project;
};

const approve = async (tenantId, projectId, voId, userId, approvedAmount) => {
  await ensureProject(tenantId, projectId);
  const vo = await VariationOrder.findOne({ _id: voId, tenantId, projectId });
  if (!vo) throw notFound('Variation order not found');
  if (vo.status !== 'pending_approval') {
    throw badRequest('Only variation orders pending approval can be approved.');
  }

  const amount =
    approvedAmount !== undefined && approvedAmount !== null
      ? approvedAmount
      : vo.estimatedAmount;

  vo.status = 'approved';
  vo.approvedAmount = amount;
  vo.approvedBy = userId;
  vo.approvedAt = new Date();
  vo.rejectionReason = null;
  await vo.save();

  await recalculateContractValueAdjusted(tenantId, projectId, vo._id);

  return VariationOrder.findById(vo._id);
};

const reject = async (tenantId, projectId, voId, reason) => {
  await ensureProject(tenantId, projectId);
  const vo = await VariationOrder.findOne({ _id: voId, tenantId, projectId });
  if (!vo) throw notFound('Variation order not found');
  if (vo.status !== 'pending_approval') {
    throw badRequest('Only variation orders pending approval can be rejected.');
  }

  vo.status = 'rejected';
  vo.rejectionReason = reason;
  vo.approvedBy = null;
  vo.approvedAt = null;
  vo.approvedAmount = null;
  await vo.save();

  return vo;
};

const withdraw = async (tenantId, projectId, voId) => {
  await ensureProject(tenantId, projectId);
  const vo = await VariationOrder.findOne({ _id: voId, tenantId, projectId });
  if (!vo) throw notFound('Variation order not found');
  if (!['draft', 'pending_approval'].includes(vo.status)) {
    throw badRequest('Only draft or pending variation orders can be withdrawn.');
  }

  vo.status = 'withdrawn';
  await vo.save();
  return vo;
};

module.exports = {
  listForProject,
  getById,
  create,
  update,
  submit,
  approve,
  reject,
  withdraw,
};
