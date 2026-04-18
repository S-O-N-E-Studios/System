const service = require('./procurementTrail.service');
const { sendSuccess, sendCreated } = require('../../utils/apiResponse');

const list = async (req, res) => {
  const trails = await service.listTrails(req.tenant._id, req.params.id);
  return sendSuccess(res, { trails });
};

const create = async (req, res) => {
  const trail = await service.createTrail(req.tenant._id, req.params.id, {
    ...req.body,
    _actor: {
      userId: req.user.sub,
      name: req.user.fullName || req.user.name || null,
      role: req.tenantMembership?.role || req.user.role,
    },
    _req: req,
  });
  return sendCreated(res, { trail });
};

const getOne = async (req, res) => {
  const trail = await service.getTrail(req.tenant._id, req.params.id, req.params.trailId);
  if (!trail) {
    return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Procurement trail not found' });
  }
  return sendSuccess(res, { trail });
};

const update = async (req, res) => {
  const trail = await service.updateTrail(req.tenant._id, req.params.id, req.params.trailId, req.body);
  if (!trail) {
    return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Procurement trail not found' });
  }
  return sendSuccess(res, { trail });
};

const reviewStep = async (req, res) => {
  const trail = await service.reviewStep(
    req.tenant._id,
    req.params.id,
    req.params.trailId,
    req.params.stepKey,
    {
      ...req.body,
      _actor: {
        name: req.user.fullName || req.user.name || null,
        role: req.tenantMembership?.role || req.user.role,
      },
      _req: req,
    },
    req.user.sub
  );
  return sendSuccess(res, { trail });
};

module.exports = {
  list,
  create,
  getOne,
  update,
  reviewStep,
};
