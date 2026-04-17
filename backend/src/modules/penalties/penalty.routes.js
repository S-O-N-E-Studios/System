const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('./penalty.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validation.middleware');
const { denyClientTemp, requirePM, requireApprover } = require('../../middleware/rbac.middleware');
const { createPenaltySchema, updatePenaltySchema } = require('./penalty.validation');

router.get('/', asyncHandler(ctrl.list));
router.post('/', denyClientTemp, requirePM, validate(createPenaltySchema), asyncHandler(ctrl.create));
router.patch('/:penaltyId', denyClientTemp, requirePM, validate(updatePenaltySchema), asyncHandler(ctrl.update));
router.post('/:penaltyId/approve', denyClientTemp, requireApprover, asyncHandler(ctrl.approve));

module.exports = router;
