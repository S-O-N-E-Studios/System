const mongoose = require('mongoose');

const variationOrderSchema = new mongoose.Schema(
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
    variationNumber: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    estimatedAmount: {
      type: Number,
      required: true,
    },
    approvedAmount: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'approved', 'rejected', 'withdrawn'],
      default: 'draft',
    },
    variationCertificateFileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

variationOrderSchema.index({ tenantId: 1, projectId: 1 });

variationOrderSchema.pre('save', async function (next) {
  if (this.isNew && !this.variationNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({ tenantId: this.tenantId });
    const sequence = String(count + 1).padStart(3, '0');
    this.variationNumber = `VO-${year}-${sequence}`;
  }
  next();
});

const VariationOrder = mongoose.model('VariationOrder', variationOrderSchema);

module.exports = VariationOrder;
