const Joi = require('joi');

const createMilestoneSchema = Joi.object({
  title: Joi.string().min(2).max(200).trim().required(),
  description: Joi.string().max(1000).trim().allow(null, ''),
  dueDate: Joi.date().iso().allow(null),
  status: Joi.string().valid('pending', 'completed', 'overdue').default('pending'),
});

const updateMilestoneSchema = Joi.object({
  title: Joi.string().min(2).max(200).trim(),
  description: Joi.string().max(1000).trim().allow(null, ''),
  dueDate: Joi.date().iso().allow(null),
  status: Joi.string().valid('pending', 'completed', 'overdue'),
  completedAt: Joi.date().iso().allow(null),
});

module.exports = {
  createMilestoneSchema,
  updateMilestoneSchema,
};
