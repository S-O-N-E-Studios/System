const planningRepo = require('./planning.repository');
const Project = require('../projects/project.model');

const notFound = (msg = 'Plan entry not found') =>
  Object.assign(new Error(msg), { status: 404 });

const conflict = (msg) => Object.assign(new Error(msg), { status: 409 });

const badRequest = (msg) => Object.assign(new Error(msg), { status: 400 });

const listPlanEntries = async (tenantId, query) => planningRepo.findAll(tenantId, query);

const getPlanEntry = async (tenantId, planId) => {
  const plan = await planningRepo.findById(planId, tenantId);
  if (!plan) throw notFound();
  return plan;
};

const createPlanEntry = async (tenantId, body, userId) => {
  const plan = await planningRepo.create({
    ...body,
    tenantId,
    createdBy: userId,
  });
  return plan;
};

const updatePlanEntry = async (tenantId, planId, body) => {
  const plan = await planningRepo.updateById(planId, tenantId, body);
  if (!plan) throw notFound();
  return plan;
};

const deletePlanEntry = async (tenantId, planId) => {
  const plan = await planningRepo.deleteById(planId, tenantId);
  if (!plan) throw notFound();
  return { deleted: true, id: plan._id };
};

const beginInception = async (tenant, planId, userId) => {
  const plan = await planningRepo.findById(planId, tenant._id);
  if (!plan) throw notFound();

  if (plan.status === 'cancelled') {
    throw badRequest('Cannot start inception for a cancelled plan entry.');
  }

  if (plan.linkedProjectId) {
    throw conflict('This plan entry is already linked to a project.');
  }

  if (
    tenant.orgType === 'provincial_gov' &&
    plan.localMunicipality &&
    tenant.localMunicipalities?.length > 0 &&
    !tenant.localMunicipalities.includes(plan.localMunicipality)
  ) {
    throw badRequest(
      `'${plan.localMunicipality}' is not a valid local municipality for this organisation`,
    );
  }

  const contractValueOriginal = plan.estimatedValue ?? 0;

  const project = await Project.create({
    tenantId: tenant._id,
    deptId: plan.deptId ?? null,
    name: plan.projectName,
    serviceCategory: plan.serviceCategory,
    localMunicipality: plan.localMunicipality ?? null,
    contractValueOriginal,
    contractValueAdjusted: contractValueOriginal > 0 ? contractValueOriginal : 0,
    currentStage: 1,
    linkedMultiYearPlanId: plan._id,
    idpProjectNo: plan.idpProjectNo ?? null,
    createdBy: userId,
  });

  const updatedPlan = await planningRepo.updateById(planId, tenant._id, {
    linkedProjectId: project._id,
    status: 'active',
  });

  return { plan: updatedPlan, project };
};

module.exports = {
  listPlanEntries,
  getPlanEntry,
  createPlanEntry,
  updatePlanEntry,
  deletePlanEntry,
  beginInception,
};
