const express = require('express');
const router = express.Router({ mergeParams: true });
const asyncHandler = require('../../utils/asyncHandler');
const { requireApprover } = require('../../middleware/rbac.middleware');
const ctrl = require('./approvals.controller');

router.get('/pending-summary', requireApprover, asyncHandler(ctrl.getPendingSummary));

module.exports = router;
