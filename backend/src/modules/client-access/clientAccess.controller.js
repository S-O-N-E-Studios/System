const clientAccessService = require('./clientAccess.service');
const { sendSuccess, sendCreated } = require('../../utils/apiResponse');

const list = async (req, res) => {
  const items = await clientAccessService.listAccess(req.tenant);
  return sendSuccess(res, { access: items });
};

const grant = async (req, res) => {
  const access = await clientAccessService.grantAccess(req.tenant, req.body, req.user.sub);
  return sendCreated(res, { access });
};

const extend = async (req, res) => {
  const access = await clientAccessService.createExtendAccess(req.tenant, req.params.id, req.body);
  return sendSuccess(res, { access });
};

const revoke = async (req, res) => {
  const access = await clientAccessService.revokeAccess(req.tenant, req.params.id);
  return sendSuccess(res, { access });
};

module.exports = { list, grant, extend, revoke };
