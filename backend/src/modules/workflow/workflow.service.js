const Project = require('../projects/project.model');
const { getStageDocumentSpecsForTenant } = require('../../constants/workflowProfiles');
const { ProcurementTrail, APPOINTMENT_TYPES, STEP_KEYS } = require('../procurement-trails/procurementTrail.model');
const stageGateService = require('../stage-gate/stageGate.service');
const File = require('../files/file.model');
const Penalty = require('../penalties/penalty.model');
const StageApproval = require('../stage-gate/stageApproval.model');

const TOP_LEVEL_STAGES = [
  { id: 1, key: 'initiation', label: 'Initiation' },
  { id: 2, key: 'project_planning', label: 'Project Planning' },
  { id: 3, key: 'project_execution', label: 'Project Execution' },
  { id: 4, key: 'monitoring_control', label: 'Monitoring and Control' },
  { id: 5, key: 'closure', label: 'Closure' },
];

const TOP_LEVEL_STAGE_CHECKPOINTS = {
  1: 'stage1.sub_consultant_procurement',
  2: 'stage2.project_planning_gate',
  3: 'stage3.project_execution_gate',
  4: 'stage4.monitoring_control_gate',
  5: 'stage5.closure_gate',
};

/** Minimum legacy `currentStage` after advancing into each top-level stage (v9-aligned). */
const TOP_LEVEL_TO_LEGACY_STAGE = {
  1: 1,
  2: 2,
  3: 4,
  4: 7,
  5: 8,
};

const mapLegacyStage = (currentStage) => {
  if (currentStage <= 1) return 1;
  if (currentStage <= 3) return 2;
  if (currentStage <= 6) return 3;
  if (currentStage === 7) return 4;
  return 5;
};

const throwWorkflowGateFailed = (requirements) => {
  throw Object.assign(new Error('Workflow checkpoint requirements not met'), {
    status: 422,
    code: 'WORKFLOW_GATE_FAILED',
    requirements,
    details: {
      requirements,
    },
  });
};

const collectStage1GateRequirements = async (tenantId, projectId) => {
  const trails = await ProcurementTrail.find({ tenantId, projectId }).lean();
  const requirements = [];

  for (const appointmentType of APPOINTMENT_TYPES) {
    const trail = trails.find((t) => t.appointmentType === appointmentType);
    if (!trail) {
      requirements.push({
        code: 'MISSING_PROCUREMENT_TRAIL',
        checkpoint: 'stage1.sub_consultant_procurement',
        entityType: 'procurement_trail',
        entityKey: appointmentType,
        detail: `Procurement trail for ${appointmentType} is missing`,
      });
      continue;
    }
    for (const stepKey of STEP_KEYS) {
      const step = (trail.steps || []).find((s) => s.stepKey === stepKey);
      if (!step) {
        requirements.push({
          code: 'MISSING_PROCUREMENT_STEP',
          checkpoint: 'stage1.sub_consultant_procurement',
          entityType: 'procurement_step',
          entityKey: `${appointmentType}.${stepKey}`,
          detail: `Step ${stepKey} has not been reviewed for ${appointmentType}`,
        });
        continue;
      }
      if (step.status === 'not_approved') {
        requirements.push({
          code: 'PROCUREMENT_STEP_NOT_APPROVED',
          checkpoint: 'stage1.sub_consultant_procurement',
          entityType: 'procurement_step',
          entityKey: `${appointmentType}.${stepKey}`,
          detail: `Step ${stepKey} is marked not approved for ${appointmentType}`,
        });
      }
    }
  }

  return requirements;
};

const collectStage2GateRequirements = async (tenant, projectId) => {
  const requirements = [];
  const legacyPlanningStages = [2, 3];
  for (const stage of legacyPlanningStages) {
    const gate = await stageGateService.checkStageGate(tenant, projectId, stage);
    if (!gate.gatePassed) {
      for (const missing of gate.missing || []) {
        requirements.push({
          code: 'MISSING_OR_UNAPPROVED_STAGE_DOCUMENT',
          checkpoint: 'stage2.project_planning_gate',
          entityType: 'stage_document',
          entityKey: `stage${stage}.${missing.category}`,
          detail: `Stage ${stage}: ${missing.documentName} is ${String(missing.reason || 'missing').replace(/_/g, ' ')}`,
        });
      }
    }
  }
  return requirements;
};

