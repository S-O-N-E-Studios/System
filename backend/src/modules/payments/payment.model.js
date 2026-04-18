const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
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
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentDate: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    certificateNo: {
      type: String,
      default: null,
      trim: true,
    },
    contractType: {
      type: String,
      enum: ['professional', 'geotechnical', 'construction'],
      required: true,
    },
    billingPeriod: {
      type: String,
      default: null,
      trim: true,
    },
    certificateFileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected'],
      default: 'approved',
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
      trim: true,
    },
    overrideFlag: {
      type: Boolean,
      default: false,
    },
    overrideReason: {
      type: String,
      default: null,
      trim: true,
    },
    checksAtApproval: {
      progressReportPresent: { type: Boolean, default: null },
      evidenceCount: { type: Number, default: null },
      evidenceMinimum: { type: Number, default: null },
      withinBudget: { type: Boolean, default: null },
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ tenantId: 1, projectId: 1 });
paymentSchema.index({ paymentDate: 1 });

const paymentForecastSchema = new mongoose.Schema(
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
    month: {
      type: String,
      required: true,
    },
    contractType: {
      type: String,
      enum: ['professional', 'geotechnical', 'construction'],
      required: true,
    },
    forecastAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

paymentForecastSchema.index({ tenantId: 1, projectId: 1, month: 1, contractType: 1 }, { unique: true });

const Payment = mongoose.model('Payment', paymentSchema);
const PaymentForecast = mongoose.model('PaymentForecast', paymentForecastSchema);

module.exports = { Payment, PaymentForecast };
