const multer = require('multer');
const userService = require('./user.service');
const { sendSuccess, sendCreated } = require('../../utils/apiResponse');
const { saveTenantImage, publicUrlFromReq } = require('../../utils/savePublicImage');

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
    }
    cb(null, true);
  },
});

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

const uploadMyAvatar = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded (use field name "file")' });
  }
  const webPath = await saveTenantImage({
    tenantSlug: req.tenant.slug,
    subDir:     'avatars',
    baseName:   `${req.user.sub}-${Date.now()}`,
    mimeType:   req.file.mimetype,
    buffer:     req.file.buffer,
  });
  const avatarUrl = publicUrlFromReq(req, webPath);
  const user = await userService.updateProfile(req.user.sub, { avatarUrl });
  return sendSuccess(res, { user, avatarUrl });
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
  uploadMyAvatar,
  avatarUpload,
  listMembers,
  getMember,
  inviteUser,
  updateMemberRole,
  removeMember,
};
