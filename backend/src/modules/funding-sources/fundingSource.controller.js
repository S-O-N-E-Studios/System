const fundingSourceService = require('./fundingSource.service');
const { sendSuccess, sendCreated } = require('../../utils/apiResponse');

const list = async (req, res) => {
  const fundingSources = await fundingSourceService.listFundingSources(
    req.tenant,
    req.params.id,
  );
  return sendSuccess(res, { fundingSources });
};

const create = async (req, res) => {
  const fundingSource = await fundingSourceService.createFundingSource(
    req.tenant,
    req.params.id,
    req.body,
  );
  return sendCreated(res, { fundingSource });
};

const update = async (req, res) => {
  const fundingSource = await fundingSourceService.updateFundingSource(
    req.tenant,
    req.params.id,
    req.params.fsId,
    req.body,
  );
  return sendSuccess(res, { fundingSource });
};

const remove = async (req, res) => {
  const result = await fundingSourceService.deleteFundingSource(
    req.tenant,
    req.params.id,
    req.params.fsId,
  );
  return sendSuccess(res, result);
};

module.exports = { list, create, update, remove };
