const projectRepo = require('./project.repository');
const stageGateSvc = require('../stage-gate/stageGate.service');
const CalendarEvent = require('../calendar/calendarEvent.model');
const { ROLES } = require('../../constants/roles');
const { SERVICE_CATEGORY_LABEL_TO_KEY } = require('../../constants/serviceCategories');

const normalizeServiceCategory = (value) => {
  if (!value) return value;
  return SERVICE_CATEGORY_LABEL_TO_KEY[value] || value;
};

const buildStage0Missing = (project) => {
  const missing = [];
  if (!project.linkedMultiYearPlanId) {
    missing.push({ documentName: 'Linked multi-year plan', category: 'stage0-multi-year-plan' });
  }
  if (!project.location?.address) {
    missing.push({ documentName: 'Project address', category: 'stage0-address' });
  }
  if (!project.appointmentDate) {
    missing.push({ documentName: 'Appointment date', category: 'stage0-appointment-date' });
  }
  if (!project.completionDate) {
    missing.push({ documentName: 'Target completion date', category: 'stage0-completion-date' });
  }
  if (!project.stage0Contacts || project.stage0Contacts.length === 0) {
    missing.push({ documentName: 'Project team contacts', category: 'stage0-contacts' });
  }
  return missing;
};

const listProjects = async (tenant, query, requestingUser) => {
  if (requestingUser.role === ROLES.CLIENT_TEMP) {
    const projectIds = requestingUser.clientAccess?.projectIds || [];
    const projects = await projectRepo.findProjectsForClient(tenant._id, projectIds);
    return { projects, total: projects.length };
  }
  return projectRepo.findProjects(tenant._id, query);
};

const getProject = async (tenant, projectId, requestingUser) => {
  const project = await projectRepo.findById(projectId, tenant._id);
  if (!project) throw Object.assign(new Error('Project not found'), { status: 404 });

  if (requestingUser.role === ROLES.CLIENT_TEMP) {
    const access = requestingUser.clientAccess;
    const allowed = access?.projectIds?.some(
      (pid) => pid.toString() === projectId.toString()
    );
    if (!allowed) throw Object.assign(new Error('Access denied to this project'), { status: 403 });
    return projectRepo.stripFinancialFields(project.toObject());
  }

  return project;
};

const createProject = async (tenant, data, createdBy) => {
  data.serviceCategory = normalizeServiceCategory(data.serviceCategory);
  if (
    tenant.orgType === 'provincial_gov' &&
    data.localMunicipality &&
    tenant.localMunicipalities?.length > 0 &&
    !tenant.localMunicipalities.includes(data.localMunicipality)
  ) {
    throw Object.assign(
      new Error(`'${data.localMunicipality}' is not a valid local municipality for this organisation`),
      { status: 400 }
    );
  }

  const project = await projectRepo.create({
    ...data,
    tenantId: tenant._id,
    currentStage: 0,
    contractValueAdjusted: data.contractValueOriginal || 0,
    createdBy,
  });

  return project;
};

const updateProject = async (tenant, projectId, updates, _requestingUser) => {
  if (updates.serviceCategory) {
    updates.serviceCategory = normalizeServiceCategory(updates.serviceCategory);
  }
  if (updates.status === 'complete') {
    throw Object.assign(
      new Error('Projects cannot be marked complete directly. Advance through the stage gate to complete a project.'),
      { status: 400 }
    );
  }

  const project = await projectRepo.updateById(projectId, tenant._id, updates);
  if (!project) throw Object.assign(new Error('Project not found'), { status: 404 });
  return project;
};

const deleteProject = async (tenant, projectId) => {
  const project = await projectRepo.findByIdLean(projectId, tenant._id);
  if (!project) throw Object.assign(new Error('Project not found'), { status: 404 });

  if (project.status === 'complete') {
    throw Object.assign(new Error('Completed projects cannot be deleted'), { status: 400 });
  }

  await projectRepo.softDelete(projectId, tenant._id);
  return { deleted: true };
};

const getStageStatus = async (tenant, projectId) => {
  const project = await projectRepo.findByIdLean(projectId, tenant._id);
  if (!project) throw Object.assign(new Error('Project not found'), { status: 404 });

  const result = await stageGateSvc.checkStageGateWithActivities(
    tenant._id, projectId, project.currentStage
  );

  return {
    projectId,
    currentStage: project.currentStage,
    ...result,
  };
};

