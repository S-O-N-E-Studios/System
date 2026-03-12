// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { register, login } = require('../controllers/authController');

// Admin only route
router.post('/register', protect, authorize('admin'), register);
router.post('/login', login);

module.exports = router;