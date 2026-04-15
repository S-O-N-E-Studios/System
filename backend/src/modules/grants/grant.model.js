const mongoose = require('mongoose');

const reportingScheduleEntry = new mongoose.Schema(
  {
    dueDate: { type: Date, required: true },
    submittedDate: { type: Date, default: null },
    status: { type: String, enum: ['pending', 'submitted', 'overdue'], default: 'pending' },
  },
  { _id: false }
);

const grantSchema = new mongoose.Schema(
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
    grantName: {
      type: String,
      required: true,
      trim: true,
    },
    grantType: {
      type: String,
      required: true,
      trim: true,
    },
    funderOrg: {
      type: String,
      required: true,
      trim: true,
    },
    financialYear: {
      type: String,
      required: true,
      trim: true,
    },
    totalValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    allocatedToProjects: {
      type: Number,
      default: 0,
      min: 0,
    },
    disbursedToDate: {
      type: Number,
      default: 0,
      min: 0,
    },
    complianceDeadline: {
      type: Date,
      default: null,
    },
    reportingSchedule: {
      type: [reportingScheduleEntry],
      default: [],
    },
    linkedProjects: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    }],
    status: {
      type: String,
      enum: ['active', 'closed', 'pending'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

grantSchema.virtual('remaining').get(function () {
  return this.totalValue - this.disbursedToDate;
});

grantSchema.index({ tenantId: 1 });
grantSchema.index({ tenantId: 1, status: 1 });

const Grant = mongoose.model('Grant', grantSchema);

module.exports = Grant;
