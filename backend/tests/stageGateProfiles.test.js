describe('stage gate service - workflow profile resolution', () => {
  const tenantId = '507f191e810c19729de860eb';
  const projectId = '507f191e810c19729de860ea';

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('uses tenant profile map/specs when tenant object is provided', async () => {
    jest.doMock('../src/modules/files/file.model', () => ({
      find: jest.fn().mockReturnValue({
        lean: async () => [],
      }),
    }));
    jest.doMock('../src/modules/stage-gate/stageApproval.model', () => ({
      findOne: jest.fn(),
    }));
    jest.doMock('../src/modules/activities/activity.model', () => ({
      find: jest.fn(),
    }));
    jest.doMock('../src/modules/tenants/tenant.model', () => ({
      findById: jest.fn(),
    }));
    jest.doMock('../src/constants/workflowProfiles', () => ({
      getStageDocumentMapForTenant: jest.fn((tenant) =>
        tenant.workflowProfile === 'private_v8'
          ? { 2: ['private-only-doc'] }
          : { 2: ['municipal-only-doc'] },
      ),
      getStageDocumentSpecsForTenant: jest.fn((tenant) =>
        tenant.workflowProfile === 'private_v8'
          ? { 2: [{ documentName: 'Private Only Doc', category: 'private-only-doc' }] }
          : { 2: [{ documentName: 'Municipal Only Doc', category: 'municipal-only-doc' }] },
      ),
    }));

    const svc = require('../src/modules/stage-gate/stageGate.service');
    const result = await svc.checkStageGate(
      { _id: tenantId, workflowProfile: 'private_v8' },
      projectId,
      2,
    );

    expect(result.requiredCategories).toEqual(['private-only-doc']);
    expect(result.requiredDocuments).toEqual([
      { documentName: 'Private Only Doc', category: 'private-only-doc' },
    ]);
    expect(result.missing).toEqual([
      {
        category: 'private-only-doc',
        documentName: 'Private Only Doc',
        reason: 'not_uploaded',
      },
    ]);
  });

  it('resolves tenant by id and fails when tenant cannot be found', async () => {
    jest.doMock('../src/modules/files/file.model', () => ({
      find: jest.fn(),
    }));
    jest.doMock('../src/modules/stage-gate/stageApproval.model', () => ({
      findOne: jest.fn(),
    }));
    jest.doMock('../src/modules/activities/activity.model', () => ({
      find: jest.fn(),
    }));
    jest.doMock('../src/constants/workflowProfiles', () => ({
      getStageDocumentMapForTenant: jest.fn(() => ({})),
      getStageDocumentSpecsForTenant: jest.fn(() => ({})),
    }));
    const findById = jest.fn().mockReturnValue({
      select: () => ({
        lean: async () => null,
      }),
    });
    jest.doMock('../src/modules/tenants/tenant.model', () => ({
      findById,
    }));

    const svc = require('../src/modules/stage-gate/stageGate.service');

    await expect(svc.checkStageGate(tenantId, projectId, 2)).rejects.toMatchObject({
      status: 404,
      message: 'Tenant not found',
    });
    expect(findById).toHaveBeenCalledWith(tenantId);
  });
});
