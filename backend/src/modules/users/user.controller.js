const userService = require('./user.service');
const { sendSuccess, sendCreated } = require('../../utils/apiResponse');

const getMe = async (req, res) => {
  const user = await userService.getCurrentUserProfile(
    req.tenant._id,
    req.user.sub,
    req.user.role,
  );
  return sendSuccess(res, { user });
};

const updateMe = async (req, res) => {
  const user = await userService.updateProfile(req.user.sub, req.body);
  return sendSuccess(res, { user });
};

const listMembers = async (req, res) => {
  const { role, page, limit } = req.query;
  const result = await userService.listMembers(req.tenant._id, {
    role,
    page:  parseInt(page,  10) || 1,
    limit: parseInt(limit, 10) || 50,
  });
  return sendSuccess(res, result);
};

const getMember = async (req, res) => {
  const user = await userService.getMember(req.tenant._id, req.params.id);
  return sendSuccess(res, { user });
};

const inviteUser = async (req, res) => {
  const result = await userService.inviteUser(req.tenant._id, req.user.sub, req.body);
  return sendCreated(res, result, 'Invitation sent successfully');
};

const updateMemberRole = async (req, res) => {
  const user = await userService.updateMemberRole(
    req.tenant._id,
    req.user.sub,
    req.params.id,
    req.body,
  );
  return sendSuccess(res, { user });
};

const removeMember = async (req, res) => {
  const result = await userService.removeMember(
    req.tenant._id,
    req.user.sub,
    req.params.id,
  );
  return sendSuccess(res, result);
};

module.exports = {
  getMe,
  updateMe,
  listMembers,
  getMember,
  inviteUser,
  updateMemberRole,
  removeMember,
};