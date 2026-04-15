const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('./variationOrder.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validation.middleware');
const { requirePM, requireRole } = require('../../middleware/rbac.middleware');
const { APPROVER_ROLES } = require('../../constants/roles');
const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const createVOSchema = Joi.object({
  description: Joi.string().trim().min(1).required(),
  reason: Joi.string().trim().min(1).required(),
  estimatedAmount: Joi.number().required(),
  variationCertificateFileId: objectId.allow(null, ''),
});

const updateVOSchema = Joi.object({
  description: Joi.string().trim().min(1),
  reason: Joi.string().trim().min(1),
  estimatedAmount: Joi.number(),
  variationCertificateFileId: objectId.allow(null, ''),
}).min(1);

const approveVOSchema = Joi.object({
  approvedAmount: Joi.number(),
});

const rejectVOSchema = Joi.object({
  reason: Joi.string().trim().min(1).max(4000).required(),
});

router.get('/', asyncHandler(ctrl.list));

router.post(
  '/',
  requirePM,
  validate(createVOSchema),
  asyncHandler(ctrl.create),
);

router.get('/:voId', asyncHandler(ctrl.getOne));

router.patch(
  '/:voId',
  requirePM,
  validate(updateVOSchema),
  asyncHandler(ctrl.update),
);

router.post('/:voId/submit', requirePM, asyncHandler(ctrl.submit));

router.post(
  '/:voId/approve',
  requireRole(APPROVER_ROLES),
  (req, _res, next) => {
    if (req.body == null || typeof req.body !== 'object') req.body = {};
    next();
  },
  validate(approveVOSchema),
  asyncHandler(ctrl.approve),
);

router.post(
  '/:voId/reject',
  requireRole(APPROVER_ROLES),
  validate(rejectVOSchema),
  asyncHandler(ctrl.reject),
);

router.post('/:voId/withdraw', requirePM, asyncHandler(ctrl.withdraw));

module.exports = router;
