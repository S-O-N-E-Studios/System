const User = require('./user.model');

const safeSelect =
  '-passwordHash -refreshTokenHash -passwordResetTokenHash -passwordResetExpiresAt';

const findById = (id) => User.findById(id);

const findByEmail = (email) =>
  User.findOne({ email: email.toLowerCase(), isActive: true });

/** Any account with this email (for invites / duplicate checks). */
const findByEmailAny = (email) => User.findOne({ email: email.toLowerCase() });

/** Members of a tenant (optionally same-element match on role). */
const tenantMemberQuery = (tenantId, elemExtra = {}) => ({
  isActive: true,
  tenants: { $elemMatch: { tenantId, ...elemExtra } },
});

const findTenantMembers = (tenantId, elemExtra = {}, { page = 1, limit = 50 } = {}) => {
  const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
  const take = Math.min(100, Math.max(1, limit));

  return User.find(tenantMemberQuery(tenantId, elemExtra))
    .select(safeSelect)
    .sort({ fullName: 1 })
    .skip(skip)
    .limit(take);
};

const countTenantMembers = (tenantId, elemExtra = {}) =>
  User.countDocuments(tenantMemberQuery(tenantId, elemExtra));

const countMembersWithTenantRole = (tenantId, role) =>
  User.countDocuments(tenantMemberQuery(tenantId, { role }));

const updateById = (id, updates) =>
  User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

const deactivate = (id) =>
  User.findByIdAndUpdate(id, { isActive: false }, { new: true });

const save = (user) => user.save();

module.exports = {
  findById,
  findByEmail,
  findByEmailAny,
  findTenantMembers,
  countTenantMembers,
  countMembersWithTenantRole,
  updateById,
  deactivate,
  save,
};

