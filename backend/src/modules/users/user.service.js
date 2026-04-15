
//  * Handles user management within a tenant:
//  *  - list members, get profile, update profile
//  *  - invite new members (creates InviteToken, sends email)
//  *  - update role, remove member
//  *
//  * Security rules enforced here:
//  *  - Org Admin cannot demote themselves
//  *  - DEPT_ADMIN can only be assigned to their own department
//  *  - CLIENT_TEMP accounts cannot be created via this flow (use client-access module)
//  *  - Removing the last Org Admin is blocked


const userRepo    = require('./user.repository');
const InviteToken = require('../auth/inviteToken.model');
const Tenant      = require('../tenants/tenant.model');
const { ROLES }   = require('../../constants/roles');
const {
  generateSecureToken,
  hashToken,
  inviteTokenExpiry,
} = require('../../utils/generateToken');
const { sendInviteEmail } = require('../../utils/email');

//  List members ─

const listMembers = async (tenantId, { role, page = 1, limit = 50 } = {}) => {
  const elemExtra = role ? { role } : {};

  const [memberDocs, total] = await Promise.all([
    userRepo.findTenantMembers(tenantId, elemExtra, { page, limit }),
    userRepo.countTenantMembers(tenantId, elemExtra),
  ]);

  const members = memberDocs.map((m) => m.toSafeObject());
  return { members, total, page, limit };
};

//  Current user profile (GET /me) — SUPER_ADMIN may open a tenant without tenants[] entry

const getCurrentUserProfile = async (tenantId, userId, jwtRole) => {
  const user = await userRepo.findById(userId);

  if (!user || !user.isActive) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  if (jwtRole === ROLES.SUPER_ADMIN) {
    return user.toSafeObject();
  }

  const membership = user.getTenantMembership(tenantId);
  if (!membership) {
    throw Object.assign(new Error('User is not a member of this organisation'), { status: 404 });
  }

  return user.toSafeObject();
};

//  Get member 

const getMember = async (tenantId, userId) => {
  const user = await userRepo.findById(userId);

  if (!user || !user.isActive) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const membership = user.getTenantMembership(tenantId);
  if (!membership) {
    throw Object.assign(new Error('User is not a member of this organisation'), { status: 404 });
  }

  return user.toSafeObject();
};

//  Update own profile 

const updateProfile = async (userId, updates) => {
  const allowed = {};
  if (updates.fullName)  allowed.fullName  = updates.fullName;
  if (updates.avatarUrl !== undefined) allowed.avatarUrl = updates.avatarUrl;

  const user = await userRepo.updateById(userId, allowed);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  return user.toSafeObject();
};

//  Invite user ──

const inviteUser = async (tenantId, invitedBy, { email, role, deptId }) => {
  // CLIENT_TEMP cannot be invited — use client-access module
  if (role === ROLES.CLIENT_TEMP || role === ROLES.SUPER_ADMIN) {
    throw Object.assign(new Error(`Role ${role} cannot be assigned via invitation`), { status: 400 });
  }

  const tenant = await Tenant.findById(tenantId);
  if (!tenant) throw Object.assign(new Error('Organisation not found'), { status: 404 });

  // Check if already a member (any account with this email)
  const existing = await userRepo.findByEmailAny(email);
  if (existing) {
    const alreadyMember = existing.tenants.some(
      (t) => t.tenantId.toString() === tenantId.toString()
    );
    if (alreadyMember) {
      throw Object.assign(new Error('This user is already a member of the organisation'), { status: 409 });
    }
  }

  // Check for a pending invite to the same email in this tenant
  const pendingInvite = await InviteToken.findOne({
    tenantId,
    email: email.toLowerCase(),
    isUsed: false,
    expiresAt: { $gt: new Date() },
  });
  if (pendingInvite) {
    throw Object.assign(new Error('A pending invitation already exists for this email'), { status: 409 });
  }

  // Create invite token
  const rawToken  = generateSecureToken();
  const tokenHash = hashToken(rawToken);

  await InviteToken.create({
    tenantId,
    tenantSlug: tenant.slug,
    tokenHash,
    email:     email.toLowerCase(),
    role,
    deptId:    deptId || null,
    invitedBy,
    expiresAt: inviteTokenExpiry(),
    isUsed:    false,
  });

  // Send email
  const inviter = await userRepo.findById(invitedBy);
  await sendInviteEmail(
    email,
    rawToken,
    {
      orgName:       tenant.name,
      invitedByName: inviter?.fullName || 'A team member',
      role,
    },
    tenant
  );

  return { invited: true, email };
};

//  Update member role 

const updateMemberRole = async (tenantId, requesterId, targetUserId, { role, deptId }) => {
  if (role === ROLES.CLIENT_TEMP || role === ROLES.SUPER_ADMIN) {
    throw Object.assign(new Error(`Cannot assign role: ${role}`), { status: 400 });
  }

  // Prevent self-demotion for Org Admins
  if (requesterId.toString() === targetUserId.toString()) {
    throw Object.assign(new Error('You cannot change your own role'), { status: 400 });
  }

  const user = await userRepo.findById(targetUserId);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  const membershipIndex = user.tenants.findIndex(
    (t) => t.tenantId.toString() === tenantId.toString()
  );
  if (membershipIndex === -1) {
    throw Object.assign(new Error('User is not a member of this organisation'), { status: 404 });
  }

  // Block removing the last Org Admin
  if (user.tenants[membershipIndex].role === ROLES.ORG_ADMIN && role !== ROLES.ORG_ADMIN) {
    const orgAdminCount = await userRepo.countMembersWithTenantRole(tenantId, ROLES.ORG_ADMIN);
    if (orgAdminCount <= 1) {
      throw Object.assign(
        new Error('Cannot remove the last Org Admin. Promote another user first.'),
        { status: 400 }
      );
    }
  }

  user.tenants[membershipIndex].role   = role;
  user.tenants[membershipIndex].deptId = deptId || null;

  // Keep top-level role in sync if this is the user's only tenant
  if (user.tenants.length === 1) {
    user.role = role;
  }

  await user.save();
  return user.toSafeObject();
};

//  Remove member 

const removeMember = async (tenantId, requesterId, targetUserId) => {
  if (requesterId.toString() === targetUserId.toString()) {
    throw Object.assign(new Error('You cannot remove yourself from the organisation'), { status: 400 });
  }

  const user = await userRepo.findById(targetUserId);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  const membershipIndex = user.tenants.findIndex(
    (t) => t.tenantId.toString() === tenantId.toString()
  );
  if (membershipIndex === -1) {
    throw Object.assign(new Error('User is not a member of this organisation'), { status: 404 });
  }

  // Block removing the last Org Admin
  if (user.tenants[membershipIndex].role === ROLES.ORG_ADMIN) {
    const orgAdminCount = await userRepo.countMembersWithTenantRole(tenantId, ROLES.ORG_ADMIN);
    if (orgAdminCount <= 1) {
      throw Object.assign(
        new Error('Cannot remove the last Org Admin from this organisation'),
        { status: 400 }
      );
    }
  }

  user.tenants.splice(membershipIndex, 1);

  // If no more tenants, deactivate the account
  if (user.tenants.length === 0) {
    user.isActive = false;
  }

  await user.save();
  return { removed: true };
};

module.exports = {
  listMembers,
  getCurrentUserProfile,
  getMember,
  updateProfile,
  inviteUser,
  updateMemberRole,
  removeMember,
};