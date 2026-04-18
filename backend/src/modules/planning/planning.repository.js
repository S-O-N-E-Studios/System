const MultiYearPlan = require('./multiYearPlan.model');

const buildFilter = (tenantId, filters = {}) => {
  const q = { tenantId };
  if (filters.plannedYear !== undefined && filters.plannedYear !== null) {
    q.plannedYear = filters.plannedYear;
  }
  if (filters.serviceCategory) q.serviceCategory = filters.serviceCategory;
  if (filters.localMunicipality) q.localMunicipality = filters.localMunicipality;
  if (filters.funderType) q.funderType = filters.funderType;
  if (filters.status) q.status = filters.status;
  return q;
};

const findAll = async (tenantId, filters = {}) => {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const { plannedYear, serviceCategory, localMunicipality, funderType, status } = filters;
  const filter = buildFilter(tenantId, {
    plannedYear,
    serviceCategory,
    localMunicipality,
    funderType,
    status,
  });
  const skip = (page - 1) * limit;

  const [plans, total] = await Promise.all([
    MultiYearPlan.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    MultiYearPlan.countDocuments(filter),
  ]);

  return { plans, total, page, limit };
};

const findById = (id, tenantId) => MultiYearPlan.findOne({ _id: id, tenantId });

const create = (data) => MultiYearPlan.create(data);

const updateById = (id, tenantId, updates) =>
  MultiYearPlan.findOneAndUpdate({ _id: id, tenantId }, updates, {
    new: true,
    runValidators: true,
  });

const deleteById = (id, tenantId) => MultiYearPlan.findOneAndDelete({ _id: id, tenantId });

module.exports = {
  findAll,
  findById,
  create,
  updateById,
  deleteById,
};
