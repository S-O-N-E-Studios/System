//  * Mounted at /:tenantSlug/calendar/events
//  * GET list/detail — all authenticated roles including CLIENT_TEMP.
//  * POST / PATCH / DELETE — deny CLIENT_TEMP.

const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('./calendar.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validation.middleware');
const { denyClientTemp } = require('../../middleware/rbac.middleware');
const {
  createEventSchema,
  updateEventSchema,
  eventListQuerySchema,
} = require('./calendar.validation');

router.get(
  '/',
  validate(eventListQuerySchema, 'query'),
  asyncHandler(ctrl.list)
);

router.post(
  '/',
  denyClientTemp,
  validate(createEventSchema),
  asyncHandler(ctrl.create)
);

router.get('/:id', asyncHandler(ctrl.getOne));

router.patch(
  '/:id',
  denyClientTemp,
  validate(updateEventSchema),
  asyncHandler(ctrl.update)
);

router.delete('/:id', denyClientTemp, asyncHandler(ctrl.remove));

module.exports = router;
