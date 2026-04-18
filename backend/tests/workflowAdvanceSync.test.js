jest.mock('../src/modules/projects/project.model', () => ({
  findOne: jest.fn(),
}));

jest.mock('../src/modules/files/file.model', () => ({
  find: jest.fn(),
}));

jest.mock('../src/modules/stage-gate/stageGate.service', () => ({
  checkStageGate: jest.fn(),
  checkStageGateWithActivities: jest.fn(),
}));

jest.mock('../src/modules/penalties/penalty.model', () => ({
  find: jest.fn(),
}));

jest.mock('../src/modules/stage-gate/stageApproval.model', () => ({
  findOne: jest.fn(),
}));

jest.mock('../src/constants/workflowProfiles', () => ({
  getStageDocumentSpecsForTenant: jest.fn(() => ({})),
}));

jest.mock('../src/modules/procurement-trails/procurementTrail.model', () => ({
  ProcurementTrail: {
    find: jest.fn(),
  },
  APPOINTMENT_TYPES: [
    'principal_agent',
    'land_surveyor',
    'geo_technical_engineer',
    'environmental_specialist',
    'architect',
    'structural_engineer',
  ],
  STEP_KEYS: ['advert', 'recommendations', 'approval', 'appointment_letter', 'sla'],
}));

const Project = require('../src/modules/projects/project.model');
const File = require('../src/modules/files/file.model');
const stageGateService = require('../src/modules/stage-gate/stageGate.service');
const Penalty = require('../src/modules/penalties/penalty.model');
const StageApproval = require('../src/modules/stage-gate/stageApproval.model');
const workflowService = require('../src/modules/workflow/workflow.service');

describe('workflow service - legacy synchronization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    File.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([]),
    });
    stageGateService.checkStageGate.mockResolvedValue({ gatePassed: true, missing: [] });
    stageGateService.checkStageGateWithActivities.mockResolvedValue({ gatePassed: true, missing: [] });
    Penalty.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([]),
    });
    StageApproval.findOne.mockImplementation((query) => ({
      lean: jest.fn().mockResolvedValue(
        query?.stage === 9 && String(query?.documentCategory || '').startsWith('closeout-report-')
          ? { _id: '507f191e810c19729de861ff', approvalStatus: 'approved' }
          : null
      ),
    }));
  });

  it('syncs currentStage when advancing from stageTopLevel 2 to 3', async () => {
    const project = {
      _id: '507f191e810c19729de860e1',
      stageTopLevel: 2,
      currentStage: 3,
      stageHistory: [],
      status: 'active',
      save: jest.fn().mockResolvedValue(undefined),
    };
    Project.findOne.mockResolvedValue(project);

    const result = await workflowService.advanceWorkflow(
      { _id: '507f191e810c19729de860e2' },
      '507f191e810c19729de860e1',
      '507f191e810c19729de860e3',
    );

    expect(result.advanced).toBe(true);
    expect(result.newStageTopLevel).toBe(3);
    expect(result.newLegacyStage).toBe(4);
    expect(project.currentStage).toBe(4);
    expect(project.stageCheckpoint).toBe('stage3.project_execution_gate');
    expect(project.save).toHaveBeenCalledTimes(1);
  });

  it('syncs currentStage when advancing from stageTopLevel 4 to 5', async () => {
    const project = {
      _id: '507f191e810c19729de860ea',
      stageTopLevel: 4,
      currentStage: 7,
      stageHistory: [],
      status: 'active',
      save: jest.fn().mockResolvedValue(undefined),
    };
    Project.findOne.mockResolvedValue(project);

    const result = await workflowService.advanceWorkflow(
      { _id: '507f191e810c19729de860eb' },
      '507f191e810c19729de860ea',
      '507f191e810c19729de860ec',
    );

    expect(result.advanced).toBe(true);
    expect(result.previousStageTopLevel).toBe(4);
    expect(result.newStageTopLevel).toBe(5);
    expect(result.previousLegacyStage).toBe(7);
    expect(result.newLegacyStage).toBe(8);
    expect(result.completed).toBe(false);
    expect(project.stageCheckpoint).toBe('stage5.closure_gate');
    expect(project.currentStage).toBe(8);
    expect(project.status).toBe('active');
    expect(project.save).toHaveBeenCalledTimes(1);
  });

  it('marks project complete when advancing from stageTopLevel 5', async () => {
    const project = {
      _id: '507f191e810c19729de860fa',
      stageTopLevel: 5,
      currentStage: 9,
      stageHistory: [],
      status: 'active',
      completionDate: null,
      save: jest.fn().mockResolvedValue(undefined),
    };
    Project.findOne.mockResolvedValue(project);

    const result = await workflowService.advanceWorkflow(
      { _id: '507f191e810c19729de860fb' },
      '507f191e810c19729de860fa',
      '507f191e810c19729de860fc',
    );

    expect(result.advanced).toBe(true);
    expect(result.previousStageTopLevel).toBe(5);
    expect(result.newStageTopLevel).toBe(5);
    expect(result.previousLegacyStage).toBe(9);
    expect(result.newLegacyStage).toBe(10);
    expect(result.completed).toBe(true);
    expect(project.stageCheckpoint).toBe('complete.read_only');
    expect(project.currentStage).toBe(10);
    expect(project.status).toBe('complete');
    expect(project.completionDate).toBeInstanceOf(Date);
    expect(project.save).toHaveBeenCalledTimes(1);
  });
});
