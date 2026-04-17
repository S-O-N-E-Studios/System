//  * All DB queries for files. Every query is scoped to tenantId.

const File = require('./file.model');

const findFiles = async (tenantId, filters = {}) => {
  const {
    projectId,
    category,
    stage,
    billingPeriod,
    approvalStatus,
    mediaType,
    clientVisible,
    page = 1,
    limit = 20,
  } = filters;

  const filter = { tenantId, deletedAt: null };

  if (projectId) filter.projectId = projectId;
  if (category) filter.category = category;
  if (stage !== undefined && stage !== null && stage !== '') {
    const n = Number(stage);
    filter.stage = Number.isNaN(n) ? stage : n;
  }
  if (billingPeriod) filter.billingPeriod = billingPeriod;
  if (approvalStatus) filter.approvalStatus = approvalStatus;
  if (mediaType) filter.mediaType = mediaType;
  if (typeof clientVisible === 'boolean') filter.clientVisible = clientVisible;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [files, total] = await Promise.all([
    File.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    File.countDocuments(filter),
  ]);

  return { files, total, page: pageNum, limit: limitNum };
};

const findById = (id, tenantId) =>
  File.findOne({ _id: id, tenantId, deletedAt: null });

const create = (data) => File.create(data);

const updateById = (id, tenantId, updates) =>
  File.findOneAndUpdate(
    { _id: id, tenantId, deletedAt: null },
    { $set: updates },
    { new: true, runValidators: true }
  );

const softDelete = (id, tenantId) =>
  File.findOneAndUpdate(
    { _id: id, tenantId, deletedAt: null },
    { $set: { deletedAt: new Date() } },
    { new: true }
  );

module.exports = {
  findFiles,
  findById,
  create,
  updateById,
  softDelete,
};
