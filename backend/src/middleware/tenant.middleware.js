
//  * Resolves the :tenantSlug URL parameter to a full Tenant document
//  * and attaches it to req.tenant. Also verifies the authenticated user
//  * belongs to this tenant and has an appropriate role.
//  *
//  * Every tenant-scoped route runs this middleware. It eliminates the need
//  * for individual controllers to do their own tenant lookups, and ensures
//  * the tenantId filter is always applied to DB queries.
//  *
//  * req.tenant shape after resolution:
//  *   { _id, slug, name, orgType, status, ... }
//  *
//  * req.tenantMembership shape after resolution (for non-SUPER_ADMIN):
//  *   { tenantId, tenantSlug, role, deptId }
 
const Tenant = require('../modules/tenants/tenant.model');
const { ROLES } = require('../constants/roles');
const { sendUnauthorized, sendForbidden, sendNotFound } = require('../utils/apiResponse');


const resolveTenant = async (req, res, next) => {
  const { tenantSlug } = req.params;

  if (!tenantSlug) {
    return sendNotFound(res, 'Tenant');
  }

  if (!req.user) {
    return sendUnauthorized(res);
  }

  try {
    const tenant = await Tenant.findOne({ slug: tenantSlug });

    if (!tenant) {
      return sendNotFound(res, 'Organisation');
    }

    if (tenant.status === 'suspended') {
      return sendForbidden(res, 'This organisation account has been suspended.');
    }

    // SUPER_ADMIN can access any tenant (but cannot see project data per spec)
    if (req.user.role === ROLES.SUPER_ADMIN) {
      req.tenant = tenant;
      req.tenantMembership = null;
      return next();
    }

    // CLIENT_TEMP users have tenant context from their TemporaryAccess record.
    // The clientAccess middleware handles their project scope separately.
    if (req.user.role === ROLES.CLIENT_TEMP) {
      req.tenant = tenant;
      req.tenantMembership = null;
      return next();
    }

    // All other roles — verify membership
    const membership = req.user.tenants?.find
      ? req.user.tenants.find(
          (t) => t.tenantSlug === tenantSlug || t.tenantId?.toString() === tenant._id.toString()
        )
      : null;


    req.tenant = tenant;
    req.tenantMembership = membership || null;

    return next();
  } catch (err) {
    return next(err);
  }
};

/**
 * Verify the authenticated user is a member of req.tenant.
 * Run after resolveTenant when you need strict membership enforcement.
 *
 * Loads the user from the DB to get the full tenants[] array.
 * (The JWT payload is intentionally lean and does not include all tenant memberships.)
 */
const requireTenantMembership = async (req, res, next) => {
  if (!req.user || !req.tenant) {
    return sendUnauthorized(res);
  }

  // SUPER_ADMIN and CLIENT_TEMP bypass this check
  if (req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.CLIENT_TEMP) {
    return next();
  }

  try {
    const User = require('../modules/users/user.model');
    const user = await User.findById(req.user.sub);

    if (!user || !user.isActive) {
      return sendUnauthorized(res, 'Account not found or inactive.');
    }

    const membership = user.getTenantMembership(req.tenant._id);

    if (!membership) {
      return sendForbidden(res, 'You are not a member of this organisation.');
    }

    req.tenantMembership = membership;
    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  resolveTenant,
  requireTenantMembership,
};