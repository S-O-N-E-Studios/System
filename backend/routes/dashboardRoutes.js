// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getSummary } = require('../controllers/dashboardController');

router.get('/', protect, getSummary);

module.exports = router;