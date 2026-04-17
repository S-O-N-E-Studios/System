import { describe, expect, it, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProjectWorkflow from './ProjectWorkflow';

const openModalSpy = vi.fn();
const closeModalSpy = vi.fn();
const addToastSpy = vi.fn();

vi.mock('@/api/workflow', () => ({
  workflowApi: {
    getWorkflow: vi.fn(),
    advanceWorkflow: vi.fn(),
    listProcurementTrails: vi.fn(),
    createProcurementTrail: vi.fn(),
    reviewProcurementStep: vi.fn(),
    listPerformance: vi.fn(),
    upsertPerformance: vi.fn(),
    listExtensionOfTime: vi.fn(),
    createExtensionOfTime: vi.fn(),
    listPenalties: vi.fn(),
    createPenalty: vi.fn(),
    listAuditLog: vi.fn(),
  },
}));

vi.mock('@/store/uiStore', () => ({
  useUiStore: () => ({
    openModal: openModalSpy,
    closeModal: closeModalSpy,
    addToast: addToastSpy,
  }),
}));

vi.mock('@/rbac/useCan', () => ({
  useCan: () => () => true,
}));

import { workflowApi } from '@/api/workflow';

function renderWorkflow() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/demo/projects/p1']}>
        <Routes>
          <Route path="/:tenantSlug/projects/:id" element={<ProjectWorkflow projectId="p1" />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ProjectWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(workflowApi.getWorkflow).mockResolvedValue({
      projectId: 'p1',
      stageTopLevel: 1,
      stageCheckpoint: 'stage1.sub_consultant_procurement',
      topLevelStages: [
        { id: 1, key: 'initiation', label: 'Initiation' },
        { id: 2, key: 'project_planning', label: 'Project Planning' },
        { id: 3, key: 'project_execution', label: 'Project Execution' },
        { id: 4, key: 'monitoring_control', label: 'Monitoring and Control' },
        { id: 5, key: 'closure', label: 'Closure' },
      ],
      gateRequirements: [],
      canAdvance: true,
    });
    vi.mocked(workflowApi.listProcurementTrails).mockResolvedValue([]);
    vi.mocked(workflowApi.listPerformance).mockResolvedValue({ latest: null, snapshots: [] });
    vi.mocked(workflowApi.listExtensionOfTime).mockResolvedValue([]);
    vi.mocked(workflowApi.listPenalties).mockResolvedValue([]);
    vi.mocked(workflowApi.listAuditLog).mockResolvedValue({ entries: [], page: 1, limit: 6, total: 0 });
    vi.mocked(workflowApi.advanceWorkflow).mockResolvedValue({});
  });

  it('shows New buttons for EOT and penalties even when lists are empty', async () => {
    renderWorkflow();

    const eotToggle = (await screen.findByText('Extension of Time')).closest('button');
    const penaltiesToggle = screen.getByText('Penalties').closest('button');
    expect(eotToggle).toBeTruthy();
    expect(penaltiesToggle).toBeTruthy();
    fireEvent.click(eotToggle as HTMLButtonElement);
    fireEvent.click(penaltiesToggle as HTMLButtonElement);

    expect(await screen.findAllByRole('button', { name: 'New' })).toHaveLength(2);
    expect(screen.getByText('No EOT requests.')).toBeInTheDocument();
    expect(screen.getByText('No penalties recorded.')).toBeInTheDocument();
  });

  it('renders gate blockers when workflow advance returns 422 requirements', async () => {
    vi.mocked(workflowApi.advanceWorkflow).mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 422,
        data: {
          details: {
            requirements: [
              {
                code: 'MISSING_OR_UNAPPROVED_STAGE_DOCUMENT',
                checkpoint: 'stage2.project_planning_gate',
                entityType: 'stage_document',
                entityKey: 'stage2.preliminary-design-report',
                detail: 'Stage 2: Preliminary Design Report is pending approval',
              },
            ],
          },
        },
      },
    });

    renderWorkflow();

    fireEvent.click(await screen.findByRole('button', { name: 'Run Gate Check' }));

    await waitFor(() => {
      expect(screen.getByText(/Gate blockers/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Preliminary Design Report/i)).toBeInTheDocument();
  });
});
