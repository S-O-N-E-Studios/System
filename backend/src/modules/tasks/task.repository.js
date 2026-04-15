const Task = require('./task.model');

const buildListFilter = (tenantId, query = {}, { projectIdIn } = {}) => {
  const filter = { tenantId };

  if (projectIdIn && projectIdIn.length) {
    filter.projectId = { $in: projectIdIn };
  } else if (query.projectId) {
    filter.projectId = query.projectId;
  }

  if (query.sprintId) filter.sprintId = query.sprintId;
  if (query.status) filter.status = query.status;
  if (query.assignedTo) filter.assignedTo = query.assignedTo;

  return filter;
};

const findTasks = async (tenantId, query = {}, scope = {}) => {
  const filter = buildListFilter(tenantId, query, scope);
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('assignedTo', 'fullName email avatarUrl')
      .populate('projectId', 'name refCode')
      .populate('sprintId', 'name status startDate endDate')
      .populate('createdBy', 'fullName email')
      .lean(),
    Task.countDocuments(filter),
  ]);

  return { tasks, total };
};

const findById = (id, tenantId) =>
  Task.findOne({ _id: id, tenantId })
    .populate('assignedTo', 'fullName email avatarUrl')
    .populate('projectId', 'name refCode')
    .populate('sprintId', 'name status startDate endDate')
    .populate('createdBy', 'fullName email');

const create = (data) => Task.create(data);

const updateById = (id, tenantId, updates) =>
  Task.findOneAndUpdate({ _id: id, tenantId }, updates, {
    new: true,
    runValidators: true,
  })
    .populate('assignedTo', 'fullName email avatarUrl')
    .populate('projectId', 'name refCode')
    .populate('sprintId', 'name status startDate endDate')
    .populate('createdBy', 'fullName email');

const deleteById = (id, tenantId) => Task.findOneAndDelete({ _id: id, tenantId });

module.exports = {
  findTasks,
  findById,
  create,
  updateById,
  deleteById,
};
