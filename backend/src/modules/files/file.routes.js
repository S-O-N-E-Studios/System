//  * Mounted at /:tenantSlug/files

const express = require('express');
const router = express.Router();
const ctrl = require('./file.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validation.middleware');
const { requirePM, denyClientTemp } = require('../../middleware/rbac.middleware');
const {
  validateClientAccess,
  requireProjectScope,
} = require('../../middleware/clientAccess.middleware');
const {
  registerFileSchema,
  fileListQuerySchema,
  uploadUrlSchema,
  visibilitySchema,
} = require('./file.validation');

router.use(validateClientAccess);

const mergeProjectIdFromQuery = (req, res, next) => {
  if (req.query?.projectId) req.params.projectId = req.query.projectId;
  next();
};

router.post(
  '/upload-url',
  denyClientTemp,
  validate(uploadUrlSchema),
  asyncHandler(ctrl.requestUploadUrl)
);

router.get(
  '/',
  validate(fileListQuerySchema, 'query'),
  mergeProjectIdFromQuery,
  requireProjectScope,
  asyncHandler(ctrl.list)
);

router.post(
  '/',
  denyClientTemp,
  validate(registerFileSchema),
  asyncHandler(ctrl.register)
);

router.patch(
  '/:id/visibility',
  requirePM,
  validate(visibilitySchema),
  asyncHandler(ctrl.toggleVisibility)
);

router.delete('/:id', requirePM, asyncHandler(ctrl.remove));

router.get('/:id/download-url', asyncHandler(ctrl.downloadUrl));

module.exports = router;
