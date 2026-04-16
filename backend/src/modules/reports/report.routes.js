const express = require('express');
const router = express.Router();
const ctrl = require('./report.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middleware/validation.middleware');
const { denyClientTemp } = require('../../middleware/rbac.middleware');
const { deptSummaryQuerySchema, generateReportSchema } = require('./report.validation');

router.use(denyClientTemp);

router.get('/dashboard', asyncHandler(ctrl.dashboardReport));

router.get(
  '/dept-summary',
  validate(deptSummaryQuerySchema, 'query'),
  asyncHandler(ctrl.deptSummary),
);

router.get('/payment-forecast', asyncHandler(ctrl.paymentForecast));
router.get('/payment-history', asyncHandler(ctrl.paymentHistory));

router.get('/project-status', asyncHandler(ctrl.projectStatus));

router.get('/sprint-burndown', asyncHandler(ctrl.sprintBurndown));

router.get('/grants-summary', asyncHandler(ctrl.grantsSummary));

router.post(
  '/generate',
  validate(generateReportSchema),
  asyncHandler(ctrl.generateReport),
);

module.exports = router;
