const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  login,
  registerOrg,
  checkSlug,
  acceptInvite,
  changePassword,
  refresh,
  getMe,
} = require('../controllers/authController');

router.post('/login', login);
router.post('/register-org', registerOrg);
router.get('/check-slug/:slug', checkSlug);
router.post('/accept-invite', acceptInvite);
router.post('/change-password', protect, changePassword);
router.post('/refresh', refresh);
router.get('/me', protect, getMe);

module.exports = router;
