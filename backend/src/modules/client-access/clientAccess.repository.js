const TemporaryAccess = require('./temporaryAccess.model');

const findAll = (tenantId) =>
  TemporaryAccess.find({ tenantId })
    .select('-activationTokenHash')
    .sort({ createdAt: -1 })
    .lean();

const findById = (id, tenantId) =>
  TemporaryAccess.findOne({ _id: id, tenantId })
    .select('-activationTokenHash')
    .lean();

const findOneDoc = (id, tenantId) =>
  TemporaryAccess.findOne({ _id: id, tenantId });

const create = (data) => TemporaryAccess.create(data);

const updateById = (id, tenantId, updates) =>
  TemporaryAccess.findOneAndUpdate(
    { _id: id, tenantId },
    updates,
    { new: true, runValidators: true }
  ).select('-activationTokenHash');

module.exports = {
  findAll,
  findById,
  findOneDoc,
  create,
  updateById,
};
