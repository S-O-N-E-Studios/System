const mongoose = require("mongoose");
const { connect, disconnect } = require("../src/config/database");
const Tenant = require("../src/modules/tenants/tenant.model");
const Project = require("../src/modules/projects/project.model");
const File = require("../src/modules/files/file.model");
const StageApproval = require("../src/modules/stage-gate/stageApproval.model");
const CalendarEvent = require("../src/modules/calendar/calendarEvent.model");
const stageGateController = require("../src/modules/stage-gate/stageGate.controller");

jest.setTimeout(30000);

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("stage approval sync", () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await disconnect();
  });

  afterEach(async () => {
    await Promise.all([
      CalendarEvent.deleteMany({}),
      StageApproval.deleteMany({}),
      File.deleteMany({}),
      Project.deleteMany({}),
      Tenant.deleteMany({}),
    ]);
  });

  it("approveDocument syncs file state and creates calendar event", async () => {
    const tenant = await Tenant.create({
      slug: "approval-tenant",
      name: "Approval Tenant",
      orgType: "private_firm",
      status: "active",
    });
    const userId = new mongoose.Types.ObjectId();
    const project = await Project.create({
      tenantId: tenant._id,
      name: "Project A",
      serviceCategory: "Roads and Stormwater",
      contractValueOriginal: 1000000,
      contractValueAdjusted: 1000000,
      createdBy: userId,
    });
    const file = await File.create({
      tenantId: tenant._id,
      projectId: project._id,
      originalName: "pdr.pdf",
      storagePath: "s3://bucket/pdr.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1000,
      category: "preliminary-design-report",
      stage: 2,
      approvalStatus: "pending",
      uploadedBy: userId,
    });
    const approval = await StageApproval.create({
      tenantId: tenant._id,
      projectId: project._id,
      stage: 2,
      documentCategory: "preliminary-design-report",
      fileId: file._id,
      approvalStatus: "pending",
    });

    const req = {
      tenant: { _id: tenant._id },
      user: { sub: userId },
      params: { id: project._id.toString(), approvalId: approval._id.toString() },
    };
    const res = makeRes();

    await stageGateController.approveDocument(req, res);

    const refreshedFile = await File.findById(file._id).lean();
    const refreshedApproval = await StageApproval.findById(approval._id).lean();
    const events = await CalendarEvent.find({
      tenantId: tenant._id,
      projectId: project._id,
      eventType: "document_approved",
    }).lean();

    expect(refreshedApproval.approvalStatus).toBe("approved");
    expect(refreshedFile.approvalStatus).toBe("approved");
    expect(refreshedFile.rejectionReason).toBeNull();
    expect(events.length).toBe(1);
  });

  it("rejectDocument syncs rejection reason and creates rejection event", async () => {
    const tenant = await Tenant.create({
      slug: "rejection-tenant",
      name: "Rejection Tenant",
      orgType: "private_firm",
      status: "active",
    });
    const userId = new mongoose.Types.ObjectId();
    const project = await Project.create({
      tenantId: tenant._id,
      name: "Project B",
      serviceCategory: "Roads and Stormwater",
      contractValueOriginal: 1000000,
      contractValueAdjusted: 1000000,
      createdBy: userId,
    });
    const file = await File.create({
      tenantId: tenant._id,
      projectId: project._id,
      originalName: "ddr.pdf",
      storagePath: "s3://bucket/ddr.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1000,
      category: "detailed-design-report",
      stage: 3,
      approvalStatus: "pending",
      uploadedBy: userId,
    });
    const approval = await StageApproval.create({
      tenantId: tenant._id,
      projectId: project._id,
      stage: 3,
      documentCategory: "detailed-design-report",
      fileId: file._id,
      approvalStatus: "pending",
    });

    const req = {
      tenant: { _id: tenant._id },
      user: { sub: userId },
      params: { id: project._id.toString(), approvalId: approval._id.toString() },
      body: { reason: "Insufficient detail" },
    };
    const res = makeRes();

    await stageGateController.rejectDocument(req, res);

    const refreshedFile = await File.findById(file._id).lean();
    const refreshedApproval = await StageApproval.findById(approval._id).lean();
    const events = await CalendarEvent.find({
      tenantId: tenant._id,
      projectId: project._id,
      eventType: "document_rejected",
    }).lean();

    expect(refreshedApproval.approvalStatus).toBe("rejected");
    expect(refreshedApproval.rejectionReason).toBe("Insufficient detail");
    expect(refreshedFile.approvalStatus).toBe("rejected");
    expect(refreshedFile.rejectionReason).toBe("Insufficient detail");
    expect(events.length).toBe(1);
  });
});

