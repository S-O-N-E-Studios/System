const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('./extensionOfTime.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validation.middleware');
const { denyClientTemp, requirePM, requireApprover } = require('../../middleware/rbac.middleware');
const { createEotSchema, updateEotSchema, rejectEotSchema } = require('./extensionOfTime.validation');

router.get('/', asyncHandler(ctrl.list));
router.post('/', denyClientTemp, requirePM, validate(createEotSchema), asyncHandler(ctrl.create));
router.get('/:eotId', asyncHandler(ctrl.getOne));
router.patch('/:eotId', denyClientTemp, requirePM, validate(updateEotSchema), asyncHandler(ctrl.update));
router.post('/:eotId/submit', denyClientTemp, requirePM, asyncHandler(ctrl.submit));
router.post('/:eotId/approve', denyClientTemp, requireApprover, asyncHandler(ctrl.approve));
router.post('/:eotId/reject', denyClientTemp, requireApprover, validate(rejectEotSchema), asyncHandler(ctrl.reject));
router.post('/:eotId/withdraw', denyClientTemp, requirePM, asyncHandler(ctrl.withdraw));

module.exports = router;
