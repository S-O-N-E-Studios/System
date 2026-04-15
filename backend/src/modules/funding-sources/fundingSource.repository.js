const FundingSource = require('./fundingSource.model');

const findAll = (tenantId, projectId) =>
  FundingSource.find({ tenantId, projectId }).sort({ createdAt: -1 }).lean();

const findById = (fsId, tenantId, projectId) =>
  FundingSource.findOne({ _id: fsId, tenantId, projectId }).lean();

const create = (data) => FundingSource.create(data);

const updateById = (fsId, tenantId, projectId, updates) =>
  FundingSource.findOneAndUpdate(
    { _id: fsId, tenantId, projectId },
    updates,
    { new: true, runValidators: true }
  );

const deleteById = (fsId, tenantId, projectId) =>
  FundingSource.findOneAndDelete({ _id: fsId, tenantId, projectId });

module.exports = {
  findAll,
  findById,
  create,
  updateById,
  deleteById,
};
