
const express = require('express');
const router = express.Router();
const ctrl = require('./grant.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validation.middleware');
const { requirePM, requireOrgAdmin, denyClientTemp } = require('../../middleware/rbac.middleware');
const {
  createGrantSchema,
  updateGrantSchema,
  grantListQuerySchema,
} = require('./grant.validation');

router.get('/', validate(grantListQuerySchema, 'query'), asyncHandler(ctrl.list));

router.post(
  '/',
  denyClientTemp,
  requirePM,
  validate(createGrantSchema),
  asyncHandler(ctrl.create),
);

router.get('/:id', asyncHandler(ctrl.getOne));

router.patch(
  '/:id',
  denyClientTemp,
  requirePM,
  validate(updateGrantSchema),
  asyncHandler(ctrl.update),
);

router.delete(
  '/:id',
  denyClientTemp,
  requireOrgAdmin,
  asyncHandler(ctrl.remove),
);

module.exports = router;
