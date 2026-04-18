const express = require('express');
const router = express.Router();
const ctrl = require('./clientAccess.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validation.middleware');
const { requireOrgAdmin, denyClientTemp } = require('../../middleware/rbac.middleware');
const { grantAccessSchema, extendAccessSchema } = require('./clientAccess.validation');

router.use(denyClientTemp);

router.get('/', asyncHandler(ctrl.list));

router.post(
  '/',
  requireOrgAdmin,
  validate(grantAccessSchema),
  asyncHandler(ctrl.grant),
);

router.patch(
  '/:id/extend',
  requireOrgAdmin,
  validate(extendAccessSchema),
  asyncHandler(ctrl.extend),
);

router.patch('/:id/revoke', requireOrgAdmin, asyncHandler(ctrl.revoke));

module.exports = router;
