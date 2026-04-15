const planningService = require('./planning.service');
const { sendSuccess, sendCreated } = require('../../utils/apiResponse');

const list = async (req, res) => {
  const result = await planningService.listPlanEntries(req.tenant._id, req.query);
  return sendSuccess(res, result);
};

const getOne = async (req, res) => {
  const plan = await planningService.getPlanEntry(req.tenant._id, req.params.id);
  return sendSuccess(res, { plan });
};

const create = async (req, res) => {
  const plan = await planningService.createPlanEntry(req.tenant._id, req.body, req.user.sub);
  return sendCreated(res, { plan });
};

const update = async (req, res) => {
  const plan = await planningService.updatePlanEntry(req.tenant._id, req.params.id, req.body);
  return sendSuccess(res, { plan });
};

const remove = async (req, res) => {
  const result = await planningService.deletePlanEntry(req.tenant._id, req.params.id);
  return sendSuccess(res, result);
};

const beginInception = async (req, res) => {
  const { plan, project } = await planningService.beginInception(
    req.tenant,
    req.params.id,
    req.user.sub,
  );
  return sendCreated(res, { plan, project }, 'Project created from plan entry');
};

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  beginInception,
};
