const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('./penalty.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validation.middleware');
const {
  denyClientTemp,
  requireConsultantOperator,
  requireClientApprover,
} = require('../../middleware/rbac.middleware');
const { createPenaltySchema, updatePenaltySchema, rejectPenaltySchema } = require('./penalty.validation');

router.get('/', asyncHandler(ctrl.list));
router.post('/', denyClientTemp, requireConsultantOperator, validate(createPenaltySchema), asyncHandler(ctrl.create));
router.patch('/:penaltyId', denyClientTemp, requireConsultantOperator, validate(updatePenaltySchema), asyncHandler(ctrl.update));
router.post('/:penaltyId/submit', denyClientTemp, requireConsultantOperator, asyncHandler(ctrl.submit));
router.post('/:penaltyId/approve', denyClientTemp, requireClientApprover, asyncHandler(ctrl.approve));
router.post('/:penaltyId/reject', denyClientTemp, requireClientApprover, validate(rejectPenaltySchema), asyncHandler(ctrl.reject));
router.post('/:penaltyId/waive', denyClientTemp, requireClientApprover, asyncHandler(ctrl.waive));

module.exports = router;
