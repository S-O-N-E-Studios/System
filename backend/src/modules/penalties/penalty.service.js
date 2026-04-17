const Penalty = require('./penalty.model');

const list = (tenantId, projectId) =>
  Penalty.find({ tenantId, projectId }).sort({ createdAt: -1 }).lean();

const getOne = (tenantId, projectId, penaltyId) =>
  Penalty.findOne({ _id: penaltyId, tenantId, projectId });

const create = (tenantId, projectId, payload) =>
  Penalty.create({
    tenantId,
    projectId,
    penaltyType: payload.penaltyType || 'other',
    amountCents: payload.amountCents,
    reason: payload.reason,
    supportingFileIds: payload.supportingFileIds || [],
    assignedApproverId: payload.assignedApproverId || null,
    thresholdAmountCents: payload.thresholdAmountCents ?? null,
    thresholdExceeded: Boolean(payload.thresholdExceeded),
    thresholdWarningNote: payload.thresholdWarningNote || null,
  });

const update = (tenantId, projectId, penaltyId, payload) =>
  Penalty.findOneAndUpdate(
    { _id: penaltyId, tenantId, projectId },
    { $set: payload },
    { new: true }
  );

const approve = (tenantId, projectId, penaltyId, approverId) =>
  Penalty.findOneAndUpdate(
    { _id: penaltyId, tenantId, projectId },
    { $set: { status: 'approved', approvedBy: approverId, approvedAt: new Date() } },
    { new: true }
  );

module.exports = {
  list,
  getOne,
  create,
  update,
  approve,
};
