

const Joi = require('joi');

const createActivitySchema = Joi.object({
  name:          Joi.string().min(2).max(200).trim().required(),
  startDate:     Joi.date().iso().required(),
  endDate:       Joi.date().iso().greater(Joi.ref('startDate')).required()
    .messages({ 'date.greater': 'End date must be after start date' }),
  status:        Joi.string().valid('on-track', 'delayed', 'pending', 'complete').default('pending'),
  expectedFunds: Joi.number().integer().min(0).default(0),
  actualFunds:   Joi.number().integer().min(0).default(0),
});

const updateActivitySchema = Joi.object({
  name:          Joi.string().min(2).max(200).trim(),
  startDate:     Joi.date().iso(),
  endDate:       Joi.date().iso(),
  status:        Joi.string().valid('on-track', 'delayed', 'pending', 'complete'),
  expectedFunds: Joi.number().integer().min(0),
  actualFunds:   Joi.number().integer().min(0),
});

module.exports = { createActivitySchema, updateActivitySchema };