const express = require('express');
const router = express.Router();
const ctrl = require('./notification.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validation.middleware');
const { denyClientTemp, requirePermanentUser } = require('../../middleware/rbac.middleware');
const { notificationPreferencesSchema, markReadSchema } = require('./notification.validation');

router.use(denyClientTemp);
router.use(requirePermanentUser);

router.get('/', asyncHandler(ctrl.list));
router.patch('/preferences', validate(notificationPreferencesSchema), asyncHandler(ctrl.updatePreferences));
router.post('/read', validate(markReadSchema), asyncHandler(ctrl.markRead));
router.post('/read-all', asyncHandler(ctrl.markAllRead));

module.exports = router;
