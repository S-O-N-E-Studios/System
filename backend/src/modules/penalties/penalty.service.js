const Penalty = require('./penalty.model');

const assertState = (penalty, allowedStatuses, actionLabel) => {
  if (!allowedStatuses.includes(penalty.status)) {
    throw Object.assign(
      new Error(`Only penalties in [${allowedStatuses.join(', ')}] can be ${actionLabel}.`),
      { status: 422, code: 'INVALID_STATE' }
    );
  }
};

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
  Penalty.findOne({ _id: penaltyId, tenantId, projectId }).then(async (penalty) => {
    if (!penalty) return null;
    assertState(penalty, ['pending_approval'], 'approved');
    penalty.status = 'approved';
    penalty.approvedBy = approverId;
    penalty.approvedAt = new Date();
    penalty.rejectionReason = null;
    await penalty.save();
    return penalty;
  });

const submit = (tenantId, projectId, penaltyId) =>
  Penalty.findOne({ _id: penaltyId, tenantId, projectId }).then(async (penalty) => {
    if (!penalty) return null;
    assertState(penalty, ['draft', 'rejected'], 'submitted');
    penalty.status = 'pending_approval';
    penalty.rejectionReason = null;
    await penalty.save();
    return penalty;
  });

const reject = (tenantId, projectId, penaltyId, reason) =>
  Penalty.findOne({ _id: penaltyId, tenantId, projectId }).then(async (penalty) => {
    if (!penalty) return null;
    assertState(penalty, ['pending_approval'], 'rejected');
    penalty.status = 'rejected';
    penalty.rejectionReason = reason;
    penalty.approvedBy = null;
    penalty.approvedAt = null;
    await penalty.save();
    return penalty;
  });

const waive = (tenantId, projectId, penaltyId, approverId) =>
  Penalty.findOne({ _id: penaltyId, tenantId, projectId }).then(async (penalty) => {
    if (!penalty) return null;
    assertState(penalty, ['draft', 'pending_approval', 'rejected'], 'waived');
    penalty.status = 'waived';
    penalty.approvedBy = approverId;
    penalty.approvedAt = new Date();
    penalty.rejectionReason = null;
    await penalty.save();
    return penalty;
  });

module.exports = {
  list,
  getOne,
  create,
  update,
  submit,
  approve,
  reject,
  waive,
};
