const mongoose = require('mongoose');

const supportingImageSchema = new mongoose.Schema(
  {
    fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now },
    caption: { type: String, default: null, trim: true },
  },
  { _id: true }
);

const activitySchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['on-track', 'delayed', 'pending', 'complete'],
      default: 'pending',
    },
    expectedFunds: {
      type: Number,
      default: 0,
      min: 0,
    },
    actualFunds: {
      type: Number,
      default: 0,
      min: 0,
    },
    supportingImages: {
      type: [supportingImageSchema],
      default: [],
    },
    minimumImagesRequired: {
      type: Number,
      default: 3,
    },
    lastUpdated: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

activitySchema.index({ tenantId: 1, projectId: 1 });
activitySchema.index({ status: 1 });

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;
