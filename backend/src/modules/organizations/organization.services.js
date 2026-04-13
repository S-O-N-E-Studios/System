const Tenant = require('../tenants/tenant.model');

const getOrganization = async (tenant) => {
  return Tenant.findById(tenant._id).lean();
};

const updateOrganization = async (tenant, updates) => {
  const allowedFields = [
    'name', 'primaryContact', 'logoUrl', 'localMunicipalities', 'theme',
  ];
  const sanitized = {};
  for (const key of allowedFields) {
    if (updates[key] !== undefined) sanitized[key] = updates[key];
  }

  const updated = await Tenant.findByIdAndUpdate(tenant._id, sanitized, {
    new: true,
    runValidators: true,
  }).lean();

  if (!updated) throw Object.assign(new Error('Organisation not found'), { status: 404 });
  return updated;
};

module.exports = {
  getOrganization,
  updateOrganization,
};
