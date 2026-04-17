const File = require('../files/file.model');
const StageApproval = require('./stageApproval.model');
const Activity = require('../activities/activity.model');
const Tenant = require('../tenants/tenant.model');
const { STAGES_REQUIRING_APPROVAL } = require('./stageGate.constants');
const {
  getStageDocumentMapForTenant,
  getStageDocumentSpecsForTenant,
} = require('../../constants/workflowProfiles');

const resolveTenant = async (tenantOrId) => {
  if (tenantOrId && typeof tenantOrId === 'object' && tenantOrId._id) return tenantOrId;
  return Tenant.findById(tenantOrId).select('_id orgType workflowProfile').lean();
};

const checkStageGate = async (tenantOrId, projectId, currentStage) => {
  const tenant = await resolveTenant(tenantOrId);
  if (!tenant) {
    throw Object.assign(new Error('Tenant not found'), { status: 404 });
  }
  const tenantId = tenant._id;
  const stageDocumentMap = getStageDocumentMapForTenant(tenant);
  const stageDocumentSpecs = getStageDocumentSpecsForTenant(tenant);
  const requiredCategories = stageDocumentMap[currentStage] || [];
  const requiredDocuments = stageDocumentSpecs[currentStage] || [];

  if (requiredCategories.length === 0) {
    return {
      gatePassed: true,
      missing: [],
      documents: [],
      requiredCategories: [],
      requiredDocuments,
    };
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
      const spec = requiredDocuments.find((d) => d.category === cat);
      missing.push({
        category: cat,
        documentName: spec?.documentName || cat,
        reason: 'not_uploaded',
      });
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

        const spec = requiredDocuments.find((d) => d.category === cat);
        missing.push({
          category: cat,
          documentName: spec?.documentName || cat,
          reason: pending ? (pending.approvalStatus === 'rejected' ? 'rejected' : 'pending_approval') : 'not_uploaded',
        });
      }
    }
  }

  return {
    gatePassed: missing.length === 0,
    missing,
    documents: stageFiles,
    requiredCategories,
    requiredDocuments,
  };
};

const checkStageGateWithActivities = async (tenantOrId, projectId, currentStage) => {
  const tenant = await resolveTenant(tenantOrId);
  if (!tenant) {
    throw Object.assign(new Error('Tenant not found'), { status: 404 });
  }
  const tenantId = tenant._id;
  const gateResult = await checkStageGate(tenant, projectId, currentStage);

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
