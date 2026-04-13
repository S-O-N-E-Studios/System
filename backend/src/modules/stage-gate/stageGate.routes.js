const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('./stageGate.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validation.middleware');
const { requireRole } = require('../../middleware/rbac.middleware');
const { APPROVER_ROLES } = require('../../constants/roles');
const Joi = require('joi');

const rejectApprovalBodySchema = Joi.object({
  reason: Joi.string().trim().min(1).max(4000).required(),
});

router.get('/', asyncHandler(ctrl.listApprovals));

router.get('/pending', asyncHandler(ctrl.getPendingApprovals));

router.get('/:approvalId', asyncHandler(ctrl.getApproval));

router.post(
  '/:approvalId/approve',
  requireRole(APPROVER_ROLES),
  asyncHandler(ctrl.approveDocument),
);

router.post(
  '/:approvalId/reject',
  requireRole(APPROVER_ROLES),
  validate(rejectApprovalBodySchema),
  asyncHandler(ctrl.rejectDocument),
);

module.exports = router;
