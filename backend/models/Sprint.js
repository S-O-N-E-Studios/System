const mongoose = require('mongoose');

const sprintSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  number: {
    type: Number,
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
  isActive: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

sprintSchema.set('toJSON', { virtuals: true });
sprintSchema.set('toObject', { virtuals: true });

sprintSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('Sprint', sprintSchema);
