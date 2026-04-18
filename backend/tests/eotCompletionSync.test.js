const mongoose = require('mongoose');
const { connect, disconnect } = require('../src/config/database');
const Tenant = require('../src/modules/tenants/tenant.model');
const Project = require('../src/modules/projects/project.model');
const ExtensionOfTime = require('../src/modules/extension-of-time/extensionOfTime.model');
const { syncProjectCompletionFromApprovedEots } = require('../src/modules/extension-of-time/extensionOfTime.service');

jest.setTimeout(300000);

describe('EOT completion date sync', () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await disconnect();
  });

  afterEach(async () => {
    await Promise.all([ExtensionOfTime.deleteMany({}), Project.deleteMany({}), Tenant.deleteMany({})]);
  });

  it('sets completionDate from baseline + sum of daysApproved on approved EOTs', async () => {
    const tenant = await Tenant.create({
      slug: 'eot-sync-tenant',
      name: 'EOT Sync Tenant',
      orgType: 'private_firm',
      status: 'active',
    });
    const userId = new mongoose.Types.ObjectId();
    const baseline = new Date('2026-06-30T12:00:00.000Z');
    const project = await Project.create({
      tenantId: tenant._id,
      name: 'Road Works',
      serviceCategory: 'roads_stormwater',
      contractValueOriginal: 1_000_000,
      contractValueAdjusted: 1_000_000,
      completionDate: baseline,
      completionDateOriginal: baseline,
      completionDateAdjusted: baseline,
      createdBy: userId,
    });

    await ExtensionOfTime.create({
      tenantId: tenant._id,
      projectId: project._id,
      createdBy: userId,
      reason: 'Weather delay',
      requestedDays: 10,
      daysApproved: 10,
      status: 'approved',
    });
    await ExtensionOfTime.create({
      tenantId: tenant._id,
      projectId: project._id,
      createdBy: userId,
      reason: 'Second window',
      requestedDays: 5,
      daysApproved: 5,
      status: 'approved',
    });

    await syncProjectCompletionFromApprovedEots(tenant._id, project._id);

    const updated = await Project.findById(project._id).lean();
    expect(updated.completionDateAdjusted.toISOString()).toBe('2026-07-15T12:00:00.000Z');
    expect(updated.completionDate.toISOString()).toBe('2026-07-15T12:00:00.000Z');
  });
});
