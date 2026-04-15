const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const grantAccessSchema = Joi.object({
  clientEmail: Joi.string().email().required().lowercase().trim(),
  projectIds: Joi.array().items(objectId).min(1).required(),
  expiresAt: Joi.date().greater('now').required(),
  canApproveDocuments: Joi.boolean().default(false),
});

const extendAccessSchema = Joi.object({
  expiresAt: Joi.date().greater('now').required(),
});

module.exports = {
  grantAccessSchema,
  extendAccessSchema,
};
