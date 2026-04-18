const mongoose = require('mongoose');

const sprintSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
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
      enum: ['planned', 'active', 'completed'],
      default: 'planned',
    },
    goal: {
      type: String,
      default: null,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

sprintSchema.index({ tenantId: 1 });
sprintSchema.index({ tenantId: 1, status: 1 });

const Sprint = mongoose.model('Sprint', sprintSchema);

module.exports = Sprint;
