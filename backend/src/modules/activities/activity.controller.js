
const activityService = require('./activity.service');
const { sendSuccess, sendCreated } = require('../../utils/apiResponse');

const list = async (req, res) => {
  const activities = await activityService.listActivities(req.tenant, req.params.projectId);
  return sendSuccess(res, { activities });
};

const create = async (req, res) => {
  const activity = await activityService.createActivity(
    req.tenant, req.params.projectId, req.body, req.user.sub
  );
  return sendCreated(res, { activity });
};

const update = async (req, res) => {
  const activity = await activityService.updateActivity(
    req.tenant, req.params.projectId, req.params.actId, req.body, req.user.sub
  );
  return sendSuccess(res, { activity });
};

const remove = async (req, res) => {
  const result = await activityService.deleteActivity(
    req.tenant, req.params.projectId, req.params.actId
  );
  return sendSuccess(res, result);
};

const addImage = async (req, res) => {
  const { fileId, caption } = req.body;
  const activity = await activityService.addImage(
    req.tenant, req.params.projectId, req.params.actId, fileId, caption, req.user.sub
  );
  return sendCreated(res, { activity });
};

const removeImage = async (req, res) => {
  const activity = await activityService.removeImage(
    req.tenant, req.params.projectId, req.params.actId, req.params.imageId
  );
  return sendSuccess(res, { activity });
};

module.exports = { list, create, update, remove, addImage, removeImage };