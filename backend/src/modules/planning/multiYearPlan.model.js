const mongoose = require('mongoose');
const { SERVICE_CATEGORIES } = require('../../constants/serviceCategories');

const FUNDER_TYPES = [
  'self_generated', 'mig', 'rbig', 'wsig',
  'equitable_share', 'private_client', 'other',
];

const multiYearPlanSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    deptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    projectName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    serviceCategory: {
      type: String,
      enum: Object.values(SERVICE_CATEGORIES),
      required: true,
    },
    localMunicipality: {
      type: String,
      default: null,
      trim: true,
    },
    plannedYear: {
      type: Number,
      enum: [1, 2, 3, 4, 5],
      required: true,
    },
    financialYear: {
      type: String,
      required: true,
      trim: true,
    },
    mtef: {
      year1: { type: Number, default: 0, min: 0 },
      year2: { type: Number, default: 0, min: 0 },
      year3: { type: Number, default: 0, min: 0 },
    },
    funderType: {
      type: String,
      enum: FUNDER_TYPES,
      required: true,
    },
    estimatedValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['planned', 'selected_for_inception', 'active', 'cancelled'],
      default: 'planned',
    },
    linkedProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    idpProjectNo: {
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

multiYearPlanSchema.index({ tenantId: 1 });
multiYearPlanSchema.index({ tenantId: 1, plannedYear: 1 });
multiYearPlanSchema.index({ tenantId: 1, serviceCategory: 1 });
multiYearPlanSchema.index({ tenantId: 1, status: 1 });
multiYearPlanSchema.index({ linkedProjectId: 1 }, { sparse: true });

const MultiYearPlan = mongoose.model('MultiYearPlan', multiYearPlanSchema);

module.exports = MultiYearPlan;
