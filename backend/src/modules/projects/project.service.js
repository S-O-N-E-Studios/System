const projectRepo = require('./project.repository');
const stageGateSvc = require('../stage-gate/stageGate.service');
const CalendarEvent = require('../calendar/calendarEvent.model');
const File = require('../files/file.model');
const VariationOrder = require('../stage-gate/variationOrder.model');
const StageApproval = require('../stage-gate/stageApproval.model');
const procurementTrailService = require('../procurement-trails/procurementTrail.service');
const { APPOINTMENT_TYPES, STEP_KEYS } = require('../procurement-trails/procurementTrail.model');
const { ROLES } = require('../../constants/roles');
const { SERVICE_CATEGORY_LABEL_TO_KEY } = require('../../constants/serviceCategories');
const {
  getWorkflowProfileForTenant,
  getStageDocumentSpecsForTenant,
  getApprovalRequiredCategoriesForTenant,
} = require('../../constants/workflowProfiles');
const workflowService = require('../workflow/workflow.service');
const { logEvent } = require('../audit/audit.service');

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

const categoryToDeliverableKey = (category) =>
  String(category || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const STEP_KEY_ALIASES = {
  appointmentletter: 'appointment_letter',
  appointment_letter: 'appointment_letter',
  appointmentletter_: 'appointment_letter',
};
const CLOSE_OUT_REPORT_CATEGORIES = {
  principal: 'closeout-report-principal',
  safety: 'closeout-report-safety',
  eia: 'closeout-report-eia',
};

const serializeInterimPaymentCertificate = (row, readiness = null) => {
  const payload = row?.toObject ? row.toObject() : row;
  if (!payload) return payload;
  return {
    ...payload,
    amountCents: Number(payload.amount || 0),
    amountClaimed: Number(payload.amount || 0),
    certificateNumber: payload.certificateNo || null,
    ...(readiness ? { readiness } : {}),
  };
};

const toCanonicalStepKey = (step) => {
  const normalized = String(step || '').trim().toLowerCase().replace(/[^a-z_]/g, '');
  return STEP_KEY_ALIASES[normalized] || normalized;
};

const STAGE4_MIN_IMAGE_DEFAULT = 3;

const getInterimCertificateReadiness = async (tenant, projectId, amount, billingPeriod) => {
  const minImages = Number(tenant?.evidenceConfig?.minImagesPerBillingPeriod || STAGE4_MIN_IMAGE_DEFAULT);
  const [periodFiles, project] = await Promise.all([
    File.find({
      tenantId: tenant._id,
      projectId,
      stage: 7,
      billingPeriod,
      deletedAt: null,
      category: { $in: ['progress-report', 'site-image', 'drone-video'] },
    })
      .select('category')
      .lean(),
    projectRepo.findByIdLean(projectId, tenant._id),
  ]);
  if (!project) throw Object.assign(new Error('Project not found'), { status: 404 });
  const progressReportPresent = periodFiles.some((f) => f.category === 'progress-report');
  const evidenceCount = periodFiles.filter((f) => f.category === 'site-image' || f.category === 'drone-video').length;
  const contractValue = Number(project.contractValueAdjusted || project.contractValueOriginal || 0);
  const expenditure = Number(project.expenditureToDate || 0);
  const withinBudget = Number.isFinite(amount) ? amount <= Math.max(contractValue - expenditure, 0) : false;
  return {
    progressReportPresent,
    evidenceCount,
    evidenceMinimum: minImages,
    withinBudget,
    allChecksPassed: progressReportPresent && evidenceCount >= minImages && withinBudget,
  };
};

const resolveDeliverableCandidates = (tenant, key) => {
  const specsByStage = getStageDocumentSpecsForTenant(tenant);
  const candidates = [];
  for (const [stageRaw, rows] of Object.entries(specsByStage || {})) {
    const stage = Number(stageRaw);
    for (const row of rows || []) {
      const computedKey = categoryToDeliverableKey(row.category);
      if (computedKey === key) {
        candidates.push({
          stage,
          category: row.category,
          documentName: row.documentName,
          group: row.group || null,
          key: computedKey,
        });
      }
    }
  }
  return candidates;
};

const listDeliverables = async (tenant, projectId, stage) => {
  await _assertProjectExists(tenant._id, projectId);
  const specsByStage = getStageDocumentSpecsForTenant(tenant);
  const approvalRequired = new Set(getApprovalRequiredCategoriesForTenant(tenant));
  const filter = {
    tenantId: tenant._id,
    projectId,
    deletedAt: null,
  };
  if (stage != null) filter.stage = stage;
  const [files, approvals] = await Promise.all([
    File.find(filter)
      .select('_id stage category originalName filename approvalStatus createdAt')
      .sort({ createdAt: -1 })
      .lean(),
    StageApproval.find({
      tenantId: tenant._id,
      projectId,
      ...(stage != null ? { stage } : {}),
    })
      .select('_id stage documentCategory approvalStatus rejectionReason reviewedAt fileId createdAt')
      .sort({ createdAt: -1 })
      .lean(),
  ]);
  const latestFileByStageCategory = new Map();
  for (const file of files) {
    const mapKey = `${file.stage}:${file.category}`;
    if (!latestFileByStageCategory.has(mapKey)) {
      latestFileByStageCategory.set(mapKey, file);
    }
  }
  const latestApprovalByStageCategory = new Map();
  for (const row of approvals) {
    const mapKey = `${row.stage}:${row.documentCategory}`;
    if (!latestApprovalByStageCategory.has(mapKey)) {
      latestApprovalByStageCategory.set(mapKey, row);
    }
  }
  const deliverables = [];
  for (const [stageRaw, specs] of Object.entries(specsByStage || {})) {
    const stageNo = Number(stageRaw);
    if (stage != null && stageNo !== stage) continue;
    for (const spec of specs || []) {
      const mapKey = `${stageNo}:${spec.category}`;
      const file = latestFileByStageCategory.get(mapKey) || null;
      const approval = latestApprovalByStageCategory.get(mapKey) || null;
      let status = 'not_started';
      if (file) {
        if (!approvalRequired.has(spec.category)) {
          status = 'uploaded';
        } else if (approval?.approvalStatus === 'approved') {
          status = 'approved';
        } else if (approval?.approvalStatus === 'rejected') {
          status = 'rejected';
        } else {
          status = 'pending_approval';
        }
      }
      deliverables.push({
        stage: stageNo,
        key: categoryToDeliverableKey(spec.category),
        deliverableName: spec.documentName,
        category: spec.category,
        group: spec.group || null,
        requiresClientApproval: approvalRequired.has(spec.category),
        status,
        fileId: file?._id?.toString?.() || null,
        fileName: file?.originalName || file?.filename || null,
        approvalId: approval?._id?.toString?.() || null,
        rejectionReason: approval?.rejectionReason || null,
        reviewedAt: approval?.reviewedAt || null,
      });
    }
  }
  return deliverables;
};

const getDeliverable = async (tenant, projectId, key, stage) => {
  const candidates = resolveDeliverableCandidates(tenant, key);
  if (candidates.length === 0) {
    throw Object.assign(new Error('Deliverable not found'), { status: 404 });
  }
  const chosen = stage != null
    ? candidates.find((row) => row.stage === stage)
    : candidates.length === 1
      ? candidates[0]
      : null;
  if (!chosen) {
    throw Object.assign(
      new Error('Deliverable key is ambiguous; provide ?stage= to disambiguate'),
      { status: 400, code: 'AMBIGUOUS_DELIVERABLE_KEY' }
    );
  }
  const all = await listDeliverables(tenant, projectId, chosen.stage);
  const match = all.find((row) => row.key === key && row.category === chosen.category);
  if (!match) {
    throw Object.assign(new Error('Deliverable not found'), { status: 404 });
  }
  return match;
};

const uploadDeliverable = async (tenant, projectId, key, fileId, actorUserId, stage) => {
  const deliverable = await getDeliverable(tenant, projectId, key, stage);
  const file = await File.findOne({
    _id: fileId,
    tenantId: tenant._id,
    projectId,
    deletedAt: null,
  });
  if (!file) {
    throw Object.assign(new Error('File not found for this project'), { status: 404 });
  }
  file.stage = deliverable.stage;
  file.category = deliverable.category;
  file.approvalStatus = deliverable.requiresClientApproval ? 'pending' : 'not_required';
  file.approvedBy = null;
  file.approvedAt = null;
  file.rejectionReason = null;
  await file.save();
  let approval = null;
  if (deliverable.requiresClientApproval) {
    approval = await StageApproval.create({
      tenantId: tenant._id,
      projectId,
      stage: deliverable.stage,
      documentCategory: deliverable.category,
      fileId: file._id,
      approvalStatus: 'pending',
    });
  }
  await logEvent({
    tenantId: tenant._id,
    projectId,
    entityType: 'deliverable',
    entityId: file._id,
    action: 'deliverable.uploaded',
    actor: { userId: actorUserId, role: null, name: null },
    metadata: {
      stage: deliverable.stage,
      category: deliverable.category,
      approvalId: approval?._id || null,
    },
  });
  return getDeliverable(tenant, projectId, key, deliverable.stage);
};

const approveDeliverable = async (tenant, projectId, key, actor, stage) => {
  const deliverable = await getDeliverable(tenant, projectId, key, stage);
  if (!deliverable.requiresClientApproval) return deliverable;
  const approval = await StageApproval.findOne({
    tenantId: tenant._id,
    projectId,
    stage: deliverable.stage,
    documentCategory: deliverable.category,
    approvalStatus: 'pending',
  }).sort({ createdAt: -1 });
  if (!approval) {
    throw Object.assign(new Error('No pending deliverable approval found'), { status: 400 });
  }
  const before = approval.toObject();
  approval.approvalStatus = 'approved';
  approval.reviewedBy = actor.userId;
  approval.reviewedAt = new Date();
  approval.rejectionReason = null;
  await approval.save();
  await File.updateOne(
    { _id: approval.fileId, tenantId: tenant._id, projectId, deletedAt: null },
    { approvalStatus: 'approved', approvedBy: actor.userId, approvedAt: approval.reviewedAt, rejectionReason: null }
  );
  await CalendarEvent.createApprovalEvent(
    tenant._id,
    projectId,
    true,
    deliverable.category,
    actor.userId
  );
  await logEvent({
    tenantId: tenant._id,
    projectId,
    entityType: 'stage_approval',
    entityId: approval._id,
    action: 'deliverable.approved',
    actor: { userId: actor.userId, role: actor.role, name: actor.name || null },
    before,
    after: approval.toObject(),
  });
  return getDeliverable(tenant, projectId, key, deliverable.stage);
};

const rejectDeliverable = async (tenant, projectId, key, reason, actor, stage) => {
  const deliverable = await getDeliverable(tenant, projectId, key, stage);
  if (!deliverable.requiresClientApproval) {
    throw Object.assign(new Error('Deliverable does not require client approval'), { status: 400 });
  }
  const approval = await StageApproval.findOne({
    tenantId: tenant._id,
    projectId,
    stage: deliverable.stage,
    documentCategory: deliverable.category,
    approvalStatus: 'pending',
  }).sort({ createdAt: -1 });
  if (!approval) {
    throw Object.assign(new Error('No pending deliverable approval found'), { status: 400 });
  }
  const before = approval.toObject();
  approval.approvalStatus = 'rejected';
  approval.reviewedBy = actor.userId;
  approval.reviewedAt = new Date();
  approval.rejectionReason = reason;
  await approval.save();
  await File.updateOne(
    { _id: approval.fileId, tenantId: tenant._id, projectId, deletedAt: null },
    { approvalStatus: 'rejected', approvedBy: null, approvedAt: null, rejectionReason: reason }
  );
  await CalendarEvent.createApprovalEvent(
    tenant._id,
    projectId,
    false,
    deliverable.category,
    actor.userId
  );
  await logEvent({
    tenantId: tenant._id,
    projectId,
    entityType: 'stage_approval',
    entityId: approval._id,
    action: 'deliverable.rejected',
    actor: { userId: actor.userId, role: actor.role, name: actor.name || null },
    before,
    after: approval.toObject(),
  });
  return getDeliverable(tenant, projectId, key, deliverable.stage);
};

const listAppointments = async (tenant, projectId) => {
  await _assertProjectExists(tenant._id, projectId);
  return procurementTrailService.listTrails(tenant._id, projectId);
};

const createAppointment = async (tenant, projectId, payload, actor) => {
  await _assertProjectExists(tenant._id, projectId);
  const appointmentType = payload.role || payload.appointmentType;
  if (!APPOINTMENT_TYPES.includes(appointmentType)) {
    throw Object.assign(new Error('Invalid appointment role/type'), { status: 400, code: 'VALIDATION_ERROR' });
  }
  return procurementTrailService.createTrail(tenant._id, projectId, {
    appointmentType,
    assignee: {
      name: payload.contactPerson || payload.firmName || null,
      firm: payload.firmName || null,
      contactEmail: payload.contactEmail || null,
    },
    _actor: actor,
  });
};

const updateAppointment = async (tenant, projectId, appId, payload) => {
  await _assertProjectExists(tenant._id, projectId);
  const update = {};
  if (payload.firmName || payload.contactPerson || payload.contactEmail) {
    update.assignee = {
      name: payload.contactPerson || null,
      firm: payload.firmName || null,
      contactEmail: payload.contactEmail || null,
    };
  }
  const trail = await procurementTrailService.updateTrail(tenant._id, projectId, appId, update);
  if (!trail) throw Object.assign(new Error('Appointment not found'), { status: 404 });
  if (payload.applicable === false) {
    for (const stepKey of STEP_KEYS) {
      await procurementTrailService.reviewStep(
        tenant._id,
        projectId,
        appId,
        stepKey,
        { status: 'not_applicable', reason: payload.notApplicableReason || 'Marked not applicable' },
        null
      );
    }
    return procurementTrailService.getTrail(tenant._id, projectId, appId);
  }
  return trail;
};

const reviewAppointmentStep = async (tenant, projectId, appId, step, action, payload, actor) => {
  await _assertProjectExists(tenant._id, projectId);
  const stepKey = toCanonicalStepKey(step);
  if (!STEP_KEYS.includes(stepKey)) {
    throw Object.assign(new Error('Invalid appointment step key'), { status: 400, code: 'VALIDATION_ERROR' });
  }
  const status = action === 'approve' ? 'approved' : 'not_approved';
  return procurementTrailService.reviewStep(
    tenant._id,
    projectId,
    appId,
    stepKey,
    {
      status,
      reason: payload?.reason,
      fileIds: Array.isArray(payload?.fileIds) ? payload.fileIds : undefined,
      _actor: actor,
    },
    actor.userId
  );
};

const getAppointmentStageStatus = async (tenant, projectId) => {
  const trails = await listAppointments(tenant, projectId);
  const byRole = APPOINTMENT_TYPES.map((role) => {
    const trail = trails.find((row) => row.appointmentType === role);
    const steps = STEP_KEYS.map((stepKey) => {
      const step = trail?.steps?.find((s) => s.stepKey === stepKey);
      return {
        stepKey,
        status: step?.status || 'pending',
        reason: step?.reason || null,
      };
    });
    const complete = steps.every((s) => s.status === 'approved' || s.status === 'not_applicable');
    return {
      role,
      appointmentId: trail?._id || null,
      exists: Boolean(trail),
      complete,
      steps,
    };
  });
  const summary = {
    totalRoles: byRole.length,
    completeRoles: byRole.filter((r) => r.complete).length,
    incompleteRoles: byRole.filter((r) => !r.complete).length,
    gatePassed: byRole.every((r) => r.complete),
  };
  return { roles: byRole, summary };
};

const listInterimPaymentCertificates = async (tenant, projectId) => {
  await _assertProjectExists(tenant._id, projectId);
  return projectRepo.findPayments(tenant._id, projectId).then((rows) =>
    rows
      .filter((row) => row.contractType === 'construction')
      .map((row) => serializeInterimPaymentCertificate(row))
  );
};

const listBillingPeriods = async (tenant, projectId) => {
  await _assertProjectExists(tenant._id, projectId);
  const readiness = await getStage7Readiness(tenant, projectId);
  const certificates = await listInterimPaymentCertificates(tenant, projectId);
  const certificateByPeriod = new Map();
  for (const row of certificates) {
    const period = String(row.billingPeriod || '').trim();
    if (!period) continue;
    if (!certificateByPeriod.has(period)) {
      certificateByPeriod.set(period, []);
    }
    certificateByPeriod.get(period).push(row);
  }
  return (readiness.periods || []).map((row) => {
    const certs = certificateByPeriod.get(row.period) || [];
    const approvedCertificates = certs.filter((c) => c.status === 'approved').length;
    const submittedCertificates = certs.filter((c) => c.status === 'submitted').length;
    const rejectedCertificates = certs.filter((c) => c.status === 'rejected').length;
    const latestCertificate = certs
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    return {
      period: row.period,
      progressReportPresent: row.progressReportPresent,
      safetyReportPresent: row.safetyReportPresent,
      cashFlowPresent: row.cashFlowPresent,
      meetingMinutesPresent: row.meetingMinutesPresent,
      evidenceImageCount: row.evidenceImageCount,
      evidenceMinimum: row.evidenceMinimum,
      evidenceSufficient: row.evidenceSufficient,
      paymentCertificateCount: certs.length,
      approvedCertificates,
      submittedCertificates,
      rejectedCertificates,
      latestCertificateId: latestCertificate?._id?.toString?.() || null,
      reportingComplete: row.reportingComplete,
    };
  });
};

const getBillingPeriodDetail = async (tenant, projectId, period) => {
  const normalizedPeriod = String(period || '').trim();
  if (!/^\d{4}-\d{2}$/.test(normalizedPeriod)) {
    throw Object.assign(new Error('Invalid billing period format. Use YYYY-MM'), {
      status: 400,
      code: 'VALIDATION_ERROR',
    });
  }
  const periods = await listBillingPeriods(tenant, projectId);
  const detail = periods.find((row) => row.period === normalizedPeriod);
  if (!detail) {
    throw Object.assign(new Error('Billing period not found'), { status: 404 });
  }
  return detail;
};

const listCloseOutReports = async (tenant, projectId) => {
  const reports = await listDeliverables(tenant, projectId, 9);
  return reports
    .filter((row) => Object.values(CLOSE_OUT_REPORT_CATEGORIES).includes(row.category))
    .map((row) => ({
      ...row,
      reportType: Object.entries(CLOSE_OUT_REPORT_CATEGORIES).find(([, category]) => category === row.category)?.[0] || null,
    }));
};

const createCloseOutReport = async (tenant, projectId, payload, actorUserId) => {
  const category = CLOSE_OUT_REPORT_CATEGORIES[payload.reportType];
  if (!category) {
    throw Object.assign(new Error('Invalid close-out report type'), { status: 400, code: 'VALIDATION_ERROR' });
  }
  const key = categoryToDeliverableKey(category);
  return uploadDeliverable(tenant, projectId, key, payload.fileId, actorUserId, 9);
};

const approveCloseOutReport = async (tenant, projectId, reportType, actor) => {
  const category = CLOSE_OUT_REPORT_CATEGORIES[reportType];
  if (!category) {
    throw Object.assign(new Error('Invalid close-out report type'), { status: 400, code: 'VALIDATION_ERROR' });
  }
  return approveDeliverable(tenant, projectId, categoryToDeliverableKey(category), actor, 9);
};

const rejectCloseOutReport = async (tenant, projectId, reportType, reason, actor) => {
  const category = CLOSE_OUT_REPORT_CATEGORIES[reportType];
  if (!category) {
    throw Object.assign(new Error('Invalid close-out report type'), { status: 400, code: 'VALIDATION_ERROR' });
  }
  return rejectDeliverable(tenant, projectId, categoryToDeliverableKey(category), reason, actor, 9);
};

const getInterimPaymentCertificate = async (tenant, projectId, pcId) => {
  await _assertProjectExists(tenant._id, projectId);
  const record = await projectRepo.findPaymentById(pcId, tenant._id, projectId);
  if (!record || record.contractType !== 'construction') {
    throw Object.assign(new Error('Interim payment certificate not found'), { status: 404 });
  }
  const readiness = await getInterimCertificateReadiness(
    tenant,
    projectId,
    Number(record.amount || 0),
    String(record.billingPeriod || '')
  );
  return serializeInterimPaymentCertificate(record, readiness);
};

const createInterimPaymentCertificate = async (tenant, projectId, data, userId) => {
  const readiness = await getInterimCertificateReadiness(
    tenant,
    projectId,
    Number(data.amount || 0),
    String(data.billingPeriod || '')
  );
  const payment = await projectRepo.createPayment({
    tenantId: tenant._id,
    projectId,
    amount: data.amount,
    paymentDate: data.paymentDate,
    description: data.description || null,
    certificateNo: data.certificateNo || null,
    billingPeriod: data.billingPeriod,
    certificateFileId: data.certificateFileId || null,
    contractType: 'construction',
    status: 'submitted',
    recordedBy: userId,
  });
  await logEvent({
    tenantId: tenant._id,
    projectId,
    entityType: 'payment_certificate',
    entityId: payment._id,
    action: 'payment_cert.submitted',
    actor: { userId, role: null, name: null },
    after: payment.toObject(),
    metadata: { checksAtSubmission: readiness },
  });
  return serializeInterimPaymentCertificate(payment, readiness);
};

const approveInterimPaymentCertificate = async (tenant, projectId, pcId, actor, overrideReason) => {
  const payment = await projectRepo.findPaymentById(pcId, tenant._id, projectId);
  if (!payment || payment.contractType !== 'construction') {
    throw Object.assign(new Error('Interim payment certificate not found'), { status: 404 });
  }
  if (!['submitted', 'draft'].includes(payment.status || 'submitted')) {
    throw Object.assign(new Error('Only submitted certificates can be approved'), { status: 400 });
  }
  const readiness = await getInterimCertificateReadiness(
    tenant,
    projectId,
    Number(payment.amount || 0),
    String(payment.billingPeriod || '')
  );
  if (!readiness.allChecksPassed && String(overrideReason || '').trim().length < 3) {
    throw Object.assign(new Error('Override reason is required when readiness checks fail'), {
      status: 422,
      code: 'VALIDATION_ERROR',
    });
  }
  const before = payment.toObject();
  payment.status = 'approved';
  payment.approvedBy = actor.userId;
  payment.approvedAt = new Date();
  payment.rejectionReason = null;
  payment.overrideFlag = !readiness.allChecksPassed;
  payment.overrideReason = readiness.allChecksPassed ? null : String(overrideReason).trim();
  payment.checksAtApproval = {
    progressReportPresent: readiness.progressReportPresent,
    evidenceCount: readiness.evidenceCount,
    evidenceMinimum: readiness.evidenceMinimum,
    withinBudget: readiness.withinBudget,
  };
  await payment.save();
  await projectRepo.updateById(projectId, tenant._id, {
    $inc: { expenditureToDate: Number(payment.amount || 0) },
  });
  await logEvent({
    tenantId: tenant._id,
    projectId,
    entityType: 'payment_certificate',
    entityId: payment._id,
    action: 'payment_cert.approved',
    actor,
    before,
    after: payment.toObject(),
    overrideFlag: payment.overrideFlag,
    overrideReason: payment.overrideReason,
    checksAtTime: payment.checksAtApproval,
    evidenceCountAtTime: readiness.evidenceCount,
  });
  return serializeInterimPaymentCertificate(payment, readiness);
};

const rejectInterimPaymentCertificate = async (tenant, projectId, pcId, actor, reason) => {
  const payment = await projectRepo.findPaymentById(pcId, tenant._id, projectId);
  if (!payment || payment.contractType !== 'construction') {
    throw Object.assign(new Error('Interim payment certificate not found'), { status: 404 });
  }
  if (!['submitted', 'draft'].includes(payment.status || 'submitted')) {
    throw Object.assign(new Error('Only submitted certificates can be rejected'), { status: 400 });
  }
  if (String(reason || '').trim().length < 3) {
    throw Object.assign(new Error('Rejection reason is required'), {
      status: 422,
      code: 'VALIDATION_ERROR',
    });
  }
  const before = payment.toObject();
  payment.status = 'rejected';
  payment.rejectionReason = String(reason).trim();
  payment.approvedBy = null;
  payment.approvedAt = null;
  payment.overrideFlag = false;
  payment.overrideReason = null;
  await payment.save();
  await logEvent({
    tenantId: tenant._id,
    projectId,
    entityType: 'payment_certificate',
    entityId: payment._id,
    action: 'payment_cert.rejected',
    actor,
    before,
    after: payment.toObject(),
  });
  return serializeInterimPaymentCertificate(payment);
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
  listDeliverables,
  getDeliverable,
  uploadDeliverable,
  approveDeliverable,
  rejectDeliverable,
  listAppointments,
  createAppointment,
  updateAppointment,
  reviewAppointmentStep,
  getAppointmentStageStatus,
  listInterimPaymentCertificates,
  getInterimPaymentCertificate,
  createInterimPaymentCertificate,
  approveInterimPaymentCertificate,
  rejectInterimPaymentCertificate,
  listBillingPeriods,
  getBillingPeriodDetail,
  listCloseOutReports,
  createCloseOutReport,
  approveCloseOutReport,
  rejectCloseOutReport,
  getBudgetSummary,
  getServiceCategorySummary,
  getIdpData,
};
