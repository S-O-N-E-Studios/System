const ExtensionOfTime = require('./extensionOfTime.model');
const Project = require('../projects/project.model');

const addCalendarDays = (date, days) => {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + Number(days));
  return d;
};

/**
 * Sets completionDateAdjusted and completionDate to baseline + sum(daysApproved) for all approved EOTs.
 * Baseline is completionDateOriginal, or completionDate if original is missing (legacy projects).
 */
const syncProjectCompletionFromApprovedEots = async (tenantId, projectId) => {
  const project = await Project.findOne({ _id: projectId, tenantId, deletedAt: null });
  if (!project) return;

  const baseline = project.completionDateOriginal || project.completionDate;
  if (!baseline) return;

  const approved = await ExtensionOfTime.find({
    tenantId,
    projectId,
    status: 'approved',
  }).lean();

  const totalDays = approved.reduce((sum, row) => sum + (Number(row.daysApproved) || 0), 0);
  const adjusted = addCalendarDays(baseline, totalDays);

  project.completionDateAdjusted = adjusted;
  project.completionDate = adjusted;
  await project.save();
};

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
  syncProjectCompletionFromApprovedEots,
};
