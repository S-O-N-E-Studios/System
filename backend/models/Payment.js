const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  projectName: String,
  consultantName: {
    type: String,
    required: true,
  },
  invoiceNumber: {
    type: String,
    required: true,
  },
  paymentDate: {
    type: Date,
    required: true,
  },
  paymentAmount: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['completed', 'pending', 'failed', 'processing'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

paymentSchema.set('toJSON', { virtuals: true });
paymentSchema.set('toObject', { virtuals: true });

paymentSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('Payment', paymentSchema);
