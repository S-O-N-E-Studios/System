const User = require("../users/user.model");
const InviteToken = require("./inviteToken.model");
const { hashToken } = require("../../utils/generateToken");

//  User queries

const findUserByEmail = (email) => User.findOne({ email: email.toLowerCase() });

const findUserByEmailWithPassword = (email) =>
  User.findByEmailWithPassword(email);

const findUserById = (id) => User.findById(id);

const findUserByIdWithRefreshToken = (id) =>
  User.findById(id).select("+refreshTokenHash");

const findUserByPasswordResetToken = (rawToken) => {
  const hash = hashToken(rawToken);
  return User.findOne({
    passwordResetTokenHash: hash,
    passwordResetExpiresAt: { $gt: new Date() },
    isActive: true,
  }).select("+passwordResetTokenHash +passwordResetExpiresAt +passwordHash");
};

const findUserByEntraOid = (entraOid) =>
  User.findOne({ entraOid, isActive: true });

const createUser = (userData) => User.create(userData);

const updateUser = (id, updates) =>
  User.findByIdAndUpdate(id, updates, { new: true });

const updateUserLastLogin = (id) =>
  User.findByIdAndUpdate(id, { lastLoginAt: new Date() });

//  Invite token queries
const findInviteTokenByRaw = (rawToken) => {
  const hash = hashToken(rawToken);
  return InviteToken.findOne({
    tokenHash: hash,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  }).select("+tokenHash");
};

const createInviteToken = (data) => InviteToken.create(data);

const markInviteTokenUsed = (id) =>
  InviteToken.findByIdAndUpdate(id, {
    isUsed: true,
    usedAt: new Date(),
  });

const deleteExpiredInviteTokens = () =>
  InviteToken.deleteMany({ expiresAt: { $lt: new Date() } });

module.exports = {
  findUserByEmail,
  findUserByEmailWithPassword,
  findUserById,
  findUserByIdWithRefreshToken,
  findUserByPasswordResetToken,
  findUserByEntraOid,
  createUser,
  updateUser,
  updateUserLastLogin,
  findInviteTokenByRaw,
  createInviteToken,
  markInviteTokenUsed,
  deleteExpiredInviteTokens,
};
