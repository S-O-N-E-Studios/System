const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Authentication + onboarding routes used by the SPA.
// These are intentionally lightweight so the UI flows work end‑to‑end.

router.post('/login', authController.login);
router.post('/register-org', authController.registerOrg);
router.get('/check-slug/:slug', authController.checkSlug);
router.post('/accept-invite', authController.acceptInvite);
router.post('/change-password', authController.changePassword);
router.post('/refresh', authController.refreshToken);
router.get('/me', authController.getMe);

module.exports = router;

