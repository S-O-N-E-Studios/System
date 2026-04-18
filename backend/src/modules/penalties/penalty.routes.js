const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('./penalty.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validation.middleware');
const { denyClientTemp, requirePM, requireApprover } = require('../../middleware/rbac.middleware');
const { createPenaltySchema, updatePenaltySchema, rejectPenaltySchema } = require('./penalty.validation');

router.get('/', asyncHandler(ctrl.list));
router.post('/', denyClientTemp, requirePM, validate(createPenaltySchema), asyncHandler(ctrl.create));
router.patch('/:penaltyId', denyClientTemp, requirePM, validate(updatePenaltySchema), asyncHandler(ctrl.update));
router.post('/:penaltyId/submit', denyClientTemp, requirePM, asyncHandler(ctrl.submit));
router.post('/:penaltyId/approve', denyClientTemp, requireApprover, asyncHandler(ctrl.approve));
router.post('/:penaltyId/reject', denyClientTemp, requireApprover, validate(rejectPenaltySchema), asyncHandler(ctrl.reject));
router.post('/:penaltyId/waive', denyClientTemp, requireApprover, asyncHandler(ctrl.waive));

module.exports = router;
