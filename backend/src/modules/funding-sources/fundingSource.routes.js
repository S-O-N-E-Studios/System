const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('./fundingSource.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validation.middleware');
const { requirePM, requireOrgAdmin, denyClientTemp } = require('../../middleware/rbac.middleware');
const {
  createFundingSourceSchema,
  updateFundingSourceSchema,
} = require('./fundingSource.validation');

router.use(denyClientTemp);

router.get('/', asyncHandler(ctrl.list));

router.post(
  '/',
  requirePM,
  validate(createFundingSourceSchema),
  asyncHandler(ctrl.create),
);

router.patch(
  '/:fsId',
  requirePM,
  validate(updateFundingSourceSchema),
  asyncHandler(ctrl.update),
);

router.delete('/:fsId', requireOrgAdmin, asyncHandler(ctrl.remove));

module.exports = router;
