const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('./stageGate.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validation.middleware');
const { requireClientApprover } = require('../../middleware/rbac.middleware');
const Joi = require('joi');

const rejectApprovalBodySchema = Joi.object({
  reason: Joi.string().trim().min(1).max(4000).required(),
});

router.get('/', asyncHandler(ctrl.listApprovals));

router.get('/pending', asyncHandler(ctrl.getPendingApprovals));

router.get('/:approvalId', asyncHandler(ctrl.getApproval));

router.post(
  '/:approvalId/approve',
  requireClientApprover,
  asyncHandler(ctrl.approveDocument),
);

router.post(
  '/:approvalId/reject',
  requireClientApprover,
  validate(rejectApprovalBodySchema),
  asyncHandler(ctrl.rejectDocument),
);

router.post(
  '/:approvalId/notify-client',
  requireClientApprover,
  asyncHandler(ctrl.resendClientApprovalNotification),
);

module.exports = router;
