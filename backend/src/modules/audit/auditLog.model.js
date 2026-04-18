const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
    entityType: { type: String, required: true, trim: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    action: { type: String, required: true, trim: true, index: true },
    actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actorName: { type: String, default: null },
    actorRole: { type: String, default: null },
    timestamp: { type: Date, default: Date.now, index: true },
    before: { type: Object, default: null },
    after: { type: Object, default: null },
    overrideFlag: { type: Boolean, default: false },
    overrideReason: { type: String, default: null },
    evidenceCountAtTime: { type: Number, default: null },
    checkResultsAtTime: { type: Object, default: null },
    metadata: { type: Object, default: null },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: true }
);

auditLogSchema.index({ tenantId: 1, projectId: 1, timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
