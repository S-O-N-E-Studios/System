
const Grant = require('./grant.model');

const buildFilter = (tenantId, filters = {}) => {
  const filter = { tenantId };

  if (filters.status) filter.status = filters.status;
  if (filters.deptId) filter.deptId = filters.deptId;
  if (filters.grantType) filter.grantType = filters.grantType;
  if (filters.financialYear) filter.financialYear = filters.financialYear;

  if (filters.search) {
    filter.$or = [
      { grantName: { $regex: filters.search, $options: 'i' } },
      { funderOrg: { $regex: filters.search, $options: 'i' } },
    ];
  }

  return filter;
};

const findAll = async (tenantId, filters = {}) => {
  const filter = buildFilter(tenantId, filters);
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const [grants, total] = await Promise.all([
    Grant.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('linkedProjects', 'name refCode status')
      .lean(),
    Grant.countDocuments(filter),
  ]);

  return { grants, total };
};

const findById = (id, tenantId) =>
  Grant.findOne({ _id: id, tenantId }).populate('linkedProjects', 'name refCode status');

const create = (data) => Grant.create(data);

const updateById = (id, tenantId, updates) =>
  Grant.findOneAndUpdate({ _id: id, tenantId }, updates, {
    new: true,
    runValidators: true,
  }).populate('linkedProjects', 'name refCode status');

const deleteById = (id, tenantId) => Grant.findOneAndDelete({ _id: id, tenantId });

module.exports = {
  findAll,
  findById,
  create,
  updateById,
  deleteById,
};
