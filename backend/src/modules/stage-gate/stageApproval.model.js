const mongoose = require('mongoose');

const stageApprovalSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    stage: {
      type: Number,
      required: true,
      min: 1,
      max: 9,
    },
    documentCategory: {
      type: String,
      required: true,
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      required: true,
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    notificationSentAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

stageApprovalSchema.index({ tenantId: 1, projectId: 1 });
stageApprovalSchema.index({ tenantId: 1, projectId: 1, stage: 1 });
stageApprovalSchema.index({ tenantId: 1, projectId: 1, approvalStatus: 1 });
stageApprovalSchema.index({ fileId: 1 });

const StageApproval = mongoose.model('StageApproval', stageApprovalSchema);

module.exports = StageApproval;
