const express = require('express');
const router = express.Router();
const ctrl = require('./organization.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validation.middleware');
const { requireOrgAdmin, denyClientTemp } = require('../../middleware/rbac.middleware');
const { updateOrganizationSchema } = require('./organization.validation');

router.use(denyClientTemp);

router.get('/', asyncHandler(ctrl.get));

router.patch('/',
  requireOrgAdmin,
  validate(updateOrganizationSchema),
  asyncHandler(ctrl.update)
);

module.exports = router;
