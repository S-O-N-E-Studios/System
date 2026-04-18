const Joi = require('joi');

const SPRINT_STATUSES = ['planned', 'active', 'completed'];

const createSprintSchema = Joi.object({
  name: Joi.string().min(1).max(200).trim().required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().required(),
  status: Joi.string().valid(...SPRINT_STATUSES),
  goal: Joi.string().trim().allow(null, ''),
});

const updateSprintSchema = Joi.object({
  name: Joi.string().min(1).max(200).trim(),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso(),
  status: Joi.string().valid(...SPRINT_STATUSES),
  goal: Joi.string().trim().allow(null, ''),
});

module.exports = {
  createSprintSchema,
  updateSprintSchema,
  SPRINT_STATUSES,
};
