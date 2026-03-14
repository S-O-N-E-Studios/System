const express = require('express');
const router = express.Router();
const { protect, authorize, requireTenant } = require('../middleware/authMiddleware');
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getBudgetSummary,
  exportXlsx,
  exportPdf,
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  getProjectPayments,
  createProjectPayment,
  updateProjectPayment,
  getPaymentForecast,
  upsertPaymentForecast,
} = require('../controllers/projectController');

router.use(protect);
router.use(requireTenant);

router.get('/export/xlsx', exportXlsx);
router.get('/export/pdf', exportPdf);
router.get('/budget-summary', getBudgetSummary);

router.route('/')
  .get(getProjects)
  .post(authorize('SUPER_ADMIN', 'ORG_ADMIN', 'PROJECT_MANAGER'), createProject);

router.route('/:id')
  .get(getProjectById)
  .patch(authorize('SUPER_ADMIN', 'ORG_ADMIN', 'PROJECT_MANAGER'), updateProject)
  .delete(authorize('SUPER_ADMIN', 'ORG_ADMIN'), deleteProject);

router.route('/:id/activities')
  .get(getActivities)
  .post(authorize('SUPER_ADMIN', 'ORG_ADMIN', 'PROJECT_MANAGER'), createActivity);

router.route('/:id/activities/:actId')
  .patch(authorize('SUPER_ADMIN', 'ORG_ADMIN', 'PROJECT_MANAGER'), updateActivity)
  .delete(authorize('SUPER_ADMIN', 'ORG_ADMIN', 'PROJECT_MANAGER'), deleteActivity);

router.route('/:id/payments')
  .get(getProjectPayments)
  .post(authorize('SUPER_ADMIN', 'ORG_ADMIN', 'PROJECT_MANAGER'), createProjectPayment);

router.patch('/:id/payments/:payId',
  authorize('SUPER_ADMIN', 'ORG_ADMIN', 'PROJECT_MANAGER'), updateProjectPayment);

router.route('/:id/payment-forecast')
  .get(getPaymentForecast)
  .post(authorize('SUPER_ADMIN', 'ORG_ADMIN', 'PROJECT_MANAGER'), upsertPaymentForecast);

module.exports = router;
