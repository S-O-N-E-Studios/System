const taskRepo = require('./task.repository');
const { ROLES } = require('../../constants/roles');

const listTasks = async (tenant, query, user, clientAccess) => {
  if (user.role === ROLES.CLIENT_TEMP) {
    const projectIds = clientAccess?.projectIds || [];
    if (!projectIds.length) {
      return { tasks: [], total: 0 };
    }

    if (query.projectId) {
      const allowed = projectIds.some(
        (pid) => pid.toString() === query.projectId.toString(),
      );
      if (!allowed) {
        throw Object.assign(new Error('Access denied to this project'), { status: 403 });
      }
      return taskRepo.findTasks(tenant._id, query, {});
    }

    return taskRepo.findTasks(tenant._id, query, { projectIdIn: projectIds });
  }

  return taskRepo.findTasks(tenant._id, query, {});
};

const getTask = async (tenant, taskId, user, clientAccess) => {
  const task = await taskRepo.findById(taskId, tenant._id);
  if (!task) throw Object.assign(new Error('Task not found'), { status: 404 });

  if (user.role === ROLES.CLIENT_TEMP) {
    const projectIds = clientAccess?.projectIds || [];
    const pid = task.projectId?._id || task.projectId;
    if (!pid) {
      throw Object.assign(new Error('Access denied to this task'), { status: 403 });
    }
    const allowed = projectIds.some((id) => id.toString() === pid.toString());
    if (!allowed) {
      throw Object.assign(new Error('Access denied to this task'), { status: 403 });
    }
  }

  return task;
};

const createTask = async (tenant, data, createdBy) => {
  const task = await taskRepo.create({
    ...data,
    tenantId: tenant._id,
    createdBy,
  });
  return taskRepo.findById(task._id, tenant._id);
};

const updateTask = async (tenant, taskId, updates) => {
  const task = await taskRepo.updateById(taskId, tenant._id, updates);
  if (!task) throw Object.assign(new Error('Task not found'), { status: 404 });
  return task;
};

const deleteTask = async (tenant, taskId) => {
  const deleted = await taskRepo.deleteById(taskId, tenant._id);
  if (!deleted) throw Object.assign(new Error('Task not found'), { status: 404 });
  return { deleted: true };
};

module.exports = {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
};
