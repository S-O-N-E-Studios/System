//  * Mounted at /:tenantSlug/tasks

const express = require('express');
const router = express.Router();
const ctrl = require('./task.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validation.middleware');
const { requirePM, denyClientTemp } = require('../../middleware/rbac.middleware');
const { validateClientAccess } = require('../../middleware/clientAccess.middleware');
const {
  createTaskSchema,
  updateTaskSchema,
  taskListQuerySchema,
} = require('./task.validation');

router.use(validateClientAccess);

router.get(
  '/',
  validate(taskListQuerySchema, 'query'),
  asyncHandler(ctrl.list),
);

router.post(
  '/',
  requirePM,
  validate(createTaskSchema),
  asyncHandler(ctrl.create),
);

router.get('/:id', asyncHandler(ctrl.getOne));

router.patch(
  '/:id',
  denyClientTemp,
  validate(updateTaskSchema),
  asyncHandler(ctrl.update),
);

router.delete(
  '/:id',
  requirePM,
  asyncHandler(ctrl.remove),
);

module.exports = router;