const collectRequirementsForLegacyStage = async (tenant, projectId, legacyStage, checkpoint) => {
  const gate = legacyStage === 7
    ? await stageGateService.checkStageGateWithActivities(tenant, projectId, legacyStage)
    : await stageGateService.checkStageGate(tenant, projectId, legacyStage);
  const requirements = [];
  for (const missing of gate.missing || []) {
    requirements.push({
      code: 'MISSING_OR_UNAPPROVED_STAGE_DOCUMENT',
      checkpoint,
      entityType: 'stage_document',
      entityKey: `stage${legacyStage}.${missing.category}`,
      detail: `Stage ${legacyStage}: ${missing.documentName} is ${String(missing.reason || 'missing').replace(/_/g, ' ')}`,
    });
  }
  for (const item of gate.activitiesMissingImages || []) {
    requirements.push({
      code: 'ACTIVITY_IMAGE_REQUIREMENT_NOT_MET',
      checkpoint,
      entityType: 'activity',
      entityKey: String(item.activityId),
      detail: `${item.name} has ${item.imageCount} images; requires ${item.required}`,
    });
  }
  return requirements;
};

const collectStage3GateRequirements = async (tenant, projectId) => {
  const requirements = [];
  for (const legacyStage of [4, 5, 6]) {
    const part = await collectRequirementsForLegacyStage(
      tenant,
      projectId,
      legacyStage,
      'stage3.project_execution_gate',
    );
    requirements.push(...part);
  }
  const minHandover =
    tenant?.evidenceConfig?.minHandoverImages ??
    tenant?.evidenceConfig?.minImagesPerBillingPeriod ??
    3;
  const handoverImages = await File.countDocuments({
    tenantId: tenant._id,
    projectId,
    stage: 6,
    deletedAt: null,
    category: 'site-image',
  });
  if (handoverImages < minHandover) {
    requirements.push({
      code: 'SITE_HANDOVER_IMAGE_MINIMUM_NOT_MET',
      checkpoint: 'stage3.project_execution_gate',
      entityType: 'site_handover_evidence',
      entityKey: 'site-image',
      detail:
        `Site handover requires at least ${minHandover} site images (stage 6); found ${handoverImages}.`,
    });
  }
  return requirements;
};

const collectStage4GateRequirements = async (tenant, projectId) =>
  collectRequirementsForLegacyStage(tenant, projectId, 7, 'stage4.monitoring_control_gate');

const collectStage5GateRequirements = async (tenant, projectId) => {
  const stage8 = await collectRequirementsForLegacyStage(tenant, projectId, 8, 'stage5.closure_gate');
  const stage9 = await collectRequirementsForLegacyStage(tenant, projectId, 9, 'stage5.closure_gate');
  const requirements = [...stage8, ...stage9];
  const closeOutRequiredCategories = [
    'closeout-report-principal',
    'closeout-report-safety',
    'closeout-report-eia',
  ];
  for (const category of closeOutRequiredCategories) {
    const approval = await StageApproval.findOne({
      tenantId: tenant._id,
      projectId,
      stage: 9,
      documentCategory: category,
      approvalStatus: 'approved',
    }).lean();
    if (!approval) {
      requirements.push({
        code: 'CLOSEOUT_REPORT_NOT_APPROVED',
        checkpoint: 'stage5.closure_gate',
        entityType: 'closeout_report',
        entityKey: category,
        detail: `Close-out report (${category}) must be uploaded and approved before closure.`,
      });
    }
  }

  // Penalties are conditional in v9: if present, they must be approved with supporting evidence.
  const penalties = await Penalty.find({
    tenantId: tenant._id,
    projectId,
  }).lean();
  const applicablePenalties = penalties.filter((row) => row.status !== 'waived');
  for (const penalty of applicablePenalties) {
    if (penalty.status !== 'approved') {
      requirements.push({
        code: 'PENALTY_NOT_APPROVED',
        checkpoint: 'stage5.closure_gate',
        entityType: 'penalty',
        entityKey: String(penalty._id),
        detail: 'Penalty record exists but is not approved.',
      });
      continue;
    }
    if (!Array.isArray(penalty.supportingFileIds) || penalty.supportingFileIds.length === 0) {
      requirements.push({
        code: 'PENALTY_EVIDENCE_MISSING',
        checkpoint: 'stage5.closure_gate',
        entityType: 'penalty',
        entityKey: String(penalty._id),
        detail: 'Approved penalty requires at least one supporting evidence file.',
      });
    }
  }

  return requirements;
};

