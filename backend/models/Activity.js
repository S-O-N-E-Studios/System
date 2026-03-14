const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
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
  scheduleDate: Date,
}, {
  timestamps: true,
});

activitySchema.set('toJSON', { virtuals: true });
activitySchema.set('toObject', { virtuals: true });

activitySchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('Activity', activitySchema);
