const mongoose = require('mongoose');

const FUNDER_TYPES = [
  'self_generated', 'mig', 'rbig', 'wsig',
  'equitable_share', 'private_client', 'other',
];

const disbursementEntry = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['pending', 'received', 'overdue'], default: 'pending' },
  },
  { _id: false }
);

const fundingSourceSchema = new mongoose.Schema(
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
    sourceName: {
      type: String,
      required: true,
      trim: true,
    },
    sourceType: {
      type: String,
      enum: FUNDER_TYPES,
      required: true,
    },
    funderOrg: {
      type: String,
      default: null,
      trim: true,
    },
    totalAllocated: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDisbursed: {
      type: Number,
      default: 0,
      min: 0,
    },
    disbursementSchedule: {
      type: [disbursementEntry],
      default: [],
    },
    conditions: {
      type: String,
      default: null,
    },
    complianceStatus: {
      type: String,
      enum: ['compliant', 'at_risk', 'non_compliant'],
      default: 'compliant',
    },
  },
  { timestamps: true }
);

fundingSourceSchema.index({ tenantId: 1, projectId: 1 });

const FundingSource = mongoose.model('FundingSource', fundingSourceSchema);

module.exports = FundingSource;
