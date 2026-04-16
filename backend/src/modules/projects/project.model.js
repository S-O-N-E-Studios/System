const mongoose = require('mongoose');
const { SERVICE_CATEGORIES } = require('../../constants/serviceCategories');

const stageHistoryEntrySchema = new mongoose.Schema(
  {
    stage: { type: Number, required: true, min: 0, max: 10 },
    advancedAt: { type: Date, required: true, default: Date.now },
    advancedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    documentsSnapshot: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }],
  },
  { _id: false }
);

const contractValueHistoryEntry = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    previousValue: { type: Number, required: true },
    newValue: { type: Number, required: true },
    variationOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'VariationOrder', default: null },
    note: { type: String, default: null },
  },
  { _id: false }
);

const subConsultantSchema = new mongoose.Schema(
  {
    role: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    appointedAt: { type: Date, default: null },
  },
  { _id: false }
);

const stage0ContactSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    inviteStatus: {
      type: String,
      enum: ['pending', 'invite_sent', 'invited'],
      default: 'pending',
    },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: true,
      trim: true,
    },
    refCode: {
      type: String,
      unique: true,
    },
    idpProjectNo: {
      type: String,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'on-hold', 'complete', 'cancelled'],
      default: 'active',
    },
    currentStage: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
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
    contractValueOriginal: {
      type: Number,
      default: 0,
      min: 0,
    },
    contractValueAdjusted: {
      type: Number,
      default: 0,
      min: 0,
    },
    contractValueHistory: {
      type: [contractValueHistoryEntry],
      default: [],
    },
    expenditureToDate: {
      type: Number,
      default: 0,
      min: 0,
    },
    location: {
      address: { type: String, default: null },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    gpsFormatted: {
      type: String,
      default: null,
    },
    contractTypes: {
      type: [String],
      enum: ['professional', 'geotechnical', 'construction'],
      default: [],
    },
    projectManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    teamMembers: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    subConsultants: {
      type: [subConsultantSchema],
      default: [],
    },
    appointmentDate: {
      type: Date,
      default: null,
    },
    completionDate: {
      type: Date,
      default: null,
    },
    geoTecEngineer: {
      type: String,
      default: null,
      trim: true,
    },
    contractor: {
      type: String,
      default: null,
      trim: true,
    },
    stage0Contacts: {
      type: [stage0ContactSchema],
      default: [],
    },
    stage0CompletedAt: {
      type: Date,
      default: null,
    },
    stageHistory: {
      type: [stageHistoryEntrySchema],
      default: [],
    },
    linkedMultiYearPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MultiYearPlan',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

projectSchema.index({ tenantId: 1 });
projectSchema.index({ tenantId: 1, status: 1 });
projectSchema.index({ tenantId: 1, serviceCategory: 1 });
projectSchema.index({ tenantId: 1, localMunicipality: 1 });
projectSchema.index({ tenantId: 1, currentStage: 1 });
projectSchema.index({ deptId: 1 });
projectSchema.index({ deletedAt: 1 });

projectSchema.virtual('balance').get(function () {
  return this.contractValueAdjusted - this.expenditureToDate;
});

projectSchema.virtual('isDeleted').get(function () {
  return this.deletedAt !== null;
});

projectSchema.virtual('percentComplete').get(function () {
  const stage = Number(this.currentStage);
  if (!Number.isFinite(stage)) return 0;
  const bounded = Math.max(0, Math.min(10, Math.round(stage)));
  return Math.round((bounded / 10) * 100);
});

projectSchema.pre('save', async function (next) {
  if (this.isNew && !this.refCode) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({ tenantId: this.tenantId });
    const sequence = String(count + 1).padStart(3, '0');
    this.refCode = `PRJ-${year}-${sequence}`;
  }
  if (this.isNew && this.contractValueOriginal > 0 && this.contractValueAdjusted === 0) {
    this.contractValueAdjusted = this.contractValueOriginal;
  }
  next();
});

projectSchema.statics.findActive = function (filter = {}) {
  return this.find({ ...filter, deletedAt: null });
};

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
