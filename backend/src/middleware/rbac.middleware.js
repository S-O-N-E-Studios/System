
//  * Role-based access control middleware factory.
//  * Used to protect routes to specific roles.
//  *
//  * Usage:
//  *   router.post('/projects', authenticate, requireRole([ROLES.PM, ROLES.ORG_ADMIN]), controller)
//  *   router.delete('/tenants/:id', authenticate, requireSuperAdmin, controller)


const {
  ROLES,
  ADMIN_ROLES,
  WRITER_ROLES,
  APPROVER_ROLES,
  PROCUREMENT_STEP_REVIEW_ROLES,
} = require('../constants/roles');
const { sendForbidden, sendUnauthorized }  = require('../utils/apiResponse');


const getEffectiveRole = (req) => {
  if (req.user?.role === ROLES.SUPER_ADMIN || req.user?.role === ROLES.CLIENT_TEMP) {
    return req.user.role;
  }
  return req.tenantMembership?.role || req.user?.role;
};

const requireRole = (allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return sendUnauthorized(res);
  }

  if (!allowedRoles.includes(getEffectiveRole(req))) {
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
const requireApprover = requireRole([ROLES.SUPER_ADMIN, ...APPROVER_ROLES]);
const requireConsultantOperator = requireRole([
  ROLES.SUPER_ADMIN,
  ROLES.PM,
  ROLES.MEMBER,
]);
const requireClientApprover = requireRole([ROLES.SUPER_ADMIN, ...APPROVER_ROLES]);

/** Sub-consultant procurement step review/approval — client / org authority (not consultant PM). */
const requireProcurementStepReviewer = requireRole(PROCUREMENT_STEP_REVIEW_ROLES);

/** Consultants mark steps `not_applicable`; client roles approve / reject. */
const requireProcurementStepReviewOrMarkNa = (req, res, next) => {
  if (!req.user) {
    return sendUnauthorized(res);
  }
  const status = req.body?.status;
  const role = getEffectiveRole(req);
  const consultantMarkNaRoles = [
    ROLES.PM,
    ROLES.MEMBER,
    ROLES.SUPER_ADMIN,
  ];
  if (status === 'not_applicable' && consultantMarkNaRoles.includes(role)) {
    return next();
  }
  return requireProcurementStepReviewer(req, res, next);
};

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

  if (getEffectiveRole(req) !== ROLES.DEPT_ADMIN) {
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
  requireApprover,
  requireConsultantOperator,
  requireClientApprover,
  requireProcurementStepReviewer,
  requireProcurementStepReviewOrMarkNa,
  requirePermanentUser,
  denyClientTemp,
  requireDeptScope,
};