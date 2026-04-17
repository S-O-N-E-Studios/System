const ExtensionOfTime = require('./extensionOfTime.model');

const list = (tenantId, projectId) =>
  ExtensionOfTime.find({ tenantId, projectId }).sort({ createdAt: -1 }).lean();

const create = (tenantId, projectId, userId, payload) =>
  ExtensionOfTime.create({
    tenantId,
    projectId,
    createdBy: userId,
    reason: payload.reason,
    requestedDays: payload.requestedDays,
    consultantRecommendationFileId: payload.consultantRecommendationFileId || null,
    pmuRecommendationFileId: payload.pmuRecommendationFileId || null,
    approvalFileId: payload.approvalFileId || null,
    supportingFileIds: payload.supportingFileIds || [],
    assignedApproverId: payload.assignedApproverId || null,
    requestedDaysThreshold: payload.requestedDaysThreshold || null,
    thresholdExceeded: Boolean(payload.thresholdExceeded),
    thresholdWarningNote: payload.thresholdWarningNote || null,
  });

const getOne = (tenantId, projectId, eotId) =>
  ExtensionOfTime.findOne({ _id: eotId, tenantId, projectId });

const update = (tenantId, projectId, eotId, payload) =>
  ExtensionOfTime.findOneAndUpdate(
    { _id: eotId, tenantId, projectId },
    { $set: payload },
    { new: true }
  );

const setStatus = async (tenantId, projectId, eotId, statusPatch) => {
  const eot = await ExtensionOfTime.findOne({ _id: eotId, tenantId, projectId });
  if (!eot) throw Object.assign(new Error('Extension of time request not found'), { status: 404 });
  Object.assign(eot, statusPatch);
  await eot.save();
  return eot;
};

module.exports = {
  list,
  create,
  getOne,
  update,
  setStatus,
};
