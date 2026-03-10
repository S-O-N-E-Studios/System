// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getUsers } = require('../controllers/userController');

router.get('/', protect, authorize('admin'), getUsers);

module.exports = router;