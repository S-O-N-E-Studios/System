const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('./performance.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validation.middleware');
const { denyClientTemp, requirePM } = require('../../middleware/rbac.middleware');
const { upsertPerformanceSchema } = require('./performance.validation');

router.get('/', asyncHandler(ctrl.list));
router.post('/snapshots', denyClientTemp, requirePM, validate(upsertPerformanceSchema), asyncHandler(ctrl.upsert));

module.exports = router;
