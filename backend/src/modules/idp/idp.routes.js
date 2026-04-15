const express = require('express');
const router = express.Router();
const ctrl = require('./idp.controller');
const asyncHandler = require('../../utils/asyncHandler');
const { denyClientTemp } = require('../../middleware/rbac.middleware');

router.use(denyClientTemp);

router.get('/', asyncHandler(ctrl.getIdp));
router.get('/export', asyncHandler(ctrl.exportIdp));

module.exports = router;
