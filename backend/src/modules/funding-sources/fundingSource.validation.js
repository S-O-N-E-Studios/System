const Joi = require('joi');

const FUNDER_TYPES = [
  'self_generated',
  'mig',
  'rbig',
  'wsig',
  'equitable_share',
  'private_client',
  'other',
];

const disbursementEntry = Joi.object({
  date: Joi.date().required(),
  amount: Joi.number().min(0).required(),
  status: Joi.string().valid('pending', 'received', 'overdue').default('pending'),
});

const createFundingSourceSchema = Joi.object({
  sourceName: Joi.string().trim().required(),
  sourceType: Joi.string()
    .valid(...FUNDER_TYPES)
    .required(),
  funderOrg: Joi.string().trim().allow(null, ''),
  totalAllocated: Joi.number().min(0).default(0),
  totalDisbursed: Joi.number().min(0).default(0),
  disbursementSchedule: Joi.array().items(disbursementEntry).default([]),
  conditions: Joi.string().allow(null, ''),
  complianceStatus: Joi.string()
    .valid('compliant', 'at_risk', 'non_compliant')
    .default('compliant'),
});

const updateFundingSourceSchema = Joi.object({
  sourceName: Joi.string().trim(),
  sourceType: Joi.string().valid(...FUNDER_TYPES),
  funderOrg: Joi.string().trim().allow(null, ''),
  totalAllocated: Joi.number().min(0),
  totalDisbursed: Joi.number().min(0),
  disbursementSchedule: Joi.array().items(disbursementEntry),
  conditions: Joi.string().allow(null, ''),
  complianceStatus: Joi.string().valid('compliant', 'at_risk', 'non_compliant'),
});

module.exports = {
  createFundingSourceSchema,
  updateFundingSourceSchema,
};
