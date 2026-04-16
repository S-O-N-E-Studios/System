const notificationService = require('./notification.service');
const { sendSuccess } = require('../../utils/apiResponse');

const list = async (req, res) => {
  const data = await notificationService.listNotifications(req.tenant, req.user.sub);
  return sendSuccess(res, data);
};

const updatePreferences = async (req, res) => {
  const preferences = await notificationService.updatePreferences(req.tenant, req.user.sub, req.body);
  return sendSuccess(res, { preferences });
};

const markRead = async (req, res) => {
  const notification = await notificationService.markRead(req.tenant, req.user.sub, req.body.id);
  return sendSuccess(res, { notification });
};

const markAllRead = async (req, res) => {
  const result = await notificationService.markAllRead(req.tenant, req.user.sub);
  return sendSuccess(res, result);
};

module.exports = {
  list,
  updatePreferences,
  markRead,
  markAllRead,
};
