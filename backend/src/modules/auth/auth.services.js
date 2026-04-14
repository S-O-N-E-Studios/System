/**

 *
 * Covers:
 *  - login / logout / refresh
 *  - org registration (3-step wizard)
 *  - accept team invitation
 *  - client temporary access activation
 *  - forgot / reset password
 *  - change password
 *  - slug availability check
 */

const bcrypt = require("bcryptjs");
const authRepo = require("./auth.repository");
const { ROLES } = require("../../constants/roles");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateSecureToken,
  hashToken,
  passwordResetTokenExpiry,
} = require("../../utils/generateToken");
const {
  sendPasswordResetEmail,
} = require("../../utils/email");

// Tenant and TemporaryAccess models imported here for org registration and client activation
const Tenant = require("../tenants/tenant.model");
const TemporaryAccess = require("../client-access/temporaryAccess.model");

const SALT_ROUNDS = 10;

//  Login

const login = async (email, password) => {
  const user = await authRepo.findUserByEmailWithPassword(email);

  if (!user || !user.isActive) {
    // Use the same error message for both cases — don't leak user existence
    throw Object.assign(new Error("Invalid email or password"), {
      status: 401,
    });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw Object.assign(new Error("Invalid email or password"), {
      status: 401,
    });
  }

  // CLIENT_TEMP users logging in need their TemporaryAccess record validated
  let temporaryAccessId = null;
  if (user.role === ROLES.CLIENT_TEMP) {
    const access = await TemporaryAccess.findOne({
      _id: user.temporaryAccessId,
      status: "active",
    });
    if (!access || new Date() > access.expiresAt) {
      throw Object.assign(new Error("Your temporary access has expired"), {
        status: 401,
      });
    }
    temporaryAccessId = access._id;
  }

  const accessToken = generateAccessToken(user, temporaryAccessId);
  const refreshToken = generateRefreshToken(user, temporaryAccessId);

  // Hash and store the refresh token for rotation
  await user.setRefreshToken(refreshToken);
  await authRepo.updateUserLastLogin(user._id);
  await user.save();

  return { user: user.toSafeObject(), accessToken, refreshToken };
};

//  Logout

const logout = async (userId) => {
  const user = await authRepo.findUserByIdWithRefreshToken(userId);
  if (user) {
    user.clearRefreshToken();
    await user.save();
  }
};

//  Refresh

const refreshTokens = async (rawRefreshToken) => {
  if (!rawRefreshToken) {
    throw Object.assign(new Error("No refresh token provided"), {
      status: 401,
    });
  }

  let payload;
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw Object.assign(new Error("Invalid or expired refresh token"), {
      status: 401,
    });
  }

  const user = await authRepo.findUserByIdWithRefreshToken(payload.sub);
  if (!user || !user.isActive) {
    throw Object.assign(new Error("User not found"), { status: 401 });
  }

  const tokenValid = await user.compareRefreshToken(rawRefreshToken);
  if (!tokenValid) {
    // Token reuse detected — clear stored token as a security measure
    user.clearRefreshToken();
    await user.save();
    throw Object.assign(new Error("Refresh token reuse detected"), {
      status: 401,
    });
  }

  // CLIENT_TEMP: re-validate TemporaryAccess record
  let temporaryAccessId = null;
  if (user.role === ROLES.CLIENT_TEMP) {
    const access = await TemporaryAccess.findOne({
      _id: user.temporaryAccessId,
      status: "active",
    });
    if (!access || new Date() > access.expiresAt) {
      user.clearRefreshToken();
      await user.save();
      throw Object.assign(new Error("Temporary access has expired"), {
        status: 401,
      });
    }
    temporaryAccessId = access._id;
  }

  const newAccessToken = generateAccessToken(user, temporaryAccessId);
  const newRefreshToken = generateRefreshToken(user, temporaryAccessId);

  await user.setRefreshToken(newRefreshToken);
  await user.save();

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: user.toSafeObject(),
  };
};

//  Register Organisation

