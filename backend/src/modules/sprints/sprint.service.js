const sprintRepo = require('./sprint.repository');

const assertDateRange = (startDate, endDate) => {
  if (new Date(endDate) < new Date(startDate)) {
    throw Object.assign(new Error('endDate must be on or after startDate'), {
      status: 400,
    });
  }
};

const listSprints = async (tenant) => {
  const sprints = await sprintRepo.findSprints(tenant._id);
  return { sprints, total: sprints.length };
};

const getSprint = async (tenant, sprintId) => {
  const sprint = await sprintRepo.findById(sprintId, tenant._id);
  if (!sprint) throw Object.assign(new Error('Sprint not found'), { status: 404 });
  return sprint;
};

const createSprint = async (tenant, data, createdBy) => {
  assertDateRange(data.startDate, data.endDate);
  const sprint = await sprintRepo.create({
    ...data,
    tenantId: tenant._id,
    createdBy,
  });
  return sprintRepo.findById(sprint._id, tenant._id);
};

const updateSprint = async (tenant, sprintId, updates) => {
  const start = updates.startDate;
  const end = updates.endDate;
  if (start != null && end != null) {
    assertDateRange(start, end);
  } else if (start != null || end != null) {
    const existing = await sprintRepo.findById(sprintId, tenant._id);
    if (!existing) throw Object.assign(new Error('Sprint not found'), { status: 404 });
    const nextStart = start != null ? start : existing.startDate;
    const nextEnd = end != null ? end : existing.endDate;
    assertDateRange(nextStart, nextEnd);
  }

  const sprint = await sprintRepo.updateById(sprintId, tenant._id, updates);
  if (!sprint) throw Object.assign(new Error('Sprint not found'), { status: 404 });
  return sprint;
};

const deleteSprint = async (tenant, sprintId) => {
  const deleted = await sprintRepo.deleteById(sprintId, tenant._id);
  if (!deleted) throw Object.assign(new Error('Sprint not found'), { status: 404 });
  return { deleted: true };
};

module.exports = {
  listSprints,
  getSprint,
  createSprint,
  updateSprint,
  deleteSprint,
};
