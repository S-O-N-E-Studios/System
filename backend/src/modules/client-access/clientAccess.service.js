const mongoose = require('mongoose');
const clientAccessRepo = require('./clientAccess.repository');
const Project = require('../projects/project.model');
const { sendClientActivationEmail } = require('../../utils/email');
const { generateSecureToken, hashToken } = require('../../utils/generateToken');

const listAccess = async (tenant) => {
  return clientAccessRepo.findAll(tenant._id);
};

const assertProjectsBelongToTenant = async (tenantId, projectIds) => {
  const count = await Project.countDocuments({
    tenantId,
    _id: { $in: projectIds.map((id) => new mongoose.Types.ObjectId(id)) },
    deletedAt: null,
  });
  if (count !== projectIds.length) {
    throw Object.assign(new Error('One or more projects are invalid for this organisation'), {
      status: 400,
    });
  }
};

const grantAccess = async (tenant, data, userId) => {
  await assertProjectsBelongToTenant(tenant._id, data.projectIds);

  const rawToken = generateSecureToken();
  const activationTokenHash = hashToken(rawToken);

  const doc = await clientAccessRepo.create({
    tenantId: tenant._id,
    clientEmail: data.clientEmail,
    projectIds: data.projectIds,
    canApproveDocuments: data.canApproveDocuments,
    activationTokenHash,
    expiresAt: data.expiresAt,
    grantedBy: userId,
    status: 'pending',
  });

  const projects = await Project.find({
    _id: { $in: data.projectIds },
    tenantId: tenant._id,
  })
    .select('name')
    .lean();

  await sendClientActivationEmail(
    data.clientEmail,
    rawToken,
    {
      orgName:      tenant.name,
      projectNames: projects.map((p) => p.name),
      expiresAt:    data.expiresAt,
    },
    tenant
  );

  const safe = doc.toObject();
  delete safe.activationTokenHash;
  return safe;
};

const createExtendAccess = async (tenant, accessId, data) => {
  const existing = await clientAccessRepo.findOneDoc(accessId, tenant._id);
  if (!existing) {
    throw Object.assign(new Error('Access record not found'), { status: 404 });
  }
  if (existing.status === 'revoked') {
    throw Object.assign(new Error('Cannot extend revoked access'), { status: 409 });
  }

  const updates = { expiresAt: data.expiresAt };
  if (existing.status === 'expired' && existing.clientUserId) {
    updates.status = 'active';
  }

  return clientAccessRepo.updateById(accessId, tenant._id, updates);
};

const revokeAccess = async (tenant, accessId) => {
  const existing = await clientAccessRepo.findOneDoc(accessId, tenant._id);
  if (!existing) {
    throw Object.assign(new Error('Access record not found'), { status: 404 });
  }

  return clientAccessRepo.updateById(accessId, tenant._id, { status: 'revoked' });
};

module.exports = {
  listAccess,
  grantAccess,
  createExtendAccess,
  revokeAccess,
};
