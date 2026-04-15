const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth.middleware');
const { resolveTenant, requireTenantMembership } = require('../middleware/tenant.middleware');
const { validateClientAccess } = require('../middleware/clientAccess.middleware');
const { requireSuperAdmin } = require('../middleware/rbac.middleware');

const tenantStack = [authenticate, resolveTenant, requireTenantMembership, validateClientAccess];

router.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'ok' });
});

router.use('/auth', require('../modules/auth/auth.routes'));

router.use('/super-admin/tenants', authenticate, requireSuperAdmin, require('../modules/tenants/tenants.routes'));

router.use('/:tenantSlug/projects', ...tenantStack, require('../modules/projects/project.routes'));
router.use('/:tenantSlug/users', ...tenantStack, require('../modules/users/user.routes'));
router.use('/:tenantSlug/departments', ...tenantStack, require('../modules/departments/department.routes'));
router.use('/:tenantSlug/tasks', ...tenantStack, require('../modules/tasks/task.routes'));
router.use('/:tenantSlug/sprints', ...tenantStack, require('../modules/sprints/sprint.routes'));
router.use('/:tenantSlug/files', ...tenantStack, require('../modules/files/file.routes'));
router.use('/:tenantSlug/grants', ...tenantStack, require('../modules/grants/grant.routes'));
router.use('/:tenantSlug/calendar/events', ...tenantStack, require('../modules/calendar/calendar.routes'));
router.use('/:tenantSlug/client-access', ...tenantStack, require('../modules/client-access/clientAccess.routes'));
router.use('/:tenantSlug/planning', ...tenantStack, require('../modules/planning/planning.routes'));
router.use('/:tenantSlug/reports', ...tenantStack, require('../modules/reports/report.routes'));
router.use('/:tenantSlug/idp', ...tenantStack, require('../modules/idp/idp.routes'));
router.use('/:tenantSlug/services', ...tenantStack, require('../modules/services-view/servicesView.routes'));
router.use('/:tenantSlug/organizations', ...tenantStack, require('../modules/organizations/organization.routes'));
router.use('/:tenantSlug/projects/:projectId/milestones', ...tenantStack, require('../modules/milestones/milestone.routes'));

module.exports = router;
