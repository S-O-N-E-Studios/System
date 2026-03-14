const express = require('express');
const router = express.Router();
const { protect, authorize, requireTenant } = require('../middleware/authMiddleware');
const {
  getPaymentHistory,
  createPayment,
  updatePayment,
  getPaymentForecast,
} = require('../controllers/paymentController');

router.use(protect);
router.use(requireTenant);

router.get('/history', getPaymentHistory);
router.get('/forecast', getPaymentForecast);

router.route('/')
  .post(authorize('SUPER_ADMIN', 'ORG_ADMIN', 'PROJECT_MANAGER'), createPayment);

router.patch('/:id', authorize('SUPER_ADMIN', 'ORG_ADMIN', 'PROJECT_MANAGER'), updatePayment);

module.exports = router;
