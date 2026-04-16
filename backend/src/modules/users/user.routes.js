/**
 * Project 360 — User Routes
 * Mounted at /:tenantSlug/users
 */

const express      = require('express');
const router       = express.Router();
const ctrl         = require('./user.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validate     = require('../../middleware/validation.middleware');
const { requireOrgAdmin, denyClientTemp } = require('../../middleware/rbac.middleware');
const { updateProfileSchema, inviteUserSchema, updateUserRoleSchema } = require('./user.validation');

router.use(denyClientTemp);

router.get('/me',   asyncHandler(ctrl.getMe));
router.patch('/me', validate(updateProfileSchema), asyncHandler(ctrl.updateMe));
router.post(
  '/me/avatar',
  ctrl.avatarUpload.single('file'),
  asyncHandler(ctrl.uploadMyAvatar),
);

router.get('/',           requireOrgAdmin, asyncHandler(ctrl.listMembers));
router.post('/invite',    requireOrgAdmin, validate(inviteUserSchema), asyncHandler(ctrl.inviteUser));
router.get('/:id', requireOrgAdmin, asyncHandler(ctrl.getMember));
router.patch(
  '/:id/role',
  requireOrgAdmin,
  validate(updateUserRoleSchema),
  asyncHandler(ctrl.updateMemberRole),
);
router.post('/:id/suspend', requireOrgAdmin, asyncHandler(ctrl.suspendMember));
router.post('/:id/reactivate', requireOrgAdmin, asyncHandler(ctrl.reactivateMember));
router.delete('/:id', requireOrgAdmin, asyncHandler(ctrl.removeMember));

module.exports = router;
