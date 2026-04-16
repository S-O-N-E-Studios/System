const Project = require('../projects/project.model');
const projectRepo = require('../projects/project.repository');
const { SERVICE_CATEGORIES, SERVICE_CATEGORY_LABEL_TO_KEY } = require('../../constants/serviceCategories');

const allowedCategories = new Set(Object.values(SERVICE_CATEGORIES));

const normalizeServiceCategory = (value) => {
  if (!value) return value;
  return SERVICE_CATEGORY_LABEL_TO_KEY[value] || value;
};

const getServicesSummary = async (tenant) => {
  const rows = await projectRepo.getServiceCategorySummary(tenant._id);

  // Hydrate each group with the projects list, matching frontend contract.
  const summary = await Promise.all(
    rows.map(async (row) => {
      const category = normalizeServiceCategory(row.serviceCategory);
      const projects = await Project.find({
        tenantId: tenant._id,
        deletedAt: null,
        serviceCategory: row.serviceCategory,
      })
        .sort({ name: 1 })
        .populate('projectManager', 'fullName email avatarUrl')
        .lean();

      return {
        category,
        projectCount: row.projectCount || projects.length,
        totalBudget: row.totalBudget || 0,
        totalExpenditure: row.totalExpenditure || 0,
        projects,
      };
    }),
  );

  return summary;
};

const getByCategory = async (tenant, category) => {
  const decoded = decodeURIComponent(category);
  const normalized = normalizeServiceCategory(decoded);
  if (!allowedCategories.has(normalized)) {
    throw Object.assign(new Error('Unknown service category'), { status: 400 });
  }

  const projects = await Project.find({
    tenantId: tenant._id,
    deletedAt: null,
    serviceCategory: normalized,
  })
    .sort({ name: 1 })
    .populate('projectManager', 'fullName email avatarUrl')
    .lean();

  return { category: normalized, projects };
};

module.exports = {
  getServicesSummary,
  getByCategory,
};
