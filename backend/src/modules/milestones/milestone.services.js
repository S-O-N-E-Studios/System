const Milestone = require('./milestone.model');
const Project = require('../projects/project.model');

const _assertProject = async (tenantId, projectId) => {
  const project = await Project.findOne({
    _id: projectId,
    tenantId,
    deletedAt: null,
  }).select('_id');
  if (!project) throw Object.assign(new Error('Project not found'), { status: 404 });
  return project;
};

const listMilestones = async (tenant, projectId) => {
  await _assertProject(tenant._id, projectId);
  return Milestone.find({ tenantId: tenant._id, projectId }).sort({ dueDate: 1 }).lean();
};

const getMilestone = async (tenant, projectId, milestoneId) => {
  await _assertProject(tenant._id, projectId);
  const ms = await Milestone.findOne({ _id: milestoneId, tenantId: tenant._id, projectId }).lean();
  if (!ms) throw Object.assign(new Error('Milestone not found'), { status: 404 });
  return ms;
};

const createMilestone = async (tenant, projectId, data) => {
  await _assertProject(tenant._id, projectId);
  return Milestone.create({ ...data, tenantId: tenant._id, projectId });
};

const updateMilestone = async (tenant, projectId, milestoneId, updates) => {
  await _assertProject(tenant._id, projectId);
  const ms = await Milestone.findOneAndUpdate(
    { _id: milestoneId, tenantId: tenant._id, projectId },
    updates,
    { new: true, runValidators: true }
  ).lean();
  if (!ms) throw Object.assign(new Error('Milestone not found'), { status: 404 });
  return ms;
};

const deleteMilestone = async (tenant, projectId, milestoneId) => {
  const ms = await Milestone.findOneAndDelete({
    _id: milestoneId,
    tenantId: tenant._id,
    projectId,
  });
  if (!ms) throw Object.assign(new Error('Milestone not found'), { status: 404 });
  return { deleted: true };
};

module.exports = {
  listMilestones,
  getMilestone,
  createMilestone,
  updateMilestone,
  deleteMilestone,
};
