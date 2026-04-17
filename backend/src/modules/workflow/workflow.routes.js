const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('./workflow.controller');
const asyncHandler = require('../../utils/asyncHandler');
const { denyClientTemp, requirePM } = require('../../middleware/rbac.middleware');

router.get('/', asyncHandler(ctrl.getWorkflow));
router.post('/advance', denyClientTemp, requirePM, asyncHandler(ctrl.advance));

module.exports = router;
