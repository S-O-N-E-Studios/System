const express = require('express');
const router = express.Router();
const authController = require('./organization.controller');

// Define routes for authentication and send them to the controller
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

module.exports = router;