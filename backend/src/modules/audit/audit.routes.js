const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('./audit.controller');
const asyncHandler = require('../../utils/asyncHandler');
const { requireOrgAdmin } = require('../../middleware/rbac.middleware');

router.get('/', requireOrgAdmin, asyncHandler(ctrl.listProjectAudit));
router.get('/export', requireOrgAdmin, asyncHandler(ctrl.exportProjectAudit));

module.exports = router;