const advanceStage = async (tenant, projectId, advancedBy) => {
  const project = await projectRepo.findByIdLean(projectId, tenant._id);
  if (!project) throw Object.assign(new Error('Project not found'), { status: 404 });

  if (project.status === 'complete' || project.status === 'cancelled') {
    throw Object.assign(
      new Error(`Cannot advance stage on a ${project.status} project`),
      { status: 400 }
    );
  }

  if (project.currentStage >= 10) {
    throw Object.assign(new Error('Project is already complete'), { status: 400 });
  }

  // Stages 0 and 5 don't require approval gate
  if (project.currentStage === 0) {
    const stage0Missing = buildStage0Missing(project);
    if (stage0Missing.length > 0) {
      const err = Object.assign(
        new Error('Stage 0 setup is incomplete'),
        {
          status: 422,
          gateError: true,
          stage: project.currentStage,
          missing: stage0Missing,
        }
      );
      throw err;
    }
  } else if (project.currentStage !== 5) {
    const gateResult = await stageGateSvc.checkStageGateWithActivities(
      tenant._id, projectId, project.currentStage
    );

    if (!gateResult.gatePassed) {
      const err = Object.assign(
        new Error('Stage gate validation failed'),
        {
          status: 422,
          gateError: true,
          stage: project.currentStage,
          missing: gateResult.missing,
          activitiesMissingImages: gateResult.activitiesMissingImages,
        }
      );
      throw err;
    }
  }

  const newStage = project.currentStage + 1;

  const File = require('../files/file.model');
  const stageFiles = await File.find({
    tenantId: tenant._id,
    projectId,
    stage: project.currentStage,
    deletedAt: null,
  }).select('_id');

  const updates = {
    currentStage: newStage,
    ...(project.currentStage === 0 ? { stage0CompletedAt: new Date() } : {}),
    $push: {
      stageHistory: {
        stage: project.currentStage,
        advancedAt: new Date(),
        advancedBy,
        documentsSnapshot: stageFiles.map((f) => f._id),
      },
    },
  };

  if (newStage === 10) {
    updates.status = 'complete';
    updates.completionDate = new Date();
  }

  await projectRepo.updateById(projectId, tenant._id, updates);
  await CalendarEvent.createStageEvent(tenant._id, projectId, project.currentStage, advancedBy);

  return {
    advanced: true,
    previousStage: project.currentStage,
    newStage,
    completed: newStage === 10,
  };
};

const getClientAccessCheck = async (tenant, projectId, clientAccess) => {
  await _assertProjectExists(tenant._id, projectId);
  const allowedProjectIds = (clientAccess?.projectIds || []).map((id) => id.toString());
  return {
    allowedProjectIds,
    expiresAt: clientAccess?.expiresAt ? clientAccess.expiresAt.toISOString() : null,
  };
};

const listPayments = async (tenant, projectId) => {
  await _assertProjectExists(tenant._id, projectId);
  return projectRepo.findPayments(tenant._id, projectId);
};

const addPayment = async (tenant, projectId, data, recordedBy) => {
  const project = await projectRepo.findByIdLean(projectId, tenant._id);
  if (!project) throw Object.assign(new Error('Project not found'), { status: 404 });

  const payment = await projectRepo.createPayment({
    ...data,
    tenantId: tenant._id,
    projectId,
    recordedBy,
  });

  await projectRepo.updateById(projectId, tenant._id, {
    $inc: { expenditureToDate: data.amount },
  });

  await CalendarEvent.createPaymentEvent(
    tenant._id, projectId, data.paymentDate, data.amount, recordedBy
  );

  return payment;
};

const updatePayment = async (tenant, projectId, paymentId, updates) => {
  const existing = await projectRepo.findPaymentById(paymentId, tenant._id, projectId);
  if (!existing) throw Object.assign(new Error('Payment not found'), { status: 404 });

  if (updates.amount && updates.amount !== existing.amount) {
    const diff = updates.amount - existing.amount;
    await projectRepo.updateById(projectId, tenant._id, {
      $inc: { expenditureToDate: diff },
    });
  }

  return projectRepo.updatePayment(paymentId, tenant._id, projectId, updates);
};

const getPaymentForecast = async (tenant, projectId) => {
  await _assertProjectExists(tenant._id, projectId);
  return projectRepo.findForecast(tenant._id, projectId);
};

const upsertForecastEntry = async (tenant, projectId, data) => {
  await _assertProjectExists(tenant._id, projectId);
  return projectRepo.upsertForecastEntry(
    tenant._id, projectId, data.month, data.contractType, data.forecastAmount
  );
};

const getBudgetSummary = async (tenant, deptId) => {
  const [summary] = await projectRepo.getBudgetSummary(tenant._id, deptId);
  return summary || {
    totalContractValue: 0,
    totalExpenditure: 0,
    totalBalance: 0,
    projectCount: 0,
    activeCount: 0,
    completeCount: 0,
  };
};

const getServiceCategorySummary = (tenant) =>
  projectRepo.getServiceCategorySummary(tenant._id);

const getIdpData = (tenant, filters) =>
  projectRepo.getIdpData(tenant._id, filters);

const _assertProjectExists = async (tenantId, projectId) => {
  const exists = await projectRepo.findByIdLean(projectId, tenantId);
  if (!exists) throw Object.assign(new Error('Project not found'), { status: 404 });
};

module.exports = {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getStageStatus,
  advanceStage,
  getClientAccessCheck,
  listPayments,
  addPayment,
  updatePayment,
  getPaymentForecast,
  upsertForecastEntry,
  getBudgetSummary,
  getServiceCategorySummary,
  getIdpData,
};
