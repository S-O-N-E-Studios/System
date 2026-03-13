const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  referenceCode: {
    type: String,
    trim: true,
  },
  description: String,
  status: {
    type: String,
    enum: ['active', 'in_review', 'not_started', 'complete', 'overdue'],
    default: 'not_started',
  },
  contractValue: {
    type: Number,
    default: 0,
  },
  expenditureToDate: {
    type: Number,
    default: 0,
  },
  gpsLatitude: Number,
  gpsLongitude: Number,
  geoTecEngineer: String,
  geoTecReportStatus: {
    type: String,
    enum: ['submitted', 'in_review', 'pending', 'not_started'],
  },
  ddrStatus: {
    type: String,
    enum: ['complete', 'in_review', 'pending'],
  },
  contractor: String,
  constructionStatus: {
    type: String,
    enum: ['on_track', 'at_risk', 'delayed', 'complete'],
  },
  startDate: Date,
  completionDate: Date,
  percentComplete: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  challenges: String,
  recommendation: String,
  totalEmployees: { type: Number, default: 0 },
  roePercent: { type: Number, default: 0 },
  projectManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  attachmentCount: { type: Number, default: 0 },
  team: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    roleInProject: String,
    addedAt: { type: Date, default: Date.now },
  }],
  files: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

projectSchema.virtual('balance').get(function () {
  return this.contractValue - this.expenditureToDate;
});

projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

projectSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

projectSchema.pre('save', function (next) {
  if (!this.referenceCode) {
    const prefix = 'PRJ';
    const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
    const random = Math.random().toString(36).toUpperCase().slice(2, 5);
    this.referenceCode = `${prefix}-${timestamp}${random}`;
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
