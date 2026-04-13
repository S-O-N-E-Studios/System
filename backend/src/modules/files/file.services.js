//  * Business logic for file metadata, approvals, and download placeholders.

const fileRepo = require('./file.repository');
const StageApproval = require('../stage-gate/stageApproval.model');
const Project = require('../projects/project.model');
const { APPROVAL_REQUIRED_CATEGORIES } = require('../../constants/fileCategories');

const listFiles = async (tenant, query, isClientTemp) => {
  const filters = { ...query };
  if (isClientTemp) filters.clientVisible = true;
  return fileRepo.findFiles(tenant._id, filters);
};

const registerFile = async (tenant, data, userId) => {
  const needsApproval = APPROVAL_REQUIRED_CATEGORIES.includes(data.category);

  let stageForApproval = data.stage;
  if (needsApproval && (stageForApproval === null || stageForApproval === undefined)) {
    const project = await Project.findOne({
      _id: data.projectId,
      tenantId: tenant._id,
      deletedAt: null,
    })
      .select('currentStage')
      .lean();
    if (!project) {
      throw Object.assign(new Error('Project not found'), { status: 404 });
    }
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

const toggleVisibility = async (tenant, fileId, _userId) => {
  const file = await fileRepo.findById(fileId, tenant._id);
  if (!file) throw Object.assign(new Error('File not found'), { status: 404 });

  file.clientVisible = !file.clientVisible;
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

  return { storagePath: file.storagePath };
};

module.exports = {
  listFiles,
  registerFile,
  toggleVisibility,
  deleteFile,
  getDownloadUrl,
};
