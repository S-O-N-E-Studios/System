'use strict';

const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');

// ── Existing routes ──────────────────────────────────────────────────────────
router.post('/login',           auth.login);
router.post('/register-org',    auth.registerOrg);
router.get ('/check-slug/:slug', auth.checkSlug);
router.post('/accept-invite',   auth.acceptInvite);       // legacy (no token param)
router.post('/change-password', auth.changePassword);
router.post('/refresh',         auth.refreshToken);
router.get ('/me',              auth.getMe);

// ── Password reset ───────────────────────────────────────────────────────────
// 1. User requests a reset link → email is sent
router.post('/forgot-password',         auth.forgotPassword);
// 2. User clicks the link → validates token + sets new password
router.post('/reset-password/:token',   auth.resetPassword);

// ── Email verification ───────────────────────────────────────────────────────
// Triggered after registration (or manual resend)
router.post('/send-verification',       auth.sendVerification);
// User clicks verify link or submits OTP
router.post('/verify-email/:token',     auth.verifyEmail);

// ── Team member invite ───────────────────────────────────────────────────────
// Org Admin sends invite → email fired
router.post('/invite-user',             auth.inviteUser);
// Invited user sets password + activates account
router.post('/accept-invite/:token',    auth.acceptInviteByToken);

// ── Client temporary access ──────────────────────────────────────────────────
// Org Admin grants access → activation email fired
router.post('/client-invite',           auth.clientInvite);
// Client clicks activation link → account created
router.post('/client-activate/:token',  auth.clientActivate);

module.exports = router;
