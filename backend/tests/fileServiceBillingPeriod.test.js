jest.mock('../src/modules/files/file.repository', () => ({
  create: jest.fn(),
  findFiles: jest.fn(),
  findById: jest.fn(),
  softDelete: jest.fn(),
}));

jest.mock('../src/modules/stage-gate/stageApproval.model', () => ({
  create: jest.fn(),
}));

jest.mock('../src/modules/projects/project.model', () => ({
  findOne: jest.fn(),
}));

const fileService = require('../src/modules/files/file.services');
const projectModel = require('../src/modules/projects/project.model');

describe('file service - stage 7 billing period runtime guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    projectModel.findOne.mockReturnValue({
      select: () => ({
        lean: async () => ({ _id: '507f191e810c19729de860ea', currentStage: 7 }),
      }),
    });
  });

  it('throws when stage 7 progress report has no billing period', async () => {
    await expect(
      fileService.registerFile(
        { _id: '507f191e810c19729de860eb' },
        {
          projectId: '507f191e810c19729de860ea',
          originalName: 'progress.pdf',
          storagePath: 'tenant/project/progress.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1000,
          stage: 7,
          category: 'progress-report',
        },
        '507f191e810c19729de860ec',
      ),
    ).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('billingPeriod is required'),
    });
  });
});
