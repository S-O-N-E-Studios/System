const mongoose = require("mongoose");
const { connect, disconnect } = require("../src/config/database");
const Tenant = require("../src/modules/tenants/tenant.model");
const Project = require("../src/modules/projects/project.model");
const VariationOrder = require("../src/modules/stage-gate/variationOrder.model");
const variationOrderService = require("../src/modules/stage-gate/variationOrder.service");

jest.setTimeout(300000);

describe("variation workflow", () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await disconnect();
  });

  afterEach(async () => {
    await Promise.all([
      VariationOrder.deleteMany({}),
      Project.deleteMany({}),
      Tenant.deleteMany({}),
    ]);
  });

  it("recalculates contractValueAdjusted from all approved variations", async () => {
    const tenant = await Tenant.create({
      slug: "mvp-tenant",
      name: "MVP Tenant",
      orgType: "private_firm",
      status: "active",
    });

    const userId = new mongoose.Types.ObjectId();
    const project = await Project.create({
      tenantId: tenant._id,
      name: "Project A",
      serviceCategory: "roads_stormwater",
      contractValueOriginal: 1000000,
      contractValueAdjusted: 1000000,
      createdBy: userId,
    });

    await VariationOrder.create({
      tenantId: tenant._id,
      projectId: project._id,
      description: "Already approved increase",
      reason: "Scope increase",
      estimatedAmount: 120000,
      approvedAmount: 120000,
      status: "approved",
      createdBy: userId,
      approvedBy: userId,
      approvedAt: new Date(),
    });

    const pending = await VariationOrder.create({
      tenantId: tenant._id,
      projectId: project._id,
      description: "Pending variation",
      reason: "Design change",
      estimatedAmount: -50000,
      status: "pending_approval",
      createdBy: userId,
    });

    await variationOrderService.approve(
      tenant._id,
      project._id,
      pending._id,
      userId,
      -45000
    );

    const refreshedProject = await Project.findById(project._id).lean();
    expect(refreshedProject.contractValueAdjusted).toBe(1075000);
    expect(refreshedProject.contractValueHistory.length).toBe(1);
    expect(refreshedProject.contractValueHistory[0].newValue).toBe(1075000);
  });
});

