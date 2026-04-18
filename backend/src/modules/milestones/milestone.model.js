const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'overdue'],
      default: 'pending',
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

milestoneSchema.index({ tenantId: 1, projectId: 1 });

const Milestone = mongoose.model('Milestone', milestoneSchema);

module.exports = Milestone;
