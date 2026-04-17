//  * Business logic for file metadata, approvals, and download placeholders.

const fileRepo = require('./file.repository');
const StageApproval = require('../stage-gate/stageApproval.model');
const Project = require('../projects/project.model');
const { getApprovalRequiredCategoriesForTenant } = require('../../constants/workflowProfiles');
const { ROLES } = require('../../constants/roles');
const userRepo = require('../users/user.repository');
const { sendEmail } = require('../../utils/email');
const env = require('../../config/env');
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
    .select('_id currentStage name')
    .lean();
  if (!project) {
    throw Object.assign(new Error('Project not found'), { status: 404 });
  }
  return project;
};

const notifyClientApproversForPendingApproval = async (tenant, project, approval, file) => {
  const approvers = await userRepo.findTenantMembers(
    tenant._id,
    { role: ROLES.CLIENT_APPROVER },
    { page: 1, limit: 100 }
  );
  if (!approvers.length) return;

  const approvalUrl = `${env.CLIENT_URL}/${encodeURIComponent(tenant.slug)}/projects/${project._id}`;
  await Promise.all(
    approvers
      .filter((user) => Boolean(user.email))
      .map((user) =>
        sendEmail({
          to: user.email,
          subject: `Client approval required: ${project.name || 'Project'} (${file.category})`,
          html: `
            <p>A document is waiting on client approval in EVIDENTIARY.</p>
            <p><strong>Project:</strong> ${project.name || project._id}</p>
            <p><strong>Category:</strong> ${file.category}</p>
            <p><strong>Status:</strong> Waiting on client approval</p>
            <p>Open the project to approve or reject:</p>
            <p><a href="${approvalUrl}">${approvalUrl}</a></p>
          `,
          tenant,
        })
      )
  );

  approval.notificationSentAt = new Date();
  approval.notificationSentCount = Number(approval.notificationSentCount || 0) + 1;
  await approval.save();
};

const registerFile = async (tenant, data, userId) => {
  const approvalCategories = getApprovalRequiredCategoriesForTenant(tenant);
  const needsApproval = approvalCategories.includes(data.category);
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
    const approval = await StageApproval.create({
      tenantId: tenant._id,
      projectId: data.projectId,
      stage: stageForApproval,
      documentCategory: data.category,
      fileId: file._id,
      approvalStatus: 'pending',
    });
    try {
      await notifyClientApproversForPendingApproval(tenant, project, approval, file);
    } catch {
      // Do not block file registration if notification fails.
    }
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