const registerOrg = async (data) => {
  const {
    fullName,
    email,
    password,
    orgName,
    orgType,
    orgSlug,
    emailDomain,
    localMunicipalities,
  } = data;

  // Check slug availability
  const existingTenant = await Tenant.findOne({ slug: orgSlug });
  if (existingTenant) {
    throw Object.assign(new Error("Organisation slug is already taken"), {
      status: 409,
    });
  }

  // Check user email
  const existingUser = await authRepo.findUserByEmail(email);
  if (existingUser) {
    throw Object.assign(
      new Error("An account with this email already exists"),
      { status: 409 },
    );
  }

  // Create tenant
  const tenant = await Tenant.create({
    slug: orgSlug,
    name: orgName,
    orgType,
    emailDomain: emailDomain || null,
    localMunicipalities: localMunicipalities || [],
    status: "trial",
  });

  // Create Org Admin user
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await authRepo.createUser({
    email,
    passwordHash,
    fullName,
    role: ROLES.ORG_ADMIN,
    tenants: [
      {
        tenantId: tenant._id,
        tenantSlug: tenant.slug,
        role: ROLES.ORG_ADMIN,
        joinedAt: new Date(),
      },
    ],
    isActive: true,
    lastLoginAt: new Date(),
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const userWithToken = await authRepo.findUserByIdWithRefreshToken(user._id);
  await userWithToken.setRefreshToken(refreshToken);
  await userWithToken.save();

  return {
    user: user.toSafeObject ? user.toSafeObject() : user,
    tenant,
    accessToken,
    refreshToken,
  };
};

//  Accept Invitation

const acceptInvite = async (rawToken, { fullName, password }) => {
  const invite = await authRepo.findInviteTokenByRaw(rawToken);

  if (!invite) {
    throw Object.assign(new Error("Invalid or expired invitation link"), {
      status: 400,
    });
  }

  // Check if email already has an account
  const existing = await authRepo.findUserByEmail(invite.email);
  if (existing) {
    // if User already exists — just add them to this tenant
    const membership = existing.tenants.find(
      (t) => t.tenantId.toString() === invite.tenantId.toString(),
    );
    if (!membership) {
      existing.tenants.push({
        tenantId: invite.tenantId,
        tenantSlug: invite.tenantSlug,
        role: invite.role,
        deptId: invite.deptId,
        joinedAt: new Date(),
      });
      await existing.save();
    }

    await authRepo.markInviteTokenUsed(invite._id);

    const accessToken = generateAccessToken(existing);
    const refreshToken = generateRefreshToken(existing);
    await existing.setRefreshToken(refreshToken);
    await existing.save();

    return { user: existing.toSafeObject(), accessToken, refreshToken };
  }

  // if  New user — create account
  const tenant = await Tenant.findById(invite.tenantId);
  if (!tenant) {
    throw Object.assign(new Error("Organisation not found"), { status: 404 });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await authRepo.createUser({
    email: invite.email,
    passwordHash,
    fullName,
    role: invite.role,
    tenants: [
      {
        tenantId: invite.tenantId,
        tenantSlug: tenant.slug,
        role: invite.role,
        deptId: invite.deptId || null,
        joinedAt: new Date(),
      },
    ],
    isActive: true,
    lastLoginAt: new Date(),
  });

  await authRepo.markInviteTokenUsed(invite._id);

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const savedUser = await authRepo.findUserByIdWithRefreshToken(user._id);
  await savedUser.setRefreshToken(refreshToken);
  await savedUser.save();

  return {
    user: user.toSafeObject ? user.toSafeObject() : user,
    accessToken,
    refreshToken,
  };
};

//  Client Activation

const activateClientAccess = async (rawToken, password) => {
  const tokenHash = hashToken(rawToken);

  // Find the TemporaryAccess record by activation token hash
  const access = await TemporaryAccess.findOne({
    activationTokenHash: tokenHash,
    status: "pending",
    expiresAt: { $gt: new Date() },
  });

  if (!access) {
    throw Object.assign(new Error("Invalid or expired activation link"), {
      status: 400,
    });
  }

  // Check if user already activated
  let user = await authRepo.findUserByEmail(access.clientEmail);

  if (!user) {
    // First activation — create the CLIENT_TEMP user
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    user = await authRepo.createUser({
      email: access.clientEmail,
      passwordHash,
      fullName: access.clientEmail,
      role: ROLES.CLIENT_TEMP,
      temporaryAccessId: access._id,
      isActive: true,
      lastLoginAt: new Date(),
    });
  } else {
    // Re-activation after password reset or re-grant
    await user.setPassword(password);
    user.temporaryAccessId = access._id;
    user.isActive = true;
    await user.save();
  }

  access.status = "active";
  access.clientUserId = user._id;
  access.activatedAt = new Date();
  await access.save();

  const accessToken = generateAccessToken(user, access._id);
  const refreshToken = generateRefreshToken(user, access._id);

  const savedUser = await authRepo.findUserByIdWithRefreshToken(user._id);
  await savedUser.setRefreshToken(refreshToken);
  await savedUser.save();

  return {
    user: user.toSafeObject ? user.toSafeObject() : user,
    accessToken,
    refreshToken,
  };
};

//  Forgot Password

const forgotPassword = async (email) => {
  const user = await authRepo.findUserByEmail(email);

  // Silently succeed even if user not found might be bad
  if (!user || !user.isActive) return;

  const rawToken = generateSecureToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = passwordResetTokenExpiry();

  await authRepo.updateUser(user._id, {
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: expiresAt,
  });

  /** Prefer the first organisation (membership order) that sends mail via its own relay. */
  let mailTenant = null;
  const memberships = user.tenants || [];
  if (memberships.length > 0) {
    const ids = memberships.map((m) => m.tenantId);
    const tenants = await Tenant.find({ _id: { $in: ids } });
    const byId = new Map(tenants.map((t) => [t._id.toString(), t]));
    for (const m of memberships) {
      const t = byId.get(m.tenantId.toString());
      const oe = t?.outboundEmail;
      if (t && oe?.enabled && oe.host && oe.fromAddress) {
        mailTenant = t;
        break;
      }
    }
  }

  await sendPasswordResetEmail(email, rawToken, { tenant: mailTenant });
};

//  Reset Password

const resetPassword = async (rawToken, newPassword) => {
  const user = await authRepo.findUserByPasswordResetToken(rawToken);

  if (!user) {
    throw Object.assign(new Error("Invalid or expired reset link"), {
      status: 400,
    });
  }

  await user.setPassword(newPassword);
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  user.clearRefreshToken(); // Force re-login after reset
  await user.save();
};

// Change Password

const changePassword = async (userId, currentPassword, newPassword) => {
  const UserModel = getUserModel();
  const user = await UserModel.findById(userId).select(
    "+passwordHash +refreshTokenHash",
  );

  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw Object.assign(new Error("Current password is incorrect"), {
      status: 400,
    });
  }

  await user.setPassword(newPassword);
  user.clearRefreshToken(); // Force re-login after password change
  await user.save();
};

//  check Slug availability

const checkSlugAvailability = async (slug) => {
  const existing = await Tenant.findOne({ slug: slug.toLowerCase() });
  return { available: !existing };
};

/** Current user for GET /auth/me (no tenant context). */
const getSessionUser = async (userId) => {
  const UserModel = getUserModel();
  const user = await UserModel.findById(userId);
  if (!user || !user.isActive) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }
  return user.toSafeObject();
};

// Lazy import to avoid circular deps
let User;
const getUserModel = () => {
  if (!User) User = require("../users/user.model");
  return User;
};

module.exports = {
  login,
  logout,
  refreshTokens,
  getSessionUser,
  registerOrg,
  acceptInvite,
  activateClientAccess,
  forgotPassword,
  resetPassword,
  changePassword,
  checkSlugAvailability,
};
