const mongoose = require('mongoose');
const { connect, disconnect } = require('../src/config/database');
const Tenant = require('../src/modules/tenants/tenant.model');
const Project = require('../src/modules/projects/project.model');
const { createTrail, reviewStep } = require('../src/modules/procurement-trails/procurementTrail.service');
const { ProcurementTrail } = require('../src/modules/procurement-trails/procurementTrail.model');

jest.setTimeout(300000);

describe('procurement trail validation', () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await disconnect();
  });

  afterEach(async () => {
    await Promise.all([ProcurementTrail.deleteMany({}), Project.deleteMany({}), Tenant.deleteMany({})]);
  });

  it('requires a reason when step is marked not_approved', async () => {
    const tenant = await Tenant.create({
      slug: 'ptv-tenant',
      name: 'PTV Tenant',
      orgType: 'private_firm',
      status: 'active',
    });
    const userId = new mongoose.Types.ObjectId();
    const project = await Project.create({
      tenantId: tenant._id,
      name: 'Project A',
      serviceCategory: 'roads_stormwater',
      contractValueOriginal: 1000,
      contractValueAdjusted: 1000,
      createdBy: userId,
    });

    const trail = await createTrail(tenant._id, project._id, {
      appointmentType: 'principal_agent',
      _actor: { userId },
    });

    await expect(
      reviewStep(
        tenant._id,
        project._id,
        trail._id,
        'advert',
        { status: 'not_approved', reason: '' },
        userId,
      ),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' });
  });
});
