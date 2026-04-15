const express = require('express');
const router = express.Router({ mergeParams: true });
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validation.middleware');
const { requirePM, denyClientTemp } = require('../../middleware/rbac.middleware');
const { sendSuccess, sendCreated } = require('../../utils/apiResponse');
const Joi = require('joi');
const File = require('./file.model');

const mediaListQuerySchema = Joi.object({
  stage: Joi.number().integer().min(1).max(9),
  type: Joi.string().valid('image', 'video'),
  activityId: Joi.string().hex().length(24),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const registerMediaSchema = Joi.object({
  originalName: Joi.string().required(),
  storagePath: Joi.string().required(),
  mimeType: Joi.string().required(),
  sizeBytes: Joi.number().integer().min(0).default(0),
  mediaType: Joi.string().valid('image', 'video').required(),
  stage: Joi.number().integer().min(1).max(9).allow(null),
  captureDate: Joi.date().iso().allow(null),
  captureGPS: Joi.object({
    lat: Joi.number().min(-90).max(90),
    lng: Joi.number().min(-180).max(180),
  }).allow(null),
  description: Joi.string().trim().allow(null, ''),
  activityId: Joi.string().hex().length(24).allow(null, ''),
  mediaDurationSeconds: Joi.number().integer().min(0).allow(null),
});

router.get('/',
  validate(mediaListQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { stage, type, activityId, page, limit } = req.query;
    const filter = {
      tenantId: req.tenant._id,
      projectId: req.params.id,
      mediaType: { $in: ['image', 'video'] },
      deletedAt: null,
    };
    if (stage) filter.stage = stage;
    if (type) filter.mediaType = type;
    if (activityId) filter.activityId = activityId;

    const skip = ((page || 1) - 1) * (limit || 20);
    const [media, total] = await Promise.all([
      File.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit || 20).lean(),
      File.countDocuments(filter),
    ]);

    return sendSuccess(res, { media, total });
  })
);

router.post('/upload-url',
  denyClientTemp,
  asyncHandler(async (req, res) => {
    const key = `${req.tenant.slug}/${req.params.id}/media/${Date.now()}-${req.body.fileName || 'upload'}`;
    return sendSuccess(res, { url: 'placeholder-presigned-url', key });
  })
);

router.post('/',
  denyClientTemp,
  validate(registerMediaSchema),
  asyncHandler(async (req, res) => {
    const category = req.body.mediaType === 'video' ? 'drone-video' : 'site-image';
    const file = await File.create({
      ...req.body,
      tenantId: req.tenant._id,
      projectId: req.params.id,
      category,
      uploadedBy: req.user.sub,
      clientVisible: true,
    });
    return sendCreated(res, { media: file });
  })
);

router.delete('/:mediaId',
  denyClientTemp,
  requirePM,
  asyncHandler(async (req, res) => {
    const file = await File.findOneAndUpdate(
      { _id: req.params.mediaId, tenantId: req.tenant._id, projectId: req.params.id },
      { deletedAt: new Date() },
      { new: true }
    );
    if (!file) throw Object.assign(new Error('Media not found'), { status: 404 });
    return sendSuccess(res, { deleted: true });
  })
);

router.get('/:mediaId/url',
  asyncHandler(async (req, res) => {
    const file = await File.findOne({
      _id: req.params.mediaId,
      tenantId: req.tenant._id,
      projectId: req.params.id,
      deletedAt: null,
    }).lean();
    if (!file) throw Object.assign(new Error('Media not found'), { status: 404 });
    return sendSuccess(res, { url: file.storagePath });
  })
);

module.exports = router;
