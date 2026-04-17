const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('./procurementTrail.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validation.middleware');
const { denyClientTemp, requirePM } = require('../../middleware/rbac.middleware');
const {
  createTrailSchema,
  updateTrailSchema,
  reviewStepBodySchema,
  reviewStepParamsSchema,
} = require('./procurementTrail.validation');

router.get('/', asyncHandler(ctrl.list));
router.post('/', denyClientTemp, requirePM, validate(createTrailSchema), asyncHandler(ctrl.create));
router.get('/:trailId', asyncHandler(ctrl.getOne));
router.patch('/:trailId', denyClientTemp, requirePM, validate(updateTrailSchema), asyncHandler(ctrl.update));
router.post(
  '/:trailId/steps/:stepKey/review',
  denyClientTemp,
  requirePM,
  validate(reviewStepParamsSchema, 'params'),
  validate(reviewStepBodySchema),
  asyncHandler(ctrl.reviewStep)
);

module.exports = router;
