const tenantService = require('./tenant.service');
const { sendSuccess } = require('../../utils/apiResponse');

const list = async (req, res) => {
  const tenants = await tenantService.listTenants();
  return sendSuccess(res, { tenants });
};

const getOne = async (req, res) => {
  const tenant = await tenantService.getTenant(req.params.id);
  return sendSuccess(res, { tenant });
};

const update = async (req, res) => {
  const tenant = await tenantService.updateTenant(req.params.id, req.body);
  return sendSuccess(res, { tenant });
};

const suspend = async (req, res) => {
  const tenant = await tenantService.suspendTenant(req.params.id);
  return sendSuccess(res, { tenant });
};

module.exports = { list, getOne, update, suspend };
