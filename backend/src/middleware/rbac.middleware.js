
//  * Role-based access control middleware factory.
//  * Used to protect routes to specific roles.
//  *
//  * Usage:
//  *   router.post('/projects', authenticate, requireRole([ROLES.PM, ROLES.ORG_ADMIN]), controller)
//  *   router.delete('/tenants/:id', authenticate, requireSuperAdmin, controller)


const { ROLES, ADMIN_ROLES, WRITER_ROLES } = require('../constants/roles');
const { sendForbidden, sendUnauthorized }  = require('../utils/apiResponse');


const requireRole = (allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return sendUnauthorized(res);
  }

  if (!allowedRoles.includes(req.user.role)) {
    return sendForbidden(res);
  }

  return next();
};

//  Pre-built role guards 

//  Only SUPER_ADMIN 
const requireSuperAdmin = requireRole([ROLES.SUPER_ADMIN]);

//  ORG_ADMIN or SUPER_ADMIN 
const requireOrgAdmin = requireRole(ADMIN_ROLES);

//  DEPT_ADMIN, ORG_ADMIN, SUPER_ADMIN 
const requireDeptAdmin = requireRole([ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.DEPT_ADMIN]);

//  PM, DEPT_ADMIN, ORG_ADMIN, SUPER_ADMIN 
const requirePM = requireRole(WRITER_ROLES);

//  Any authenticated user except CLIENT_TEMP 
const requirePermanentUser = requireRole([
  ROLES.SUPER_ADMIN,
  ROLES.ORG_ADMIN,
  ROLES.DEPT_ADMIN,
  ROLES.PM,
  ROLES.MEMBER,
  ROLES.VIEWER,
]);



const denyClientTemp = (req, res, next) => {
  if (req.user?.role === ROLES.CLIENT_TEMP) {
    return sendForbidden(res, 'Temporary access accounts cannot perform this action.');
  }
  return next();
};

 
const requireDeptScope = (req, res, next) => {
  if (!req.user) return sendUnauthorized(res);

  if (req.user.role !== ROLES.DEPT_ADMIN) {
    return next();
  }

  const requestedDeptId = req.params.deptId;
  const memberDeptId    = req.tenantMembership?.deptId;

  if (!requestedDeptId || !memberDeptId) {
    return sendForbidden(res, 'Department access could not be verified.');
  }

  if (requestedDeptId.toString() !== memberDeptId.toString()) {
    return sendForbidden(res, 'You can only access your own department.');
  }

  return next();
};

module.exports = {
  requireRole,
  requireSuperAdmin,
  requireOrgAdmin,
  requireDeptAdmin,
  requirePM,
  requirePermanentUser,
  denyClientTemp,
  requireDeptScope,
};