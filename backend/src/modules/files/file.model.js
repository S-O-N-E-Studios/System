const mongoose = require('mongoose');
const { FILE_CATEGORIES } = require('../../constants/fileCategories');

const versionHistoryEntry = new mongoose.Schema(
  {
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvalStatus: { type: String, enum: ['not_required', 'pending', 'approved', 'rejected'], default: 'not_required' },
  },
  { _id: false }
);

const fileSchema = new mongoose.Schema(
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
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    storagePath: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    sizeBytes: {
      type: Number,
      default: 0,
      min: 0,
    },
    mediaType: {
      type: String,
      enum: ['document', 'image', 'video'],
      default: 'document',
    },
    billingPeriod: {
      type: String,
      default: null,
      match: [/^\d{4}-\d{2}$/, 'Billing period must be in YYYY-MM format'],
    },
    stage: {
      type: Number,
      enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, null],
      default: null,
    },
    category: {
      type: String,
      enum: Object.values(FILE_CATEGORIES),
      required: true,
    },
    approvalStatus: {
      type: String,
      enum: ['not_required', 'pending', 'approved', 'rejected'],
      default: 'not_required',
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
    approvalRequiredForStage: {
      type: Number,
      enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, null],
      default: null,
    },
    versionHistory: {
      type: [versionHistoryEntry],
      default: [],
    },
    captureDate: {
      type: Date,
      default: null,
    },
    captureGPS: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    mediaDurationSeconds: {
      type: Number,
      default: null,
    },
    thumbnailStoragePath: {
      type: String,
      default: null,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', default: null },
    variationOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'VariationOrder', default: null },
    clientVisible: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

fileSchema.index({ tenantId: 1, projectId: 1 });
fileSchema.index({ tenantId: 1, projectId: 1, stage: 1 });
fileSchema.index({ tenantId: 1, projectId: 1, billingPeriod: 1 });
fileSchema.index({ tenantId: 1, projectId: 1, category: 1 });
fileSchema.index({ tenantId: 1, projectId: 1, clientVisible: 1 });
fileSchema.index({ tenantId: 1, projectId: 1, approvalStatus: 1 });
fileSchema.index({ activityId: 1 }, { sparse: true });
fileSchema.index({ variationOrderId: 1 }, { sparse: true });
fileSchema.index({ deletedAt: 1 });

fileSchema.pre('save', function (next) {
  if (this.category === FILE_CATEGORIES.PROOF_OF_PAYMENT) {
    this.clientVisible = false;
  }
  next();
});

fileSchema.statics.findForUser = function (tenantId, projectId, isClientTemp = false) {
  const filter = { tenantId, projectId, deletedAt: null };
  if (isClientTemp) filter.clientVisible = true;
  return this.find(filter);
};

fileSchema.statics.findForStage = function (tenantId, projectId, stage) {
  return this.find({ tenantId, projectId, stage, deletedAt: null });
};

const File = mongoose.model('File', fileSchema);

module.exports = File;
