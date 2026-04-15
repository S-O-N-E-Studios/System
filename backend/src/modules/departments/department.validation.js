
const Joi = require('joi');

const programSchema = Joi.object({
  name:   Joi.string().trim().required(),
  budget: Joi.number().min(0).default(0),
});

const slugPattern = /^[a-z0-9-]+$/;

const createDepartmentSchema = Joi.object({
  name:         Joi.string().min(2).max(150).trim().required(),
  slug:         Joi.string().min(2).max(60).lowercase().trim().pattern(slugPattern).optional(),
  budgetTotal:  Joi.number().min(0).default(0),
  budgetSpent:  Joi.number().min(0).default(0),
  headOfDept:   Joi.string().trim().allow(null, ''),
  programs:     Joi.array().items(programSchema).default([]),
});

const updateDepartmentSchema = Joi.object({
  name:         Joi.string().min(2).max(150).trim(),
  slug:         Joi.string().min(2).max(60).lowercase().trim().pattern(slugPattern),
  budgetTotal:  Joi.number().min(0),
  budgetSpent:  Joi.number().min(0),
  headOfDept:   Joi.string().trim().allow(null, ''),
  programs:     Joi.array().items(programSchema),
});

module.exports = {
  createDepartmentSchema,
  updateDepartmentSchema,
};