const getWorkflowSummary = async (tenant, projectId) => {
  const project = await Project.findOne({ _id: projectId, tenantId: tenant._id, deletedAt: null }).lean();
  if (!project) throw Object.assign(new Error('Project not found'), { status: 404 });
  const stageTopLevel = project.stageTopLevel || mapLegacyStage(Number(project.currentStage || 0));
  const specs = getStageDocumentSpecsForTenant(tenant);
  let gateRequirements = [];
  if (stageTopLevel === 1) {
    gateRequirements = await collectStage1GateRequirements(tenant._id, projectId);
  } else if (stageTopLevel === 2) {
    gateRequirements = await collectStage2GateRequirements(tenant, projectId);
  } else if (stageTopLevel === 3) {
    gateRequirements = await collectStage3GateRequirements(tenant, projectId);
  } else if (stageTopLevel === 4) {
    gateRequirements = await collectStage4GateRequirements(tenant, projectId);
  } else if (stageTopLevel === 5) {
    gateRequirements = await collectStage5GateRequirements(tenant, projectId);
  }
  return {
    projectId: project._id.toString(),
    stageTopLevel,
    stageCheckpoint: project.stageCheckpoint || 'stage1.consultant_appointment',
    topLevelStages: TOP_LEVEL_STAGES,
    legacyStage: project.currentStage,
    requiredDocuments: specs,
    gateRequirements,
    canAdvance: gateRequirements.length === 0,
  };
};

const advanceWorkflow = async (tenant, projectId, userId) => {
  const project = await Project.findOne({ _id: projectId, tenantId: tenant._id, deletedAt: null });
  if (!project) throw Object.assign(new Error('Project not found'), { status: 404 });
  const current = project.stageTopLevel || mapLegacyStage(Number(project.currentStage || 0));

  if (current === 1) {
    const requirements = await collectStage1GateRequirements(tenant._id, projectId);
    if (requirements.length > 0) {
      throwWorkflowGateFailed(requirements);
    }
  }
  if (current === 2) {
    const requirements = await collectStage2GateRequirements(tenant, projectId);
    if (requirements.length > 0) {
      throwWorkflowGateFailed(requirements);
    }
  }
  if (current === 3) {
    const requirements = await collectStage3GateRequirements(tenant, projectId);
    if (requirements.length > 0) {
      throwWorkflowGateFailed(requirements);
    }
  }
  if (current === 4) {
    const requirements = await collectStage4GateRequirements(tenant, projectId);
    if (requirements.length > 0) {
      throwWorkflowGateFailed(requirements);
    }
  }
  if (current === 5) {
    const requirements = await collectStage5GateRequirements(tenant, projectId);
    if (requirements.length > 0) {
      throwWorkflowGateFailed(requirements);
    }
  }

  const completed = current === 5;
  const next = completed ? 5 : Math.min(5, current + 1);
  const now = new Date();
  const legacyStageFloor = TOP_LEVEL_TO_LEGACY_STAGE[next] || 1;
  const previousLegacyStage = Number(project.currentStage || 0);
  const stageForSnapshot = Math.max(0, Math.min(10, previousLegacyStage));
  const stageFiles = await File.find({
    tenantId: tenant._id,
    projectId,
    stage: stageForSnapshot,
    deletedAt: null,
  }).select('_id');

  project.stageTopLevel = next;
  project.stageCheckpoint = completed
    ? 'complete.read_only'
    : (TOP_LEVEL_STAGE_CHECKPOINTS[next] || TOP_LEVEL_STAGE_CHECKPOINTS[1]);
  project.currentStage = completed
    ? 10
    : Math.max(previousLegacyStage, legacyStageFloor);
  if (completed) {
    project.status = 'complete';
    project.completionDate = now;
  } else if (next === 5) {
    project.status = 'on-hold' === project.status ? project.status : 'active';
  } else {
    project.status = 'active';
  }
  project.stageHistory = [
    ...(project.stageHistory || []),
    {
      stage: stageForSnapshot,
      advancedAt: now,
      advancedBy: userId,
      documentsSnapshot: stageFiles.map((f) => f._id),
    },
  ];
  await project.save();
  return {
    advanced: true,
    previousStageTopLevel: current,
    newStageTopLevel: next,
    stageCheckpoint: project.stageCheckpoint,
    previousLegacyStage,
    newLegacyStage: project.currentStage,
    completed,
  };
};

module.exports = {
  getWorkflowSummary,
  advanceWorkflow,
};
