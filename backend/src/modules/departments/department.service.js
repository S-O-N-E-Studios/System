
//  * Provincial government tenants only.
//  * DEPT_ADMIN scope for single-department routes is enforced by requireDeptScope.
 

const deptRepo = require('./department.repository');
const Project    = require('../projects/project.model');

const assertProvincialGov = (tenant) => {
  if (tenant.orgType !== 'provincial_gov') {
    throw Object.assign(
      new Error('Departments are only available for provincial government organisations'),
      { status: 400 }
    );
  }
};

const slugify = (name) => {
  const s = String(name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return s || 'department';
};

const listDepartments = async (tenant) => {
  assertProvincialGov(tenant);
  const departments = await deptRepo.findAll(tenant._id);

  const counts = await Project.aggregate([
    { $match: { tenantId: tenant._id, deletedAt: null } },
    { $group: { _id: '$deptId', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id?.toString(), c.count]));

  return departments.map((d) => ({
    ...d,
    projectCount: countMap[d._id.toString()] || 0,
  }));
};

const getDepartment = async (tenant, deptId) => {
  assertProvincialGov(tenant);
  const dept = await deptRepo.findById(deptId, tenant._id);
  if (!dept) throw Object.assign(new Error('Department not found'), { status: 404 });
  return dept;
};

const createDepartment = async (tenant, data) => {
  assertProvincialGov(tenant);

  const slug = (data.slug && String(data.slug).trim()) ? data.slug.trim().toLowerCase() : slugify(data.name);
  const existing = await deptRepo.findBySlug(slug, tenant._id);
  if (existing) {
    throw Object.assign(new Error('A department with this slug already exists'), { status: 409 });
  }

  const { slug: _omit, ...rest } = data;
  return deptRepo.create({ ...rest, tenantId: tenant._id, slug });
};

const updateDepartment = async (tenant, deptId, updates) => {
  assertProvincialGov(tenant);

  if (updates.slug !== undefined) {
    const nextSlug = String(updates.slug).trim().toLowerCase();
    const conflict = await deptRepo.findBySlug(nextSlug, tenant._id);
    if (conflict && conflict._id.toString() !== deptId.toString()) {
      throw Object.assign(new Error('A department with this slug already exists'), { status: 409 });
    }
    updates = { ...updates, slug: nextSlug };
  }

  const dept = await deptRepo.updateById(deptId, tenant._id, updates);
  if (!dept) throw Object.assign(new Error('Department not found'), { status: 404 });
  return dept;
};

const deleteDepartment = async (tenant, deptId) => {
  assertProvincialGov(tenant);

  const projectCount = await Project.countDocuments({
    tenantId:  tenant._id,
    deptId,
    deletedAt: null,
    status:    { $ne: 'cancelled' },
  });
  if (projectCount > 0) {
    throw Object.assign(
      new Error(`Cannot delete: ${projectCount} active project(s) are linked to this department`),
      { status: 409 }
    );
  }

  const dept = await deptRepo.deleteById(deptId, tenant._id);
  if (!dept) throw Object.assign(new Error('Department not found'), { status: 404 });
  return { deleted: true };
};

module.exports = {
  listDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
