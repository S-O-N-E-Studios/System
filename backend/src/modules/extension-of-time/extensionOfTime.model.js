const mongoose = require('mongoose');

const extensionOfTimeSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    referenceNumber: { type: String, unique: true },
    reason: { type: String, required: true, trim: true },
    requestedDays: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'approved', 'rejected', 'withdrawn'],
      default: 'draft',
    },
    consultantRecommendationFileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', default: null },
    pmuRecommendationFileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', default: null },
    approvalFileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', default: null },
    supportingFileIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }],
    assignedApproverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    requestedDaysThreshold: { type: Number, min: 1, default: null },
    thresholdExceeded: { type: Boolean, default: false },
    thresholdWarningNote: { type: String, trim: true, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

extensionOfTimeSchema.index({ tenantId: 1, projectId: 1, createdAt: -1 });

extensionOfTimeSchema.pre('save', async function preSave(next) {
  if (this.isNew && !this.referenceNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({ tenantId: this.tenantId });
    this.referenceNumber = `EOT-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

const ExtensionOfTime = mongoose.model('ExtensionOfTime', extensionOfTimeSchema);

module.exports = ExtensionOfTime;
