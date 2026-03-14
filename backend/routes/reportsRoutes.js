const express = require('express');
const router = express.Router();
const { protect, authorize, requireTenant } = require('../middleware/authMiddleware');
const {
  getDashboard,
  getMtefSummary,
  getPaymentForecastReport,
  getProjectStatus,
  generateReport,
  getReportStatus,
  downloadReport,
} = require('../controllers/reportsController');
const { getSprintBurndown } = require('../controllers/sprintController');

router.use(protect);
router.use(requireTenant);

router.get('/dashboard', getDashboard);
router.get('/mtef-summary', getMtefSummary);
router.get('/payment-forecast', getPaymentForecastReport);
router.get('/project-status', getProjectStatus);
router.get('/sprint-burndown', getSprintBurndown);
router.post('/generate', authorize('SUPER_ADMIN', 'ORG_ADMIN', 'PROJECT_MANAGER'), generateReport);
router.get('/:reportId/status', getReportStatus);
router.get('/:reportId/download', downloadReport);

module.exports = router;
