const express = require('express');
const router = express.Router();
const { protect, requireTenant } = require('../middleware/authMiddleware');
const { getDashboard } = require('../controllers/reportsController');

router.use(protect);
router.use(requireTenant);

router.get('/stats', getDashboard);

module.exports = router;
