//  * Enforces CLIENT_TEMP security rules on every request:
//  *
//  *  1. validateClientAccess — checks the TemporaryAccess record is still active
//  *     and not expired. Returns 401 if expired or revoked.
//  *     Must run after authenticate middleware.
//  *
//  *  2. requireProjectScope — for project-scoped routes, verifies the CLIENT_TEMP
//  *     user has explicit access to the requested projectId.
//  *     Returns 403 if the project is not in their allowed list.
//  *
//  * MVP spec (section 11.1):
//  *  "CLIENT_TEMP tokens... On every request, middleware validates the
//  *   TemporaryAccess record is still active and not expired."
//  *  "ClientGuard validates projectIds scope on every project-scoped request
//  *   from CLIENT_TEMP users."

const TemporaryAccess = require("../modules/client-access/temporaryAccess.model");
const { ROLES } = require("../constants/roles");
const { sendUnauthorized, sendForbidden } = require("../utils/apiResponse");

//  Validate CLIENT_TEMP access on every request.
const validateClientAccess = async (req, res, next) => {
  // Only applies to CLIENT_TEMP users
  if (!req.user || req.user.role !== ROLES.CLIENT_TEMP) {
    return next();
  }

  if (!req.user.temporaryAccessId) {
    return sendUnauthorized(res, "Invalid client access token.");
  }

  try {
    const access = await TemporaryAccess.findOne({
      _id: req.user.temporaryAccessId,
      status: "active",
    });

    if (!access) {
      return sendUnauthorized(res, "Your temporary access has been revoked.");
    }

    if (new Date() > access.expiresAt) {
      // Mark as expired in DB (best-effort — don't block the 401 response)
      TemporaryAccess.findByIdAndUpdate(access._id, {
        status: "expired",
      }).catch(() => {});
      return sendUnauthorized(res, "Your temporary access has expired.");
    }

    // Attach for downstream use (e.g., requireProjectScope)
    req.clientAccess = access;
    return next();
  } catch (err) {
    return sendUnauthorized(res, "Could not validate client access.");
  }
};

//   Verify CLIENT_TEMP users can only access their explicitly listed projects.

const requireProjectScope = (req, res, next) => {
  if (!req.user || req.user.role !== ROLES.CLIENT_TEMP) {
    return next();
  }

  const projectId = req.params.id || req.params.projectId;

  if (!projectId) {
    // Route doesn't reference a specific project — block CLIENT_TEMP by default
    return sendForbidden(res, "You do not have access to this resource.");
  }

  if (!req.clientAccess) {
    return sendUnauthorized(res, "Client access not validated.");
  }

  const hasScope = req.clientAccess.projectIds.some(
    (pid) => pid.toString() === projectId.toString(),
  );

  if (!hasScope) {
    return sendForbidden(res, "You do not have access to this project.");
  }

  return next();
};

module.exports = {
  validateClientAccess,
  requireProjectScope,
};
