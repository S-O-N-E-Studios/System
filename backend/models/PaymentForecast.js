const mongoose = require('mongoose');

const paymentForecastSchema = new mongoose.Schema({
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
  year: {
    type: Number,
    required: true,
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
  },
  forecastAmount: {
    type: Number,
    default: 0,
  },
  actualAmount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

paymentForecastSchema.index({ tenantId: 1, projectId: 1, year: 1, month: 1 }, { unique: true });

paymentForecastSchema.set('toJSON', { virtuals: true });
paymentForecastSchema.set('toObject', { virtuals: true });

paymentForecastSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('PaymentForecast', paymentForecastSchema);
