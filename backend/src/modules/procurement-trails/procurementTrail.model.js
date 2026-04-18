const mongoose = require('mongoose');

const APPOINTMENT_TYPES = [
  'principal_agent',
  'land_surveyor',
  'geo_technical_engineer',
  'environmental_specialist',
  'architect',
  'structural_engineer',
];

const STEP_KEYS = ['advert', 'recommendations', 'approval', 'appointment_letter', 'sla'];
const STEP_STATUSES = ['approved', 'not_approved', 'not_applicable'];

const procurementStepSchema = new mongoose.Schema(
  {
    stepKey: { type: String, enum: STEP_KEYS, required: true },
    status: { type: String, enum: STEP_STATUSES, default: 'not_applicable' },
    reason: { type: String, default: null, trim: true },
    fileIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }],
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
  },
  { _id: false }
);

const procurementTrailSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    appointmentType: { type: String, enum: APPOINTMENT_TYPES, required: true },
    assignee: {
      name: { type: String, default: null, trim: true },
      firm: { type: String, default: null, trim: true },
      contactEmail: { type: String, default: null, trim: true, lowercase: true },
    },
    steps: { type: [procurementStepSchema], default: [] },
    isComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

procurementTrailSchema.index({ tenantId: 1, projectId: 1, appointmentType: 1 }, { unique: true });

const ProcurementTrail = mongoose.model('ProcurementTrail', procurementTrailSchema);

module.exports = {
  ProcurementTrail,
  APPOINTMENT_TYPES,
  STEP_KEYS,
  STEP_STATUSES,
};
