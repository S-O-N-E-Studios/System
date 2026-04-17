const Joi = require('joi');
const { FILE_CATEGORIES } = require('../../constants/fileCategories');

const categoryValues = Object.values(FILE_CATEGORIES);
const MAX_DOCUMENT_BYTES = 50 * 1024 * 1024;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_BYTES = 150 * 1024 * 1024;

const FILE_MIME_PATTERNS = {
  document: /^(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|application\/vnd\.ms-excel|application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|text\/csv)$/i,
  image: /^(image\/jpeg|image\/jpg|image\/png|image\/heic)$/i,
  video: /^(video\/mp4|video\/quicktime|video\/mov)$/i,
};
const STAGE7_BILLING_CATEGORIES = new Set([
  FILE_CATEGORIES.PROGRESS_REPORT,
  FILE_CATEGORIES.SAFETY_REPORT,
  FILE_CATEGORIES.MONTHLY_CASH_FLOW,
  FILE_CATEGORIES.PAYMENT_CERTIFICATE,
  FILE_CATEGORIES.SITE_IMAGE,
  FILE_CATEGORIES.DRONE_VIDEO,
]);

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
  billingPeriod: Joi.string().pattern(/^\d{4}-\d{2}$/).allow(null, ''),
  category: Joi.string()
    .valid(...categoryValues)
    .required(),
  projectId: Joi.string().hex().length(24).required(),
  captureDate: Joi.date().iso().allow(null),
  captureGPS: captureGPSSchema.allow(null),
  activityId: Joi.string().hex().length(24).allow(null).optional(),
  variationOrderId: Joi.string().hex().length(24).allow(null).optional(),
  clientVisible: Joi.boolean().default(false),
}).custom((value, helpers) => {
  const mediaType = value.mediaType || 'document';
  const size = Number(value.sizeBytes || 0);
  const mime = String(value.mimeType || '');

  if (mediaType === 'document' && size > MAX_DOCUMENT_BYTES) {
    return helpers.error('any.invalid', { message: 'Document exceeds 50MB limit' });
  }
  if (mediaType === 'image' && size > MAX_IMAGE_BYTES) {
    return helpers.error('any.invalid', { message: 'Image exceeds 20MB limit' });
  }
  if (mediaType === 'video' && size > MAX_VIDEO_BYTES) {
    return helpers.error('any.invalid', { message: 'Video exceeds 150MB limit' });
  }

  const pattern = FILE_MIME_PATTERNS[mediaType];
  if (pattern && !pattern.test(mime)) {
    return helpers.error('any.invalid', { message: `Unsupported MIME type for ${mediaType}` });
  }
  const stage = Number(value.stage);
  const billingPeriod = value.billingPeriod ? String(value.billingPeriod).trim() : '';
  if (stage === 7 && STAGE7_BILLING_CATEGORIES.has(value.category) && !billingPeriod) {
    return helpers.error('any.invalid', {
      message: `billingPeriod is required for stage 7 ${value.category}`,
    });
  }
  return value;
}, 'file size and mime validation');

const fileListQuerySchema = Joi.object({
  projectId: Joi.string().hex().length(24),
  category: Joi.string().valid(...categoryValues),
  stage: Joi.number().integer().min(1).max(9),
  billingPeriod: Joi.string().pattern(/^\d{4}-\d{2}$/),
  approvalStatus: Joi.string().valid('not_required', 'pending', 'approved', 'rejected'),
  mediaType: Joi.string().valid('document', 'image', 'video'),
  clientVisible: Joi.boolean(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const uploadUrlSchema = Joi.object({
  projectId: Joi.string().hex().length(24).required(),
  stage: Joi.number().integer().min(1).max(9).allow(null).optional(),
  billingPeriod: Joi.string().pattern(/^\d{4}-\d{2}$/).allow(null, '').optional(),
  category: Joi.string()
    .valid(...categoryValues)
    .required(),
  fileName: Joi.string().trim().min(1).max(500).required(),
  mimeType: Joi.string().trim().min(1).required(),
  sizeBytes: Joi.number().integer().min(0).required(),
}).custom((value, helpers) => {
  const mime = String(value.mimeType || '');
  const size = Number(value.sizeBytes || 0);
  const mediaType = mime.startsWith('image/')
    ? 'image'
    : mime.startsWith('video/')
      ? 'video'
      : 'document';

  if (mediaType === 'document' && size > MAX_DOCUMENT_BYTES) {
    return helpers.error('any.invalid', { message: 'Document exceeds 50MB limit' });
  }
  if (mediaType === 'image' && size > MAX_IMAGE_BYTES) {
    return helpers.error('any.invalid', { message: 'Image exceeds 20MB limit' });
  }
  if (mediaType === 'video' && size > MAX_VIDEO_BYTES) {
    return helpers.error('any.invalid', { message: 'Video exceeds 150MB limit' });
  }
  const stage = Number(value.stage);
  const billingPeriod = value.billingPeriod ? String(value.billingPeriod).trim() : '';
  if (stage === 7 && STAGE7_BILLING_CATEGORIES.has(value.category) && !billingPeriod) {
    return helpers.error('any.invalid', {
      message: `billingPeriod is required for stage 7 ${value.category}`,
    });
  }
  return value;
}, 'upload size validation');

const visibilitySchema = Joi.object({
  clientVisible: Joi.boolean().optional(),
});

module.exports = {
  registerFileSchema,
  fileListQuerySchema,
  uploadUrlSchema,
  visibilitySchema,
};
