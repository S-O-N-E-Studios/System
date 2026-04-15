const milestoneService = require('./milestone.services');
const { sendSuccess, sendCreated } = require('../../utils/apiResponse');

const list = async (req, res) => {
  const milestones = await milestoneService.listMilestones(req.tenant, req.params.projectId);
  return sendSuccess(res, { milestones });
};

const getOne = async (req, res) => {
  const ms = await milestoneService.getMilestone(req.tenant, req.params.projectId, req.params.milestoneId);
  return sendSuccess(res, { milestone: ms });
};

const create = async (req, res) => {
  const ms = await milestoneService.createMilestone(req.tenant, req.params.projectId, req.body);
  return sendCreated(res, { milestone: ms });
};

const update = async (req, res) => {
  const ms = await milestoneService.updateMilestone(req.tenant, req.params.projectId, req.params.milestoneId, req.body);
  return sendSuccess(res, { milestone: ms });
};

const remove = async (req, res) => {
  const result = await milestoneService.deleteMilestone(req.tenant, req.params.projectId, req.params.milestoneId);
  return sendSuccess(res, result);
};

module.exports = { list, getOne, create, update, remove };
