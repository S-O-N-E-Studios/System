const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getPaymentHistory, getPaymentForecast } = require('../controllers/paymentController');

router.use(protect);

router.get('/history', getPaymentHistory);
router.get('/forecast', getPaymentForecast);

module.exports = router;
