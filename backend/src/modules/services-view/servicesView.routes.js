const express = require('express');
const router = express.Router();
const ctrl = require('./servicesView.controller');
const asyncHandler = require('../../utils/asyncHandler');
const { denyClientTemp } = require('../../middleware/rbac.middleware');

router.use(denyClientTemp);

router.get('/', asyncHandler(ctrl.getSummary));
router.get('/:category', asyncHandler(ctrl.getByCategory));

module.exports = router;
