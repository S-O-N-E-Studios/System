const fundingSourceRepo = require('./fundingSource.repository');
const projectRepo = require('../projects/project.repository');

const assertProjectInTenant = async (tenantId, projectId) => {
  const project = await projectRepo.findByIdLean(projectId, tenantId);
  if (!project) {
    throw Object.assign(new Error('Project not found'), { status: 404 });
  }
  return project;
};

const listFundingSources = async (tenant, projectId) => {
  await assertProjectInTenant(tenant._id, projectId);
  return fundingSourceRepo.findAll(tenant._id, projectId);
};

const createFundingSource = async (tenant, projectId, data) => {
  await assertProjectInTenant(tenant._id, projectId);
  return fundingSourceRepo.create({
    ...data,
    tenantId: tenant._id,
    projectId,
  });
};

const updateFundingSource = async (tenant, projectId, fsId, updates) => {
  await assertProjectInTenant(tenant._id, projectId);
  const updated = await fundingSourceRepo.updateById(fsId, tenant._id, projectId, updates);
  if (!updated) {
    throw Object.assign(new Error('Funding source not found'), { status: 404 });
  }
  return updated;
};

const deleteFundingSource = async (tenant, projectId, fsId) => {
  await assertProjectInTenant(tenant._id, projectId);
  const removed = await fundingSourceRepo.deleteById(fsId, tenant._id, projectId);
  if (!removed) {
    throw Object.assign(new Error('Funding source not found'), { status: 404 });
  }
  return { deleted: true };
};

module.exports = {
  listFundingSources,
  createFundingSource,
  updateFundingSource,
  deleteFundingSource,
};
