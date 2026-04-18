const sprintService = require('./sprint.service');
const { sendSuccess, sendCreated } = require('../../utils/apiResponse');

const list = async (req, res) => {
  const result = await sprintService.listSprints(req.tenant);
  return sendSuccess(res, result);
};

const getOne = async (req, res) => {
  const sprint = await sprintService.getSprint(req.tenant, req.params.id);
  return sendSuccess(res, { sprint });
};

const create = async (req, res) => {
  const sprint = await sprintService.createSprint(req.tenant, req.body, req.user.sub);
  return sendCreated(res, { sprint });
};

const update = async (req, res) => {
  const sprint = await sprintService.updateSprint(req.tenant, req.params.id, req.body);
  return sendSuccess(res, { sprint });
};

const remove = async (req, res) => {
  const result = await sprintService.deleteSprint(req.tenant, req.params.id);
  return sendSuccess(res, result);
};

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
};
