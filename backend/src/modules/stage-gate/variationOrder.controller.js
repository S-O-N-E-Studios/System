const variationOrderService = require('./variationOrder.service');
const { sendSuccess, sendCreated } = require('../../utils/apiResponse');

const list = async (req, res) => {
  const variations = await variationOrderService.listForProject(
    req.tenant._id,
    req.params.id,
  );
  return sendSuccess(res, { variations });
};

const create = async (req, res) => {
  const variation = await variationOrderService.create(
    req.tenant._id,
    req.params.id,
    req.body,
    req.user.sub,
  );
  return sendCreated(res, { variation });
};

const getOne = async (req, res) => {
  const variation = await variationOrderService.getById(
    req.tenant._id,
    req.params.id,
    req.params.voId,
  );
  return sendSuccess(res, { variation });
};

const update = async (req, res) => {
  const variation = await variationOrderService.update(
    req.tenant._id,
    req.params.id,
    req.params.voId,
    req.body,
  );
  return sendSuccess(res, { variation });
};

const submit = async (req, res) => {
  const variation = await variationOrderService.submit(
    req.tenant._id,
    req.params.id,
    req.params.voId,
  );
  return sendSuccess(res, { variation });
};

const approve = async (req, res) => {
  const variation = await variationOrderService.approve(
    req.tenant._id,
    req.params.id,
    req.params.voId,
    req.user.sub,
    req.body.approvedAmount,
  );
  return sendSuccess(res, { variation });
};

const reject = async (req, res) => {
  const variation = await variationOrderService.reject(
    req.tenant._id,
    req.params.id,
    req.params.voId,
    req.body.reason,
  );
  return sendSuccess(res, { variation });
};

const withdraw = async (req, res) => {
  const variation = await variationOrderService.withdraw(
    req.tenant._id,
    req.params.id,
    req.params.voId,
  );
  return sendSuccess(res, { variation });
};

module.exports = {
  list,
  create,
  getOne,
  update,
  submit,
  approve,
  reject,
  withdraw,
};
