const taskService = require('./task.service');
const { sendSuccess, sendCreated } = require('../../utils/apiResponse');

const list = async (req, res) => {
  const result = await taskService.listTasks(
    req.tenant,
    req.query,
    req.user,
    req.clientAccess,
  );
  return sendSuccess(res, result);
};

const getOne = async (req, res) => {
  const task = await taskService.getTask(
    req.tenant,
    req.params.id,
    req.user,
    req.clientAccess,
  );
  return sendSuccess(res, { task });
};

const create = async (req, res) => {
  const task = await taskService.createTask(req.tenant, req.body, req.user.sub);
  return sendCreated(res, { task });
};

const update = async (req, res) => {
  const task = await taskService.updateTask(req.tenant, req.params.id, req.body);
  return sendSuccess(res, { task });
};

const remove = async (req, res) => {
  const result = await taskService.deleteTask(req.tenant, req.params.id);
  return sendSuccess(res, result);
};

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
};
