const { ProcurementTrail, STEP_KEYS } = require('./procurementTrail.model');
const { logEvent } = require('../audit/audit.service');

const isTrailComplete = (trail) => {
  const stepsByKey = new Map((trail.steps || []).map((step) => [step.stepKey, step]));
  let approvedCount = 0;
  for (const key of STEP_KEYS) {
    const step = stepsByKey.get(key);
    if (!step) return false;
    if (step.status === 'not_approved') return false;
    if (step.status === 'approved') approvedCount += 1;
  }
  return approvedCount > 0;
};

const listTrails = async (tenantId, projectId) =>
  ProcurementTrail.find({ tenantId, projectId }).sort({ appointmentType: 1 }).lean();

const createTrail = async (tenantId, projectId, payload) => {
  const trail = await ProcurementTrail.create({
    tenantId,
    projectId,
    appointmentType: payload.appointmentType,
    assignee: payload.assignee || {},
    steps:
      payload.steps ||
      STEP_KEYS.map((stepKey) => ({
        stepKey,
      })),
    isComplete: false,
  });
  await logEvent({
    tenantId,
    projectId,
    entityType: 'procurement_trail',
    entityId: trail._id,
    action: 'procurement_trail.created',
    actor: {
      userId: payload._actor?.userId,
      name: payload._actor?.name,
      role: payload._actor?.role,
    },
    after: trail.toObject(),
    req: payload._req || null,
  });
  return trail;
};

const getTrail = async (tenantId, projectId, trailId) =>
  ProcurementTrail.findOne({ _id: trailId, tenantId, projectId });

const updateTrail = async (tenantId, projectId, trailId, payload) =>
  {
    const trail = await ProcurementTrail.findOne({ _id: trailId, tenantId, projectId });
    if (!trail) return null;
    Object.assign(trail, payload);
    trail.isComplete = isTrailComplete(trail);
    await trail.save();
    return trail;
  };

const reviewStep = async (tenantId, projectId, trailId, stepKey, payload, reviewerId) => {
  if (!STEP_KEYS.includes(stepKey)) {
    throw Object.assign(new Error('Invalid procurement step key'), { status: 400 });
  }
  if (!payload?.status || !['approved', 'not_approved', 'not_applicable'].includes(payload.status)) {
    throw Object.assign(new Error('Invalid procurement step status'), { status: 400 });
  }
  if (payload.status === 'not_approved' && String(payload.reason || '').trim().length < 3) {
    throw Object.assign(new Error('Rejection reason is required when marking a step as not approved'), {
      status: 422,
      code: 'VALIDATION_ERROR',
    });
  }
  const trail = await ProcurementTrail.findOne({ _id: trailId, tenantId, projectId });
  if (!trail) {
    throw Object.assign(new Error('Procurement trail not found'), { status: 404 });
  }
  const before = trail.toObject();
  const idx = trail.steps.findIndex((step) => step.stepKey === stepKey);
  if (idx === -1) {
    trail.steps.push({
      stepKey,
      status: payload.status,
      reason: payload.reason || null,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      fileIds: payload.fileIds || [],
    });
  } else {
    trail.steps[idx].status = payload.status;
    trail.steps[idx].reason = payload.reason || null;
    trail.steps[idx].reviewedBy = reviewerId;
    trail.steps[idx].reviewedAt = new Date();
    if (Array.isArray(payload.fileIds)) trail.steps[idx].fileIds = payload.fileIds;
  }
  trail.isComplete = isTrailComplete(trail);
  await trail.save();
  await logEvent({
    tenantId,
    projectId,
    entityType: 'procurement_step',
    entityId: trail._id,
    action: 'procurement_step.reviewed',
    actor: {
      userId: reviewerId,
      name: payload._actor?.name,
      role: payload._actor?.role,
    },
    before,
    after: trail.toObject(),
    req: payload._req || null,
  });
  return trail;
};

module.exports = {
  listTrails,
  createTrail,
  getTrail,
  updateTrail,
  reviewStep,
};
