
const grantRepo = require('./grant.repository');

const normalizeDeptId = (payload) => {
  if (!payload || typeof payload !== 'object') return payload;
  if (payload.deptId === '') payload.deptId = null;
  return payload;
};

const listGrants = (tenant, query) => grantRepo.findAll(tenant._id, query);

const getGrant = async (tenant, grantId) => {
  const grant = await grantRepo.findById(grantId, tenant._id);
  if (!grant) throw Object.assign(new Error('Grant not found'), { status: 404 });
  return grant;
};

const createGrant = async (tenant, data, userId) => {
  const payload = normalizeDeptId({ ...data });
  const grant = await grantRepo.create({
    ...payload,
    tenantId: tenant._id,
  });
  return grant;
};

const updateGrant = async (tenant, grantId, updates) => {
  const payload = normalizeDeptId({ ...updates });
  const grant = await grantRepo.updateById(grantId, tenant._id, payload);
  if (!grant) throw Object.assign(new Error('Grant not found'), { status: 404 });
  return grant;
};

const deleteGrant = async (tenant, grantId) => {
  const grant = await grantRepo.deleteById(grantId, tenant._id);
  if (!grant) throw Object.assign(new Error('Grant not found'), { status: 404 });
  return { deleted: true };
};

module.exports = {
  listGrants,
  getGrant,
  createGrant,
  updateGrant,
  deleteGrant,
};
