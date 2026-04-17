//  * Business logic for file metadata, approvals, and download placeholders.

const fileRepo = require('./file.repository');
const StageApproval = require('../stage-gate/stageApproval.model');
const Project = require('../projects/project.model');
const { APPROVAL_REQUIRED_CATEGORIES } = require('../../constants/fileCategories');
const storage = require('../../utils/storage');
const STAGE7_BILLING_CATEGORIES = new Set([
  'progress-report',
  'safety-report',
  'monthly-cash-flow',
  'payment-certificate',
  'site-image',
  'drone-video',
]);

const listFiles = async (tenant, query, isClientTemp) => {
  const filters = { ...query };
  if (isClientTemp) filters.clientVisible = true;
  return fileRepo.findFiles(tenant._id, filters);
};

const assertProjectExists = async (tenantId, projectId) => {
  if (!projectId) return;
  const project = await Project.findOne({
    _id: projectId,
    tenantId,
    deletedAt: null,
  })
    .select('_id currentStage')
    .lean();
  if (!project) {
    throw Object.assign(new Error('Project not found'), { status: 404 });
  }
  return project;
};

const registerFile = async (tenant, data, userId) => {
  const needsApproval = APPROVAL_REQUIRED_CATEGORIES.includes(data.category);
  const project = await assertProjectExists(tenant._id, data.projectId);
  const stage = Number(data.stage);
  const billingPeriod = data.billingPeriod ? String(data.billingPeriod).trim() : '';
  if (stage === 7 && STAGE7_BILLING_CATEGORIES.has(data.category) && !billingPeriod) {
    throw Object.assign(new Error(`billingPeriod is required for stage 7 ${data.category}`), {
      status: 400,
    });
  }

  let stageForApproval = data.stage;
  if (needsApproval && (stageForApproval === null || stageForApproval === undefined)) {
    const raw = project.currentStage;
    const n = Number(raw);
    stageForApproval = Number.isFinite(n) ? Math.min(9, Math.max(1, n)) : 1;
  }

  const doc = {
    tenantId: tenant._id,
    projectId: data.projectId,
    originalName: data.originalName,
    storagePath: data.storagePath,
    mimeType: data.mimeType,
    sizeBytes: data.sizeBytes ?? 0,
    mediaType: data.mediaType ?? 'document',
    stage: data.stage ?? null,
    billingPeriod: billingPeriod || null,
    category: data.category,
    captureDate: data.captureDate ?? null,
    captureGPS: data.captureGPS ?? { lat: null, lng: null },
    activityId: data.activityId ?? null,
    variationOrderId: data.variationOrderId ?? null,
    clientVisible: data.clientVisible ?? false,
    uploadedBy: userId,
    approvalStatus: needsApproval ? 'pending' : 'not_required',
    approvalRequiredForStage: needsApproval ? stageForApproval : null,
  };

  const file = await fileRepo.create(doc);

  if (needsApproval) {
    await StageApproval.create({
      tenantId: tenant._id,
      projectId: data.projectId,
      stage: stageForApproval,
      documentCategory: data.category,
      fileId: file._id,
      approvalStatus: 'pending',
    });
  }

  return file;
};

const toggleVisibility = async (tenant, fileId, _userId, clientVisible) => {
  const file = await fileRepo.findById(fileId, tenant._id);
  if (!file) throw Object.assign(new Error('File not found'), { status: 404 });

  if (typeof clientVisible === 'boolean') {
    file.clientVisible = clientVisible;
  } else {
    // Backward compatibility: if body omits clientVisible, preserve prior toggle behavior.
    file.clientVisible = !file.clientVisible;
  }
  await file.save();

  return file;
};

const deleteFile = async (tenant, fileId) => {
  const updated = await fileRepo.softDelete(fileId, tenant._id);
  if (!updated) throw Object.assign(new Error('File not found'), { status: 404 });
  return { deleted: true, id: fileId };
};

/**
 * Placeholder: returns storage path until presigned URLs are wired.
 * @param {object|null} clientAccess — TemporaryAccess doc (from middleware); required for CLIENT_TEMP project checks.
 */
const getDownloadUrl = async (tenant, fileId, isClientTemp, clientAccess = null) => {
  const file = await fileRepo.findById(fileId, tenant._id);
  if (!file) throw Object.assign(new Error('File not found'), { status: 404 });

  if (isClientTemp) {
    if (!file.clientVisible) {
      throw Object.assign(new Error('File is not visible to clients'), { status: 403 });
    }
    const allowed = clientAccess?.projectIds?.some(
      (pid) => pid.toString() === file.projectId.toString()
    );
    if (!allowed) {
      throw Object.assign(new Error('You do not have access to this project'), { status: 403 });
    }
  }

  const url = await storage.getDownloadUrl(file.storagePath);
  return { url };
};

module.exports = {
  listFiles,
  registerFile,
  toggleVisibility,
  deleteFile,
  getDownloadUrl,
};
