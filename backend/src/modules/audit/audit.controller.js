const AuditLog = require('./auditLog.model');
const { sendSuccess } = require('../../utils/apiResponse');

const toCsv = (rows) => {
  const header = ['timestamp', 'action', 'entityType', 'entityId', 'actorRole', 'actorName', 'overrideFlag'];
  const lines = rows.map((row) =>
    [
      row.timestamp?.toISOString?.() || '',
      row.action || '',
      row.entityType || '',
      row.entityId?.toString?.() || '',
      row.actorRole || '',
      row.actorName || '',
      row.overrideFlag ? 'true' : 'false',
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  );
  return [header.join(','), ...lines].join('\n');
};

const buildFilter = (tenantId, projectId, query) => {
  const filter = { tenantId };
  if (projectId) filter.projectId = projectId;
  if (query.action) filter.action = query.action;
  if (query.entityType) filter.entityType = query.entityType;
  if (query.actor) filter.actorUserId = query.actor;
  if (query.overrideOnly === 'true') filter.overrideFlag = true;
  if (query.dateFrom || query.dateTo) {
    filter.timestamp = {};
    if (query.dateFrom) filter.timestamp.$gte = new Date(query.dateFrom);
    if (query.dateTo) filter.timestamp.$lte = new Date(query.dateTo);
  }
  return filter;
};

const listProjectAudit = async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
  const filter = buildFilter(req.tenant._id, req.params.id, req.query);
  const [rows, total] = await Promise.all([
    AuditLog.find(filter).sort({ timestamp: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    AuditLog.countDocuments(filter),
  ]);
  return sendSuccess(res, { entries: rows, page, limit, total });
};

const exportProjectAudit = async (req, res) => {
  const format = String(req.query.format || 'csv').toLowerCase();
  const filter = buildFilter(req.tenant._id, req.params.id, req.query);
  const rows = await AuditLog.find(filter).sort({ timestamp: -1 }).limit(5000).lean();

  if (format === 'pdf') {
    // Placeholder export in plain text for now; keep endpoint contract stable.
    const body = rows
      .map((row) => `${row.timestamp?.toISOString?.() || ''} ${row.action} ${row.entityType}`)
      .join('\n');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="audit-${req.params.id}.txt"`);
    return res.status(200).send(body);
  }

  const csv = toCsv(rows);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="audit-${req.params.id}.csv"`);
  return res.status(200).send(csv);
};

const listTenantAudit = async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
  const filter = buildFilter(req.tenant._id, null, req.query);
  const [rows, total] = await Promise.all([
    AuditLog.find(filter).sort({ timestamp: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    AuditLog.countDocuments(filter),
  ]);
  return sendSuccess(res, { entries: rows, page, limit, total });
};

module.exports = {
  listProjectAudit,
  exportProjectAudit,
  listTenantAudit,
};
