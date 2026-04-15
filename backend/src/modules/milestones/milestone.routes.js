const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('./milestone.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validation.middleware');
const { denyClientTemp } = require('../../middleware/rbac.middleware');
const { createMilestoneSchema, updateMilestoneSchema } = require('./milestone.validation');

router.use(denyClientTemp);

router.get('/', asyncHandler(ctrl.list));

router.post('/',
  validate(createMilestoneSchema),
  asyncHandler(ctrl.create)
);

router.get('/:milestoneId', asyncHandler(ctrl.getOne));

router.patch('/:milestoneId',
  validate(updateMilestoneSchema),
  asyncHandler(ctrl.update)
);

router.delete('/:milestoneId', asyncHandler(ctrl.remove));

module.exports = router;
