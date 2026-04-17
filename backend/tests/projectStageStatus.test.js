jest.mock('../src/modules/projects/project.repository', () => ({
  findByIdLean: jest.fn(),
}));

jest.mock('../src/modules/stage-gate/stageGate.service', () => ({
  checkStageGateWithActivities: jest.fn(),
}));

jest.mock('../src/modules/files/file.model', () => ({
  find: jest.fn(),
}));

jest.mock('../src/modules/stage-gate/variationOrder.model', () => ({
  countDocuments: jest.fn(),
}));

jest.mock('../src/modules/calendar/calendarEvent.model', () => ({}));

const projectService = require('../src/modules/projects/project.service');
const projectRepo = require('../src/modules/projects/project.repository');
const stageGateSvc = require('../src/modules/stage-gate/stageGate.service');
const File = require('../src/modules/files/file.model');
const VariationOrder = require('../src/modules/stage-gate/variationOrder.model');
const { WORKFLOW_PROFILES } = require('../src/constants/workflowProfiles');

describe('project service - getStageStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns workflow profile, stage requirements, and stage7 readiness for municipal stage 7', async () => {
    projectRepo.findByIdLean.mockResolvedValue({
      _id: '507f191e810c19729de860ea',
      currentStage: 7,
    });
    stageGateSvc.checkStageGateWithActivities.mockResolvedValue({
      gatePassed: false,
      missing: [{ category: 'payment-certificate' }],
      activitiesMissingImages: [
        {
          activityId: '507f191e810c19729de86111',
          name: 'Site Inspection A',
          imageCount: 1,
          required: 3,
        },
      ],
    });
    File.find.mockReturnValue({
      select: () => ({
        lean: async () => ([
          { category: 'progress-report', billingPeriod: '2026-04' },
          { category: 'safety-report', billingPeriod: '2026-04' },
          { category: 'monthly-cash-flow', billingPeriod: '2026-04' },
          { category: 'payment-certificate', billingPeriod: '2026-04' },
          { category: 'site-image', billingPeriod: '2026-04' },
          { category: 'site-image', billingPeriod: '2026-04' },
          { category: 'site-image', billingPeriod: '2026-04' },
        ]),
      }),
    });
    VariationOrder.countDocuments.mockResolvedValue(2);

    const tenant = {
      _id: '507f191e810c19729de860eb',
      orgType: 'provincial_gov',
      workflowProfile: WORKFLOW_PROFILES.MUNICIPAL_V8,
      evidenceConfig: { minImagesPerBillingPeriod: 3 },
    };

    const result = await projectService.getStageStatus(tenant, '507f191e810c19729de860ea');

    expect(result.workflowProfile).toBe(WORKFLOW_PROFILES.MUNICIPAL_V8);
    expect(result.stageRequirements).toBeTruthy();
    expect(result.stageRequirements[7]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: 'progress-report' }),
      ]),
    );
    expect(result.stage7Readiness).toBeTruthy();
    expect(result.stage7Readiness.pendingVariationCount).toBe(2);
    expect(result.activitiesMissingImages).toEqual([
      {
        activityId: '507f191e810c19729de86111',
        name: 'Site Inspection A',
        imageCount: 1,
        required: 3,
      },
    ]);
    expect(result.stage7Readiness.periods[0]).toMatchObject({
      period: '2026-04',
      progressReportPresent: true,
      safetyReportPresent: true,
      cashFlowPresent: true,
      paymentCertificateCount: 1,
      evidenceImageCount: 3,
      evidenceMinimum: 3,
      reportingComplete: true,
      evidenceSufficient: true,
    });
  });

  it('returns private profile and null stage7 readiness for non-stage7 project', async () => {
    projectRepo.findByIdLean.mockResolvedValue({
      _id: '507f191e810c19729de860fa',
      currentStage: 3,
    });
    stageGateSvc.checkStageGateWithActivities.mockResolvedValue({
      gatePassed: true,
      missing: [],
      activitiesMissingImages: [],
    });

    const tenant = {
      _id: '507f191e810c19729de860fb',
      orgType: 'private_company',
      workflowProfile: WORKFLOW_PROFILES.PRIVATE_V8,
    };

    const result = await projectService.getStageStatus(tenant, '507f191e810c19729de860fa');

    expect(result.workflowProfile).toBe(WORKFLOW_PROFILES.PRIVATE_V8);
    expect(result.stageRequirements).toBeTruthy();
    expect(result.stage7Readiness).toBeNull();
    expect(File.find).not.toHaveBeenCalled();
    expect(VariationOrder.countDocuments).not.toHaveBeenCalled();
  });
});
