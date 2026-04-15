const express = require('express');
const router = express.Router();
const ctrl = require('./planning.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validation.middleware');
const { requirePM, requireOrgAdmin, denyClientTemp } = require('../../middleware/rbac.middleware');
const {
  createPlanSchema,
  updatePlanSchema,
  planListQuerySchema,
} = require('./planning.validation');

router.use(denyClientTemp);

router.get('/', validate(planListQuerySchema, 'query'), asyncHandler(ctrl.list));

router.post(
  '/',
  requireOrgAdmin,
  validate(createPlanSchema),
  asyncHandler(ctrl.create),
);

router.get('/:id', asyncHandler(ctrl.getOne));

router.patch(
  '/:id',
  requireOrgAdmin,
  validate(updatePlanSchema),
  asyncHandler(ctrl.update),
);

router.delete('/:id', requireOrgAdmin, asyncHandler(ctrl.remove));

router.post('/:id/begin-inception', requirePM, asyncHandler(ctrl.beginInception));

module.exports = router;
