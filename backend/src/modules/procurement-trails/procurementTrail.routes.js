const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('./procurementTrail.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validation.middleware');
const {
  denyClientTemp,
  requireConsultantOperator,
  requireProcurementStepReviewOrMarkNa,
} = require('../../middleware/rbac.middleware');
const {
  createTrailSchema,
  updateTrailSchema,
  reviewStepBodySchema,
  reviewStepParamsSchema,
} = require('./procurementTrail.validation');

router.get('/', asyncHandler(ctrl.list));
router.post('/', denyClientTemp, requireConsultantOperator, validate(createTrailSchema), asyncHandler(ctrl.create));
router.get('/:trailId', asyncHandler(ctrl.getOne));
router.patch('/:trailId', denyClientTemp, requireConsultantOperator, validate(updateTrailSchema), asyncHandler(ctrl.update));
router.post(
  '/:trailId/steps/:stepKey/review',
  denyClientTemp,
  requireProcurementStepReviewOrMarkNa,
  validate(reviewStepParamsSchema, 'params'),
  validate(reviewStepBodySchema),
  asyncHandler(ctrl.reviewStep)
);

module.exports = router;
