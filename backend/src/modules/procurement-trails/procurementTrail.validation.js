const Joi = require('joi');
const { APPOINTMENT_TYPES, STEP_KEYS, STEP_STATUSES } = require('./procurementTrail.model');

const objectId = Joi.string().hex().length(24);

const createTrailSchema = Joi.object({
  appointmentType: Joi.string()
    .valid(...APPOINTMENT_TYPES)
    .required(),
  assignee: Joi.object({
    name: Joi.string().trim().max(200),
    firm: Joi.string().trim().max(200),
    contactEmail: Joi.string().trim().email().max(255),
  }).default({}),
});

const updateTrailSchema = Joi.object({
  assignee: Joi.object({
    name: Joi.string().trim().allow(null, ''),
    firm: Joi.string().trim().allow(null, ''),
    contactEmail: Joi.string().trim().email().allow(null, ''),
  }),
}).min(1);

const reviewStepBodySchema = Joi.object({
  status: Joi.string()
    .valid(...STEP_STATUSES)
    .required(),
  reason: Joi.string().trim().max(4000).allow(null, ''),
  fileIds: Joi.array().items(objectId).max(20),
});

const reviewStepParamsSchema = Joi.object({
  stepKey: Joi.string()
    .valid(...STEP_KEYS)
    .required(),
});

module.exports = {
  createTrailSchema,
  updateTrailSchema,
  reviewStepBodySchema,
  reviewStepParamsSchema,
};
