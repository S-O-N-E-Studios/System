const Joi = require('joi');

const TASK_STATUSES = ['todo', 'in-progress', 'review', 'done'];
const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'];

const objectId = Joi.string().hex().length(24);

const createTaskSchema = Joi.object({
  projectId: objectId.allow(null).empty(''),
  sprintId: objectId.allow(null).empty(''),
  title: Joi.string().min(1).max(500).trim().required(),
  description: Joi.string().trim().allow(null, ''),
  status: Joi.string().valid(...TASK_STATUSES),
  priority: Joi.string().valid(...TASK_PRIORITIES),
  assignedTo: objectId.allow(null).empty(''),
  dueDate: Joi.date().iso().allow(null),
  order: Joi.number().integer().min(0),
});

const updateTaskSchema = Joi.object({
  projectId: objectId.allow(null).empty(''),
  sprintId: objectId.allow(null).empty(''),
  title: Joi.string().min(1).max(500).trim(),
  description: Joi.string().trim().allow(null, ''),
  status: Joi.string().valid(...TASK_STATUSES),
  priority: Joi.string().valid(...TASK_PRIORITIES),
  assignedTo: objectId.allow(null).empty(''),
  dueDate: Joi.date().iso().allow(null),
  order: Joi.number().integer().min(0),
});

const taskListQuerySchema = Joi.object({
  projectId: objectId,
  sprintId: objectId,
  status: Joi.string().valid(...TASK_STATUSES),
  assignedTo: objectId,
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  taskListQuerySchema,
  TASK_STATUSES,
  TASK_PRIORITIES,
};
