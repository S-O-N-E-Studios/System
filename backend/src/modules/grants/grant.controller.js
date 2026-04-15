
const grantService = require('./grant.service');
const { sendSuccess, sendCreated } = require('../../utils/apiResponse');

const list = async (req, res) => {
  const result = await grantService.listGrants(req.tenant, req.query);
  return sendSuccess(res, result);
};

const getOne = async (req, res) => {
  const grant = await grantService.getGrant(req.tenant, req.params.id);
  return sendSuccess(res, { grant });
};

const create = async (req, res) => {
  const grant = await grantService.createGrant(req.tenant, req.body, req.user.sub);
  return sendCreated(res, { grant });
};

const update = async (req, res) => {
  const grant = await grantService.updateGrant(req.tenant, req.params.id, req.body);
  return sendSuccess(res, { grant });
};

const remove = async (req, res) => {
  const result = await grantService.deleteGrant(req.tenant, req.params.id);
  return sendSuccess(res, result);
};

module.exports = { list, getOne, create, update, remove };
