const mongoose = require('mongoose');

const penaltySchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    penaltyType: { type: String, enum: ['delay', 'quality', 'contractual', 'other'], default: 'other' },
    amountCents: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true, trim: true },
    status: { type: String, enum: ['draft', 'approved', 'waived'], default: 'draft' },
    supportingFileIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }],
    assignedApproverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    thresholdAmountCents: { type: Number, min: 0, default: null },
    thresholdExceeded: { type: Boolean, default: false },
    thresholdWarningNote: { type: String, trim: true, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

penaltySchema.index({ tenantId: 1, projectId: 1, createdAt: -1 });

const Penalty = mongoose.model('Penalty', penaltySchema);

module.exports = Penalty;
