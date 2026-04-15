const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    reportType: {
      type: String,
      enum: ['dashboard', 'dept-summary', 'payment-forecast', 'project-status', 'sprint-burndown', 'grants-summary'],
      required: true,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    format: {
      type: String,
      enum: ['json', 'pdf', 'xlsx'],
      default: 'json',
    },
  },
  { timestamps: true }
);

reportSchema.index({ tenantId: 1, reportType: 1 });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
