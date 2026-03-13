const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getTenants,
  getTenantById,
  suspendTenant,
  reactivateTenant,
} = require('../controllers/tenantController');

router.use(protect);
router.use(authorize('SUPER_ADMIN'));

router.get('/', getTenants);
router.get('/:id', getTenantById);
router.post('/:id/suspend', suspendTenant);
router.post('/:id/reactivate', reactivateTenant);

module.exports = router;
