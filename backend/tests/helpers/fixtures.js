const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../../src/models/User');
const Tenant = require('../../src/models/Tenant');
const Project = require('../../src/models/Project');
const TemporaryAccess = require('../../src/models/TemporaryAccess');

process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-chars-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-minimum-32-chars';
process.env.JWT_EXPIRES_IN = '15m';
process.env.BCRYPT_SALT_ROUNDS = '4'; // Fast for tests
process.env.NODE_ENV = 'test';

let projectRefCodeCounter = 1;

/**
 * Create a tenant + org admin user and return token + IDs
 */
const createTenantWithAdmin = async (overrides = {}) => {
  const tenant = await Tenant.create({
    slug: overrides.slug || 'test-org',
    name: overrides.name || 'Test Organisation',
    orgType: overrides.orgType || 'provincial_gov',
    status: 'active',
    localMunicipalities: overrides.localMunicipalities || [
      'Victor Khanye', 'Emalahleni', 'Steve Tshwete',
    ],
  });

  const admin = await User.create({
    email: overrides.adminEmail || 'admin@test.co.za',
    fullName: 'Test Admin',
    passwordHash: 'Password123!',
    tenants: [{ tenantId: tenant._id, tenantSlug: tenant.slug, role: 'ORG_ADMIN' }],
  });

  const token = jwt.sign(
    { id: admin._id, email: admin.email, role: 'ORG_ADMIN', tenantSlug: tenant.slug, tenantId: tenant._id },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return { tenant, admin, token };
};

/**
 * Create a PM user in a tenant and return token
 */
const createPM = async (tenantId, tenantSlug) => {
  const pm = await User.create({
    email: `pm-${Date.now()}@test.co.za`,
    fullName: 'Test PM',
    passwordHash: 'Password123!',
    tenants: [{ tenantId, tenantSlug, role: 'PM' }],
  });

  const token = jwt.sign(
    { id: pm._id, email: pm.email, role: 'PM', tenantSlug, tenantId },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return { pm, token };
};

/**
 * Create a sample project
 */
const createProject = async (tenantId, overrides = {}) => {
  const year = new Date().getFullYear();
  const refCode = overrides.refCode || `PRJ-${year}-${String(projectRefCodeCounter++).padStart(3, '0')}`;

  return Project.create({
    tenantId,
    refCode,
    name: overrides.name || 'Test Project',
    serviceCategory: overrides.serviceCategory || 'water_sanitation',
    localMunicipality: overrides.localMunicipality || 'Emalahleni',
    contractValue: overrides.contractValue || 100000_00, // R1,000,000 in cents
    currentStage: overrides.currentStage || 1,
    status: overrides.status || 'active',
    createdBy: overrides.createdBy || new mongoose.Types.ObjectId(),
  });
};

/**
 * Upload a file doc (bypasses S3)
 */
const createFileDoc = async (tenantId, projectId, overrides = {}) => {
  const File = require('../../src/models/File');
  return File.create({
    tenantId,
    projectId,
    originalName: overrides.originalName || 'test-document.pdf',
    storagePath: overrides.storagePath || `tenants/test/projects/${projectId}/test.pdf`,
    mimeType: 'application/pdf',
    sizeBytes: 1024,
    stage: overrides.stage || 1,
    category: overrides.category || 'scoping-report',
    uploadedBy: overrides.uploadedBy || new mongoose.Types.ObjectId(),
    clientVisible: overrides.clientVisible !== undefined ? overrides.clientVisible : false,
  });
};

/**
 * Create all required Stage 1 documents for a project
 */
const uploadStage1Docs = async (tenantId, projectId, uploadedBy) => {
  const categories = ['scoping-report', 'quotation', 'appointment-letter'];
  return Promise.all(categories.map(category =>
    createFileDoc(tenantId, projectId, { stage: 1, category, uploadedBy })
  ));
};

/**
 * Create a CLIENT_TEMP user with an active TemporaryAccess record
 */
const createClientTempUser = async (tenantId, tenantSlug, projectIds, daysValid = 30) => {
  const expiresAt = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000);

  const access = await TemporaryAccess.create({
    tenantId,
    grantedBy: new mongoose.Types.ObjectId(),
    clientEmail: `client-${Date.now()}@external.co.za`,
    projectIds,
    expiresAt,
    status: 'active',
    activatedAt: new Date(),
  });

  const clientUser = await User.create({
    email: access.clientEmail,
    fullName: 'External Client',
    passwordHash: 'Password123!',
    tenants: [{ tenantId, tenantSlug, role: 'CLIENT_TEMP' }],
    temporaryAccessId: access._id,
  });

  access.clientUserId = clientUser._id;
  await access.save();

  const token = jwt.sign(
    {
      id: clientUser._id,
      email: clientUser.email,
      role: 'CLIENT_TEMP',
      tenantSlug,
      tenantId,
      temporaryAccessId: access._id,
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  return { clientUser, access, token };
};

module.exports = {
  createTenantWithAdmin,
  createPM,
  createProject,
  createFileDoc,
  uploadStage1Docs,
  createClientTempUser,
};
