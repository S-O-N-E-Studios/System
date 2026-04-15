//  * Mounted at /:tenantSlug/sprints

const express = require('express');
const router = express.Router();
const ctrl = require('./sprint.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validation.middleware');
const { requirePM, requireOrgAdmin } = require('../../middleware/rbac.middleware');
const { createSprintSchema, updateSprintSchema } = require('./sprint.validation');

router.get('/', asyncHandler(ctrl.list));

router.post(
  '/',
  requirePM,
  validate(createSprintSchema),
  asyncHandler(ctrl.create),
);

router.get('/:id', asyncHandler(ctrl.getOne));

router.patch(
  '/:id',
  requirePM,
  validate(updateSprintSchema),
  asyncHandler(ctrl.update),
);

router.delete(
  '/:id',
  requireOrgAdmin,
  asyncHandler(ctrl.remove),
);

module.exports = router;
