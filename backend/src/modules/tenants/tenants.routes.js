const express = require('express');
const router = express.Router();
const ctrl = require('./tenant.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validation.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireSuperAdmin } = require('../../middleware/rbac.middleware');
const { updateTenantSchema } = require('./tenants.validation');

router.use(authenticate);
router.use(requireSuperAdmin);

router.get('/', asyncHandler(ctrl.list));
router.get('/:id', asyncHandler(ctrl.getOne));
router.patch('/:id', validate(updateTenantSchema), asyncHandler(ctrl.update));
router.patch('/:id/suspend', asyncHandler(ctrl.suspend));

module.exports = router;
