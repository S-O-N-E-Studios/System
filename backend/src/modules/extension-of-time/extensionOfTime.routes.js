const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('./extensionOfTime.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validation.middleware');
const {
  denyClientTemp,
  requireConsultantOperator,
  requireClientApprover,
} = require('../../middleware/rbac.middleware');
const {
  createEotSchema,
  updateEotSchema,
  rejectEotSchema,
  approveEotSchema,
} = require('./extensionOfTime.validation');

router.get('/', asyncHandler(ctrl.list));
router.post('/', denyClientTemp, requireConsultantOperator, validate(createEotSchema), asyncHandler(ctrl.create));
router.get('/:eotId', asyncHandler(ctrl.getOne));
router.patch('/:eotId', denyClientTemp, requireConsultantOperator, validate(updateEotSchema), asyncHandler(ctrl.update));
router.post('/:eotId/submit', denyClientTemp, requireConsultantOperator, asyncHandler(ctrl.submit));
router.post(
  '/:eotId/approve',
  denyClientTemp,
  requireClientApprover,
  validate(approveEotSchema),
  asyncHandler(ctrl.approve)
);
router.post('/:eotId/reject', denyClientTemp, requireClientApprover, validate(rejectEotSchema), asyncHandler(ctrl.reject));
router.post('/:eotId/withdraw', denyClientTemp, requireConsultantOperator, asyncHandler(ctrl.withdraw));

module.exports = router;
