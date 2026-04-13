const Tenant = require('./tenant.model');

const findAll = () => Tenant.find({}).sort({ name: 1 }).lean();

const findById = (id) => Tenant.findById(id).lean();

const findBySlug = (slug) => Tenant.findOne({ slug: slug.toLowerCase().trim() }).lean();

const updateById = (id, updates) =>
  Tenant.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).lean();

module.exports = {
  findAll,
  findById,
  findBySlug,
  updateById,
};
