const projectRepo = require('./project.repository');
const stageGateSvc = require('../stage-gate/stageGate.service');
const CalendarEvent = require('../calendar/calendarEvent.model');
const File = require('../files/file.model');
const VariationOrder = require('../stage-gate/variationOrder.model');
const { ROLES } = require('../../constants/roles');
const { SERVICE_CATEGORY_LABEL_TO_KEY } = require('../../constants/serviceCategories');
const {
  getWorkflowProfileForTenant,
  getStageDocumentSpecsForTenant,
} = require('../../constants/workflowProfiles');
const workflowService = require('../workflow/workflow.service');

const normalizeServiceCategory = (value) => {
  if (!value) return value;
  return SERVICE_CATEGORY_LABEL_TO_KEY[value] || value;
};

const _buildStage0Missing = (project) => {
  const missing = [];
  const requiresLinkedPlan = project.projectDurationType === 'multi_year';
  if (requiresLinkedPlan && !project.linkedMultiYearPlanId) {
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

const getStage7Readiness = async (tenant, projectId) => {
  const files = await File.find({
    tenantId: tenant._id,
    projectId,
    stage: 7,
    deletedAt: null,
    billingPeriod: { $ne: null },
    category: {
      $in: [
        'progress-report',
        'safety-report',
        'monthly-cash-flow',
        'meeting-minutes',
        'payment-certificate',
        'site-image',
      ],
    },
  })
    .select('category billingPeriod')
    .lean();

  const pendingVariationCount = await VariationOrder.countDocuments({
    tenantId: tenant._id,
    projectId,
    status: 'pending_approval',
  });

  const byPeriod = new Map();
  files.forEach((f) => {
    const period = String(f.billingPeriod || '');
    if (!period) return;
    if (!byPeriod.has(period)) {
      byPeriod.set(period, {
        period,
        progressReportPresent: false,
        safetyReportPresent: false,
        cashFlowPresent: false,
        meetingMinutesPresent: false,
        paymentCertificateCount: 0,
        evidenceImageCount: 0,
        reportingComplete: false,
        evidenceMinimum: tenant?.evidenceConfig?.minImagesPerBillingPeriod || 3,
        evidenceSufficient: false,
      });
    }
    const row = byPeriod.get(period);
    if (f.category === 'progress-report') row.progressReportPresent = true;
    if (f.category === 'safety-report') row.safetyReportPresent = true;
    if (f.category === 'monthly-cash-flow') row.cashFlowPresent = true;
    if (f.category === 'meeting-minutes') row.meetingMinutesPresent = true;
    if (f.category === 'payment-certificate') row.paymentCertificateCount += 1;
    if (f.category === 'site-image') row.evidenceImageCount += 1;
    row.reportingComplete =
      row.progressReportPresent && row.cashFlowPresent && row.meetingMinutesPresent;
    row.evidenceSufficient = row.evidenceImageCount >= row.evidenceMinimum;
  });

  const periods = [...byPeriod.values()].sort((a, b) => b.period.localeCompare(a.period));
  return {
    periods,
    pendingVariationCount,
  };
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
  const projectDurationType = data.projectDurationType || 'one_year';
  if (projectDurationType === 'one_year') {
    data.linkedMultiYearPlanId = null;
  }
  if (projectDurationType === 'multi_year' && !data.linkedMultiYearPlanId) {
    throw Object.assign(
      new Error('A linked multi-year plan is required when duration type is multi-year'),
      { status: 400 }
    );
  }
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
    projectDurationType,
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
  if (updates.projectDurationType === 'one_year') {
    updates.linkedMultiYearPlanId = null;
  }
  if (updates.projectDurationType === 'multi_year' && Object.prototype.hasOwnProperty.call(updates, 'linkedMultiYearPlanId')) {
    if (!updates.linkedMultiYearPlanId) {
      throw Object.assign(
        new Error('A linked multi-year plan is required when duration type is multi-year'),
        { status: 400 }
      );
    }
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
    tenant, projectId, project.currentStage
  );
  const stageRequirements = getStageDocumentSpecsForTenant(tenant);
  const stage7Readiness =
    Number(project.currentStage) === 7 ? await getStage7Readiness(tenant, projectId) : null;

  return {
    projectId,
    currentStage: project.currentStage,
    stageTopLevel: project.stageTopLevel || null,
    stageCheckpoint: project.stageCheckpoint || null,
    workflowProfile: getWorkflowProfileForTenant(tenant),
    stageRequirements,
    stage7Readiness,
    ...result,
  };
};

const advanceStage = async (tenant, projectId, advancedBy) => {
  try {
    const result = await workflowService.advanceWorkflow(tenant, projectId, advancedBy);
    return {
      advanced: result.advanced,
      previousStage: result.previousLegacyStage,
      newStage: result.newLegacyStage,
      previousStageTopLevel: result.previousStageTopLevel,
      newStageTopLevel: result.newStageTopLevel,
      stageCheckpoint: result.stageCheckpoint,
      completed: result.completed,
    };
  } catch (err) {
    if (err.status === 422 && err.code === 'WORKFLOW_GATE_FAILED') {
      const requirements = err.details?.requirements || [];
      const mappedMissing = requirements.map((req) => ({
        category: req.entityKey,
        documentName: req.entityKey,
        reason: req.code,
      }));
      throw Object.assign(new Error(err.message), {
        status: 422,
        gateError: true,
        stage: null,
        missing: mappedMissing,
      });
    }
    throw err;
  }
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
