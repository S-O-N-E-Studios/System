const express = require('express');
const router = express.Router();
const { protect, authorize, requireTenant } = require('../middleware/authMiddleware');
const {
  getSprints,
  getActiveSprint,
  createSprint,
  updateSprint,
} = require('../controllers/sprintController');

router.use(protect);
router.use(requireTenant);

router.get('/active', getActiveSprint);

router.route('/')
  .get(getSprints)
  .post(authorize('SUPER_ADMIN', 'ORG_ADMIN', 'PROJECT_MANAGER'), createSprint);

router.patch('/:id', authorize('SUPER_ADMIN', 'ORG_ADMIN', 'PROJECT_MANAGER'), updateSprint);

module.exports = router;
