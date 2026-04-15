const Joi = require('joi');
const { FILE_CATEGORIES } = require('../../constants/fileCategories');

const categoryValues = Object.values(FILE_CATEGORIES);

const captureGPSSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).allow(null),
  lng: Joi.number().min(-180).max(180).allow(null),
});

const registerFileSchema = Joi.object({
  originalName: Joi.string().trim().min(1).max(500).required(),
  storagePath: Joi.string().trim().min(1).required(),
  mimeType: Joi.string().trim().min(1).required(),
  sizeBytes: Joi.number().integer().min(0).default(0),
  mediaType: Joi.string().valid('document', 'image', 'video').default('document'),
  stage: Joi.number().integer().min(1).max(9).allow(null).default(null),
  category: Joi.string()
    .valid(...categoryValues)
    .required(),
  projectId: Joi.string().hex().length(24).required(),
  captureDate: Joi.date().iso().allow(null),
  captureGPS: captureGPSSchema.allow(null),
  activityId: Joi.string().hex().length(24).allow(null).optional(),
  variationOrderId: Joi.string().hex().length(24).allow(null).optional(),
  clientVisible: Joi.boolean().default(false),
});

const fileListQuerySchema = Joi.object({
  projectId: Joi.string().hex().length(24),
  category: Joi.string().valid(...categoryValues),
  stage: Joi.number().integer().min(1).max(9),
  approvalStatus: Joi.string().valid('not_required', 'pending', 'approved', 'rejected'),
  mediaType: Joi.string().valid('document', 'image', 'video'),
  clientVisible: Joi.boolean(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const uploadUrlSchema = Joi.object({
  projectId: Joi.string().hex().length(24).required(),
  stage: Joi.number().integer().min(1).max(9).allow(null).optional(),
  category: Joi.string()
    .valid(...categoryValues)
    .required(),
  fileName: Joi.string().trim().min(1).max(500).required(),
  mimeType: Joi.string().trim().min(1).required(),
  sizeBytes: Joi.number().integer().min(0).required(),
});

const visibilitySchema = Joi.object({
  clientVisible: Joi.boolean().optional(),
});

module.exports = {
  registerFileSchema,
  fileListQuerySchema,
  uploadUrlSchema,
  visibilitySchema,
};
