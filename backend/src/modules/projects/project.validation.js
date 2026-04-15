const Joi = require('joi');
const { SERVICE_CATEGORIES } = require('../../constants/serviceCategories');

const locationSchema = Joi.object({
  address: Joi.string().trim().allow(null, ''),
  lat: Joi.number().min(-90).max(90).allow(null),
  lng: Joi.number().min(-180).max(180).allow(null),
});

const subConsultantSchema = Joi.object({
  role: Joi.string().trim().required(),
  name: Joi.string().trim().required(),
  appointedAt: Joi.date().iso().allow(null),
});

const createProjectSchema = Joi.object({
  name: Joi.string().min(2).max(200).trim().required(),
  serviceCategory: Joi.string().valid(...Object.values(SERVICE_CATEGORIES)).required(),
  localMunicipality: Joi.string().trim().allow(null, ''),
  idpProjectNo: Joi.string().trim().allow(null, ''),
  deptId: Joi.string().hex().length(24).allow(null, ''),
  contractTypes: Joi.array()
    .items(Joi.string().valid('professional', 'geotechnical', 'construction'))
    .min(1)
    .required(),
  contractValueOriginal: Joi.number().integer().min(0).default(0),
  location: locationSchema,
  gpsFormatted: Joi.string().trim().allow(null, ''),
  projectManager: Joi.string().hex().length(24).allow(null, ''),
  teamMembers: Joi.array().items(Joi.string().hex().length(24)).default([]),
  subConsultants: Joi.array().items(subConsultantSchema).default([]),
  appointmentDate: Joi.date().iso().allow(null),
  completionDate: Joi.date().iso().allow(null),
  geoTecEngineer: Joi.string().trim().allow(null, ''),
  contractor: Joi.string().trim().allow(null, ''),
  linkedMultiYearPlanId: Joi.string().hex().length(24).allow(null, ''),
});

const updateProjectSchema = Joi.object({
  name: Joi.string().min(2).max(200).trim(),
  serviceCategory: Joi.string().valid(...Object.values(SERVICE_CATEGORIES)),
  localMunicipality: Joi.string().trim().allow(null, ''),
  idpProjectNo: Joi.string().trim().allow(null, ''),
  status: Joi.string().valid('active', 'on-hold', 'cancelled'),
  contractTypes: Joi.array()
    .items(Joi.string().valid('professional', 'geotechnical', 'construction')),
  contractValueOriginal: Joi.number().integer().min(0),
  expenditureToDate: Joi.number().integer().min(0),
  location: locationSchema,
  gpsFormatted: Joi.string().trim().allow(null, ''),
  projectManager: Joi.string().hex().length(24).allow(null, ''),
  teamMembers: Joi.array().items(Joi.string().hex().length(24)),
  subConsultants: Joi.array().items(subConsultantSchema),
  appointmentDate: Joi.date().iso().allow(null),
  completionDate: Joi.date().iso().allow(null),
  geoTecEngineer: Joi.string().trim().allow(null, ''),
  contractor: Joi.string().trim().allow(null, ''),
});

const createPaymentSchema = Joi.object({
  amount: Joi.number().integer().min(1).required(),
  paymentDate: Joi.date().iso().required(),
  description: Joi.string().trim().allow(null, ''),
  certificateNo: Joi.string().trim().allow(null, ''),
  contractType: Joi.string().valid('professional', 'geotechnical', 'construction').required(),
});

const updatePaymentSchema = Joi.object({
  amount: Joi.number().integer().min(1),
  paymentDate: Joi.date().iso(),
  description: Joi.string().trim().allow(null, ''),
  certificateNo: Joi.string().trim().allow(null, ''),
});

const forecastEntrySchema = Joi.object({
  month: Joi.string().pattern(/^\d{4}-\d{2}$/).required(),
  forecastAmount: Joi.number().integer().min(0).required(),
  contractType: Joi.string().valid('professional', 'geotechnical', 'construction').required(),
});

const projectListQuerySchema = Joi.object({
  status: Joi.string().valid('active', 'on-hold', 'complete', 'cancelled'),
  serviceCategory: Joi.string().valid(...Object.values(SERVICE_CATEGORIES)),
  localMunicipality: Joi.string().trim(),
  deptId: Joi.string().hex().length(24),
  stage: Joi.number().integer().min(0).max(10),
  contractType: Joi.string().valid('professional', 'geotechnical', 'construction'),
  search: Joi.string().trim().max(100),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  createPaymentSchema,
  updatePaymentSchema,
  forecastEntrySchema,
  projectListQuerySchema,
};
