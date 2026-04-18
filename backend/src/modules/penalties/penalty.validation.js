const Joi = require('joi');

const penaltyTypeSchema = Joi.string().valid('delay', 'quality', 'contractual', 'other');

const createPenaltySchema = Joi.object({
  penaltyType: penaltyTypeSchema.default('other'),
  amountCents: Joi.number().integer().min(0).required(),
  reason: Joi.string().trim().min(3).max(4000).required(),
  supportingFileIds: Joi.array().items(Joi.string().hex().length(24)).max(20),
  assignedApproverId: Joi.string().hex().length(24).allow(null, ''),
  thresholdAmountCents: Joi.number().integer().min(0).allow(null),
  thresholdExceeded: Joi.boolean(),
  thresholdWarningNote: Joi.string().trim().max(1000).allow(null, ''),
});

const updatePenaltySchema = Joi.object({
  penaltyType: penaltyTypeSchema,
  amountCents: Joi.number().integer().min(0),
  reason: Joi.string().trim().min(3).max(4000),
  status: Joi.string().valid('draft', 'pending_approval', 'approved', 'rejected', 'waived'),
  supportingFileIds: Joi.array().items(Joi.string().hex().length(24)).max(20),
  assignedApproverId: Joi.string().hex().length(24).allow(null, ''),
  thresholdAmountCents: Joi.number().integer().min(0).allow(null),
  thresholdExceeded: Joi.boolean(),
  thresholdWarningNote: Joi.string().trim().max(1000).allow(null, ''),
}).min(1);

const rejectPenaltySchema = Joi.object({
  reason: Joi.string().trim().min(3).max(4000).required(),
});

module.exports = {
  createPenaltySchema,
  updatePenaltySchema,
  rejectPenaltySchema,
};
