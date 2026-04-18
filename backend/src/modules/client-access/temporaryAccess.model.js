const mongoose = require('mongoose');

const temporaryAccessSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    clientEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    clientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    projectIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    }],
    canApproveDocuments: {
      type: Boolean,
      default: false,
    },
    activationTokenHash: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'expired', 'revoked'],
      default: 'pending',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    activatedAt: {
      type: Date,
      default: null,
    },
    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

temporaryAccessSchema.index({ tenantId: 1 });
temporaryAccessSchema.index({ clientEmail: 1, tenantId: 1 });
temporaryAccessSchema.index({ activationTokenHash: 1 });
temporaryAccessSchema.index({ status: 1 });
temporaryAccessSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('TemporaryAccess', temporaryAccessSchema);
