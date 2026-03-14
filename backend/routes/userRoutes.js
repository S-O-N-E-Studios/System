const express = require('express');
const router = express.Router();
const { protect, authorize, requireTenant } = require('../middleware/authMiddleware');
const {
  getUsers,
  inviteUser,
  updateUserRole,
  suspendUser,
  reactivateUser,
  getMe,
  updateMe,
} = require('../controllers/userController');

router.use(protect);

router.get('/me', getMe);
router.patch('/me', updateMe);

router.use(requireTenant);

router.get('/', getUsers);
router.post('/invite', authorize('SUPER_ADMIN', 'ORG_ADMIN'), inviteUser);
router.patch('/:userId/role', authorize('SUPER_ADMIN', 'ORG_ADMIN'), updateUserRole);
router.post('/:userId/suspend', authorize('SUPER_ADMIN', 'ORG_ADMIN'), suspendUser);
router.post('/:userId/reactivate', authorize('SUPER_ADMIN', 'ORG_ADMIN'), reactivateUser);

module.exports = router;
