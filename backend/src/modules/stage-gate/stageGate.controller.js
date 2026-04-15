const StageApproval = require('./stageApproval.model');
const Project = require('../projects/project.model');
const File = require('../files/file.model');
const CalendarEvent = require('../calendar/calendarEvent.model');
const { sendSuccess } = require('../../utils/apiResponse');

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

  if (approval.approvalStatus !== 'pending') {
    const err = new Error('Only pending approvals can be approved');
    err.status = 400;
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

  if (approval.approvalStatus !== 'pending') {
    const err = new Error('Only pending approvals can be rejected');
    err.status = 400;
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

  return sendSuccess(res, { approval });
};

module.exports = {
  listApprovals,
  getPendingApprovals,
  getApproval,
  approveDocument,
  rejectDocument,
};
