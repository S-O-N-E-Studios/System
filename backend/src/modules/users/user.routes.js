/**
 * Project 360 — User Routes
 * Mounted at /:tenantSlug/users
 *
 * GET    /me               — own profile (all roles)
 * PATCH  /me               — update own profile (all roles)
 * GET    /                 — list members (Org Admin)
 * POST   /invite           — invite new member (Org Admin only)
 * GET    /:id              — get member detail (Org Admin)
 * PATCH  /:id/role         — update member role (Org Admin)
 * DELETE /:id              — remove from org / deactivate if no tenants left (Org Admin)
 */

const express      = require('express');
const router       = express.Router();
const ctrl         = require('./user.controller');
const asyncHandler = require('../../utils/asyncHandler');
const validate     = require('../../middleware/validation.middleware');
const { requireOrgAdmin, denyClientTemp } = require('../../middleware/rbac.middleware');
const { updateProfileSchema, inviteUserSchema, updateUserRoleSchema } = require('./user.validation');

// All user routes block CLIENT_TEMP
router.use(denyClientTemp);

router.get('/me',   asyncHandler(ctrl.getMe));
router.patch('/me', validate(updateProfileSchema), asyncHandler(ctrl.updateMe));

router.get('/',           requireOrgAdmin, asyncHandler(ctrl.listMembers));
router.post('/invite',    requireOrgAdmin, validate(inviteUserSchema), asyncHandler(ctrl.inviteUser));
router.get('/:id', requireOrgAdmin, asyncHandler(ctrl.getMember));
router.patch(
  '/:id/role',
  requireOrgAdmin,
  validate(updateUserRoleSchema),
  asyncHandler(ctrl.updateMemberRole),
);
router.delete('/:id', requireOrgAdmin, asyncHandler(ctrl.removeMember));

module.exports = router;