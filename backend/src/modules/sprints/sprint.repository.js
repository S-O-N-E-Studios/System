const Sprint = require('./sprint.model');

const findSprints = (tenantId) =>
  Sprint.find({ tenantId })
    .sort({ startDate: -1 })
    .populate('createdBy', 'fullName email')
    .lean();

const findById = (id, tenantId) =>
  Sprint.findOne({ _id: id, tenantId }).populate('createdBy', 'fullName email');

const create = (data) => Sprint.create(data);

const updateById = (id, tenantId, updates) =>
  Sprint.findOneAndUpdate({ _id: id, tenantId }, updates, {
    new: true,
    runValidators: true,
  }).populate('createdBy', 'fullName email');

const deleteById = (id, tenantId) => Sprint.findOneAndDelete({ _id: id, tenantId });

module.exports = {
  findSprints,
  findById,
  create,
  updateById,
  deleteById,
};
