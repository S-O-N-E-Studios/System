const Project = require('../projects/project.model');
const projectRepo = require('../projects/project.repository');
const { SERVICE_CATEGORIES } = require('../../constants/serviceCategories');

const allowedCategories = new Set(Object.values(SERVICE_CATEGORIES));

const getServicesSummary = async (tenant) => {
  return projectRepo.getServiceCategorySummary(tenant._id);
};

const getByCategory = async (tenant, category) => {
  const decoded = decodeURIComponent(category);
  if (!allowedCategories.has(decoded)) {
    throw Object.assign(new Error('Unknown service category'), { status: 400 });
  }

  const projects = await Project.find({
    tenantId: tenant._id,
    deletedAt: null,
    serviceCategory: decoded,
  })
    .sort({ name: 1 })
    .populate('projectManager', 'fullName email avatarUrl')
    .lean();

  return { serviceCategory: decoded, projects };
};

module.exports = {
  getServicesSummary,
  getByCategory,
};
