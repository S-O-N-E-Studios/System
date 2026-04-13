const orgService = require('./organization.services');
const { sendSuccess } = require('../../utils/apiResponse');

const get = async (req, res) => {
  const org = await orgService.getOrganization(req.tenant);
  return sendSuccess(res, { organization: org });
};

const update = async (req, res) => {
  const org = await orgService.updateOrganization(req.tenant, req.body);
  return sendSuccess(res, { organization: org });
};

module.exports = { get, update };
