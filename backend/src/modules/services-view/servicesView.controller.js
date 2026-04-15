const servicesViewService = require('./servicesView.service');
const { sendSuccess } = require('../../utils/apiResponse');

const getSummary = async (req, res) => {
  const summary = await servicesViewService.getServicesSummary(req.tenant);
  return sendSuccess(res, { summary });
};

const getByCategory = async (req, res) => {
  const result = await servicesViewService.getByCategory(req.tenant, req.params.category);
  return sendSuccess(res, result);
};

module.exports = { getSummary, getByCategory };
