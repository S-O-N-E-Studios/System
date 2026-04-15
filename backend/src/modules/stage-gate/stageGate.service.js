const File = require('../files/file.model');
const StageApproval = require('./stageApproval.model');
const Activity = require('../activities/activity.model');
const { STAGE_DOCUMENT_MAP, STAGES_REQUIRING_APPROVAL } = require('./stageGate.constants');

const checkStageGate = async (tenantId, projectId, currentStage) => {
  const requiredCategories = STAGE_DOCUMENT_MAP[currentStage] || [];

  if (requiredCategories.length === 0) {
    return { gatePassed: true, missing: [], documents: [] };
  }

  const stageFiles = await File.find({
    tenantId,
    projectId,
    stage: currentStage,
    deletedAt: null,
    category: { $in: requiredCategories },
  }).lean();

  const uploadedCategories = new Set(stageFiles.map((f) => f.category));
  const missing = [];

  for (const cat of requiredCategories) {
    if (!uploadedCategories.has(cat)) {
      missing.push({ category: cat, reason: 'not_uploaded' });
      continue;
    }

    if (STAGES_REQUIRING_APPROVAL.includes(currentStage)) {
      const approval = await StageApproval.findOne({
        tenantId,
        projectId,
        stage: currentStage,
        documentCategory: cat,
        approvalStatus: 'approved',
      }).lean();

      if (!approval) {
        const pending = await StageApproval.findOne({
          tenantId,
          projectId,
          stage: currentStage,
          documentCategory: cat,
        }).lean();

        missing.push({
          category: cat,
          reason: pending ? (pending.approvalStatus === 'rejected' ? 'rejected' : 'pending_approval') : 'not_uploaded',
        });
      }
    }
  }

  return {
    gatePassed: missing.length === 0,
    missing,
    documents: stageFiles,
  };
};

const checkStageGateWithActivities = async (tenantId, projectId, currentStage) => {
  const gateResult = await checkStageGate(tenantId, projectId, currentStage);

  if (currentStage === 7) {
    const activities = await Activity.find({
      tenantId,
      projectId,
      status: 'complete',
    }).lean();

    const activitiesMissingImages = activities
      .filter((a) => (a.supportingImages?.length || 0) < (a.minimumImagesRequired || 3))
      .map((a) => ({ activityId: a._id, name: a.name, imageCount: a.supportingImages?.length || 0, required: a.minimumImagesRequired || 3 }));

    if (activitiesMissingImages.length > 0) {
      gateResult.gatePassed = false;
      gateResult.activitiesMissingImages = activitiesMissingImages;
    }
  }

  return gateResult;
};

module.exports = {
  checkStageGate,
  checkStageGateWithActivities,
};
