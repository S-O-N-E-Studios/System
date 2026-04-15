const Joi = require('joi');
const { SERVICE_CATEGORIES } = require('../../constants/serviceCategories');

const SERVICE_CATEGORY_VALUES = Object.values(SERVICE_CATEGORIES);

const FUNDER_TYPES = [
  'self_generated',
  'mig',
  'rbig',
  'wsig',
  'equitable_share',
  'private_client',
  'other',
];

const PLAN_STATUSES = ['planned', 'selected_for_inception', 'active', 'cancelled'];

const objectId = Joi.string().hex().length(24);

const createPlanSchema = Joi.object({
  deptId: objectId.allow(null, ''),
  projectName: Joi.string().min(1).max(500).trim().required(),
  description: Joi.string().trim().allow(null, ''),
  serviceCategory: Joi.string()
    .valid(...SERVICE_CATEGORY_VALUES)
    .required(),
  localMunicipality: Joi.string().trim().allow(null, ''),
  plannedYear: Joi.number().valid(1, 2, 3, 4, 5).required(),
  financialYear: Joi.string().trim().min(1).required(),
  mtef: Joi.object({
    year1: Joi.number().min(0),
    year2: Joi.number().min(0),
    year3: Joi.number().min(0),
  }),
  funderType: Joi.string()
    .valid(...FUNDER_TYPES)
    .required(),
  estimatedValue: Joi.number().min(0),
  status: Joi.string().valid(...PLAN_STATUSES),
  idpProjectNo: Joi.string().trim().allow(null, ''),
});

const updatePlanSchema = Joi.object({
  deptId: objectId.allow(null, ''),
  projectName: Joi.string().min(1).max(500).trim(),
  description: Joi.string().trim().allow(null, ''),
  serviceCategory: Joi.string().valid(...SERVICE_CATEGORY_VALUES),
  localMunicipality: Joi.string().trim().allow(null, ''),
  plannedYear: Joi.number().valid(1, 2, 3, 4, 5),
  financialYear: Joi.string().trim().min(1),
  mtef: Joi.object({
    year1: Joi.number().min(0),
    year2: Joi.number().min(0),
    year3: Joi.number().min(0),
  }),
  funderType: Joi.string().valid(...FUNDER_TYPES),
  estimatedValue: Joi.number().min(0),
  status: Joi.string().valid(...PLAN_STATUSES),
  idpProjectNo: Joi.string().trim().allow(null, ''),
}).min(1);

const planListQuerySchema = Joi.object({
  plannedYear: Joi.number().valid(1, 2, 3, 4, 5),
  serviceCategory: Joi.string().valid(...SERVICE_CATEGORY_VALUES),
  localMunicipality: Joi.string().trim(),
  funderType: Joi.string().valid(...FUNDER_TYPES),
  status: Joi.string().valid(...PLAN_STATUSES),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  createPlanSchema,
  updatePlanSchema,
  planListQuerySchema,
};
