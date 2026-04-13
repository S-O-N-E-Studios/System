const tenantRepo = require('./tenant.repository');

const listTenants = async () => tenantRepo.findAll();

const getTenant = async (id) => {
  const tenant = await tenantRepo.findById(id);
  if (!tenant) {
    throw Object.assign(new Error('Tenant not found'), { status: 404 });
  }
  return tenant;
};

const updateTenant = async (id, updates) => {
  const tenant = await tenantRepo.updateById(id, updates);
  if (!tenant) {
    throw Object.assign(new Error('Tenant not found'), { status: 404 });
  }
  return tenant;
};

const suspendTenant = async (id) => {
  const tenant = await tenantRepo.updateById(id, { status: 'suspended' });
  if (!tenant) {
    throw Object.assign(new Error('Tenant not found'), { status: 404 });
  }
  return tenant;
};

module.exports = {
  listTenants,
  getTenant,
  updateTenant,
  suspendTenant,
};
