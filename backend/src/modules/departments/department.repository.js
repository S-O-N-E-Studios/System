
const Department = require('./department.model');

const findAll = (tenantId) =>
  Department.find({ tenantId }).sort({ name: 1 }).lean();

const findById = (id, tenantId) =>
  Department.findOne({ _id: id, tenantId });

const findBySlug = (slug, tenantId) =>
  Department.findOne({ slug, tenantId }).lean();

const create = (data) =>
  Department.create(data);

const updateById = (id, tenantId, updates) =>
  Department.findOneAndUpdate(
    { _id: id, tenantId },
    updates,
    { new: true, runValidators: true }
  );

const deleteById = (id, tenantId) =>
  Department.findOneAndDelete({ _id: id, tenantId });

const incrementSpent = (id, tenantId, amountCents) =>
  Department.findOneAndUpdate(
    { _id: id, tenantId },
    { $inc: { budgetSpent: amountCents } },
    { new: true }
  );

module.exports = {
  findAll,
  findById,
  findBySlug,
  create,
  updateById,
  deleteById,
  incrementSpent,
};
