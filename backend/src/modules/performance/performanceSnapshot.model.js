const mongoose = require('mongoose');

const performanceSnapshotSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    period: { type: String, required: true, match: [/^\d{4}-\d{2}$/, 'Period must be YYYY-MM'] },
    consultant: {
      rag: { type: String, enum: ['red', 'amber', 'green'], default: 'amber' },
      progressProjectedPct: { type: Number, default: 0 },
      progressActualPct: { type: Number, default: 0 },
      expenditureProjectedPct: { type: Number, default: 0 },
      expenditureActualPct: { type: Number, default: 0 },
    },
    construction: {
      rag: { type: String, enum: ['red', 'amber', 'green'], default: 'amber' },
      progressProjectedPct: { type: Number, default: 0 },
      progressActualPct: { type: Number, default: 0 },
      expenditureProjectedPct: { type: Number, default: 0 },
      expenditureActualPct: { type: Number, default: 0 },
      timeProjectedPct: { type: Number, default: 0 },
      timeActualPct: { type: Number, default: 0 },
    },
    capturedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    capturedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

performanceSnapshotSchema.index({ tenantId: 1, projectId: 1, period: 1 }, { unique: true });

const PerformanceSnapshot = mongoose.model('PerformanceSnapshot', performanceSnapshotSchema);

module.exports = PerformanceSnapshot;
