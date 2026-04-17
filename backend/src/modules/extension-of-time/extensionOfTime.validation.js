const Joi = require('joi');

const createEotSchema = Joi.object({
  reason: Joi.string().trim().min(3).max(4000).required(),
  requestedDays: Joi.number().integer().min(1).max(3650).required(),
  consultantRecommendationFileId: Joi.string().hex().length(24).allow(null, ''),
  pmuRecommendationFileId: Joi.string().hex().length(24).allow(null, ''),
  approvalFileId: Joi.string().hex().length(24).allow(null, ''),
  supportingFileIds: Joi.array().items(Joi.string().hex().length(24)).max(20),
  assignedApproverId: Joi.string().hex().length(24).allow(null, ''),
  requestedDaysThreshold: Joi.number().integer().min(1).max(3650).allow(null),
  thresholdExceeded: Joi.boolean(),
  thresholdWarningNote: Joi.string().trim().max(1000).allow(null, ''),
});

const updateEotSchema = Joi.object({
  reason: Joi.string().trim().min(3).max(4000),
  requestedDays: Joi.number().integer().min(1).max(3650),
  consultantRecommendationFileId: Joi.string().hex().length(24).allow(null, ''),
  pmuRecommendationFileId: Joi.string().hex().length(24).allow(null, ''),
  approvalFileId: Joi.string().hex().length(24).allow(null, ''),
  supportingFileIds: Joi.array().items(Joi.string().hex().length(24)).max(20),
  assignedApproverId: Joi.string().hex().length(24).allow(null, ''),
  requestedDaysThreshold: Joi.number().integer().min(1).max(3650).allow(null),
  thresholdExceeded: Joi.boolean(),
  thresholdWarningNote: Joi.string().trim().max(1000).allow(null, ''),
}).min(1);

const rejectEotSchema = Joi.object({
  reason: Joi.string().trim().min(3).max(4000).required(),
});

module.exports = {
  createEotSchema,
  updateEotSchema,
  rejectEotSchema,
};
