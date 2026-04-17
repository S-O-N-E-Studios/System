const StageApproval = require('./stageApproval.model');
const Project = require('../projects/project.model');
const File = require('../files/file.model');
const CalendarEvent = require('../calendar/calendarEvent.model');
const { sendSuccess } = require('../../utils/apiResponse');
const { logEvent } = require('../audit/audit.service');
const { ROLES } = require('../../constants/roles');
const userRepo = require('../users/user.repository');
const { sendEmail } = require('../../utils/email');
const env = require('../../config/env');

const ensureProject = async (tenantId, projectId) => {
  const project = await Project.findOne({
    _id: projectId,
    tenantId,
    deletedAt: null,
  }).select('_id');
  if (!project) {
    const err = new Error('Project not found');
    err.status = 404;
    throw err;
  }
};

const notifyClientApprovers = async (tenant, projectId, approval) => {
  const approvers = await userRepo.findTenantMembers(
    tenant._id,
    { role: ROLES.CLIENT_APPROVER },
    { page: 1, limit: 100 }
  );
  if (!approvers.length) return 0;
  const project = await Project.findOne({
    _id: projectId,
    tenantId: tenant._id,
    deletedAt: null,
  }).select('_id name');
  if (!project) return 0;
  const approvalUrl = `${env.CLIENT_URL}/${encodeURIComponent(tenant.slug)}/projects/${projectId}`;
  const recipients = approvers.filter((user) => Boolean(user.email));
  await Promise.all(
    recipients.map((user) =>
      sendEmail({
        to: user.email,
        subject: `Client approval required: ${project.name || 'Project'} (${approval.documentCategory})`,
        html: `
          <p>A document is waiting on client approval in EVIDENTIARY.</p>
          <p><strong>Project:</strong> ${project.name || project._id}</p>
          <p><strong>Category:</strong> ${approval.documentCategory}</p>
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
  return recipients.length;
};

const listApprovals = async (req, res) => {
  const { id: projectId } = req.params;
  await ensureProject(req.tenant._id, projectId);

  const approvals = await StageApproval.find({
    tenantId: req.tenant._id,
    projectId,
  })
    .sort({ stage: 1, documentCategory: 1, createdAt: -1 })
    .lean();

  return sendSuccess(res, { approvals });
};

const getPendingApprovals = async (req, res) => {
  const { id: projectId } = req.params;
  await ensureProject(req.tenant._id, projectId);

  const approvals = await StageApproval.find({
    tenantId: req.tenant._id,
    projectId,
    approvalStatus: 'pending',
  })
    .sort({ stage: 1, createdAt: 1 })
    .lean();

  return sendSuccess(res, { approvals });
};

const getApproval = async (req, res) => {
  const { id: projectId, approvalId } = req.params;
  await ensureProject(req.tenant._id, projectId);

  const approval = await StageApproval.findOne({
    _id: approvalId,
    tenantId: req.tenant._id,
    projectId,
  }).lean();

  if (!approval) {
    const err = new Error('Approval not found');
    err.status = 404;
    throw err;
  }

  return sendSuccess(res, { approval });
};

const approveDocument = async (req, res) => {
  const { id: projectId, approvalId } = req.params;
  await ensureProject(req.tenant._id, projectId);

  const approval = await StageApproval.findOne({
    _id: approvalId,
    tenantId: req.tenant._id,
    projectId,
  });

  if (!approval) {
    const err = new Error('Approval not found');
    err.status = 404;
    throw err;
  }
  const before = approval.toObject();

  if (approval.approvalStatus !== 'pending') {
    const err = new Error('Only pending approvals can be approved');
    err.status = 400;
    throw err;
  }
  const effectiveRole = req.tenantMembership?.role || req.user.role;
  if (approval.stage === 9 && ![ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN].includes(effectiveRole)) {
    const err = new Error('Stage 9 approvals are restricted to organisation administrators');
    err.status = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }

  approval.approvalStatus = 'approved';
  approval.reviewedBy = req.user.sub;
  approval.reviewedAt = new Date();
  approval.rejectionReason = null;
  await approval.save();
  await File.updateOne(
    {
      _id: approval.fileId,
      tenantId: req.tenant._id,
      projectId,
      deletedAt: null,
    },
    {
      approvalStatus: 'approved',
      approvedBy: req.user.sub,
      approvedAt: approval.reviewedAt,
      rejectionReason: null,
    },
  );
  await CalendarEvent.createApprovalEvent(
    req.tenant._id,
    projectId,
    true,
    approval.documentCategory,
    req.user.sub,
  );
  await logEvent({
    tenantId: req.tenant._id,
    projectId,
    entityType: 'stage_approval',
    entityId: approval._id,
    action: 'document.approved',
    actor: {
      userId: req.user.sub,
      name: req.user.fullName || req.user.name || null,
      role: req.tenantMembership?.role || req.user.role,
    },
    before,
    after: approval.toObject(),
    req,
  });

  return sendSuccess(res, { approval });
};

const rejectDocument = async (req, res) => {
  const { id: projectId, approvalId } = req.params;
  await ensureProject(req.tenant._id, projectId);

  const approval = await StageApproval.findOne({
    _id: approvalId,
    tenantId: req.tenant._id,
    projectId,
  });

  if (!approval) {
    const err = new Error('Approval not found');
    err.status = 404;
    throw err;
  }
  const before = approval.toObject();

  if (approval.approvalStatus !== 'pending') {
    const err = new Error('Only pending approvals can be rejected');
    err.status = 400;
    throw err;
  }
  const effectiveRole = req.tenantMembership?.role || req.user.role;
  if (approval.stage === 9 && ![ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN].includes(effectiveRole)) {
    const err = new Error('Stage 9 approvals are restricted to organisation administrators');
    err.status = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }

  approval.approvalStatus = 'rejected';
  approval.reviewedBy = req.user.sub;
  approval.reviewedAt = new Date();
  approval.rejectionReason = req.body.reason;
  await approval.save();
  await File.updateOne(
    {
      _id: approval.fileId,
      tenantId: req.tenant._id,
      projectId,
      deletedAt: null,
    },
    {
      approvalStatus: 'rejected',
      approvedBy: null,
      approvedAt: null,
      rejectionReason: approval.rejectionReason,
    },
  );
  await CalendarEvent.createApprovalEvent(
    req.tenant._id,
    projectId,
    false,
    approval.documentCategory,
    req.user.sub,
  );
  await logEvent({
    tenantId: req.tenant._id,
    projectId,
    entityType: 'stage_approval',
    entityId: approval._id,
    action: 'document.rejected',
    actor: {
      userId: req.user.sub,
      name: req.user.fullName || req.user.name || null,
      role: req.tenantMembership?.role || req.user.role,
    },
    before,
    after: approval.toObject(),
    req,
  });

  return sendSuccess(res, { approval });
};

const resendClientApprovalNotification = async (req, res) => {
  const { id: projectId, approvalId } = req.params;
  await ensureProject(req.tenant._id, projectId);
  const approval = await StageApproval.findOne({
    _id: approvalId,
    tenantId: req.tenant._id,
    projectId,
  });
  if (!approval) {
    const err = new Error('Approval not found');
    err.status = 404;
    throw err;
  }
  if (approval.approvalStatus !== 'pending') {
    const err = new Error('Notifications can only be sent for pending approvals');
    err.status = 400;
    throw err;
  }
  const before = approval.toObject();
  const recipientCount = await notifyClientApprovers(req.tenant, projectId, approval);
  await logEvent({
    tenantId: req.tenant._id,
    projectId,
    entityType: 'stage_approval',
    entityId: approval._id,
    action: 'document.notification_resent',
    actor: {
      userId: req.user.sub,
      name: req.user.fullName || req.user.name || null,
      role: req.tenantMembership?.role || req.user.role,
    },
    before,
    after: approval.toObject(),
    metadata: { recipientCount },
    req,
  });
  return sendSuccess(res, { approval, recipientCount });
};

module.exports = {
  listApprovals,
  getPendingApprovals,
  getApproval,
  approveDocument,
  rejectDocument,
  resendClientApprovalNotification,
};
