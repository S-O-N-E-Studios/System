
const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const optionalDeptId = Joi.alternatives().try(
  objectId,
  Joi.string().valid(''),
  Joi.valid(null),
);

const reportingScheduleEntrySchema = Joi.object({
  dueDate: Joi.date().iso().required(),
  submittedDate: Joi.date().iso().allow(null),
  status: Joi.string().valid('pending', 'submitted', 'overdue').default('pending'),
});

const createGrantSchema = Joi.object({
  deptId: optionalDeptId,
  grantName: Joi.string().min(1).max(500).trim().required(),
  grantType: Joi.string().min(1).max(200).trim().required(),
  funderOrg: Joi.string().min(1).max(500).trim().required(),
  financialYear: Joi.string().min(1).max(50).trim().required(),
  totalValue: Joi.number().integer().min(0).default(0),
  allocatedToProjects: Joi.number().integer().min(0).default(0),
  disbursedToDate: Joi.number().integer().min(0).default(0),
  complianceDeadline: Joi.date().iso().allow(null),
  reportingSchedule: Joi.array().items(reportingScheduleEntrySchema).default([]),
  linkedProjects: Joi.array().items(objectId).default([]),
  status: Joi.string().valid('active', 'closed', 'pending').default('pending'),
});

const updateGrantSchema = Joi.object({
  deptId: optionalDeptId,
  grantName: Joi.string().min(1).max(500).trim(),
  grantType: Joi.string().min(1).max(200).trim(),
  funderOrg: Joi.string().min(1).max(500).trim(),
  financialYear: Joi.string().min(1).max(50).trim(),
  totalValue: Joi.number().integer().min(0),
  allocatedToProjects: Joi.number().integer().min(0),
  disbursedToDate: Joi.number().integer().min(0),
  complianceDeadline: Joi.date().iso().allow(null),
  reportingSchedule: Joi.array().items(reportingScheduleEntrySchema),
  linkedProjects: Joi.array().items(objectId),
  status: Joi.string().valid('active', 'closed', 'pending'),
}).min(1);

const grantListQuerySchema = Joi.object({
  status: Joi.string().valid('active', 'closed', 'pending'),
  deptId: objectId,
  grantType: Joi.string().trim().max(200),
  financialYear: Joi.string().trim().max(50),
  search: Joi.string().trim().max(200),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  createGrantSchema,
  updateGrantSchema,
  grantListQuerySchema,
};
