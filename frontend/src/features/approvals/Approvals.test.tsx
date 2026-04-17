import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Approvals from './Approvals';
import apiClient from '@/api/client';

vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
  },
}));

function renderApprovals() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/demo/approvals']}>
        <Routes>
          <Route path="/:tenantSlug/approvals" element={<Approvals />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Approvals screen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders pending approval rows', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        data: {
          items: [
            {
              projectId: 'p1',
              projectName: 'Madima Water Scheme',
              projectRefCode: 'PRJ-2026-001',
              stageTopLevel: 4,
              currentStage: 7,
              pendingCount: 3,
              oldestPendingAt: '2026-04-01T08:00:00.000Z',
            },
          ],
        },
      },
    } as never);

    renderApprovals();

    expect(await screen.findByText('Madima Water Scheme')).toBeInTheDocument();
    expect(screen.getByText('PRJ-2026-001')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders empty state when no pending approvals exist', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { data: { items: [] } },
    } as never);

    renderApprovals();

    expect(await screen.findByText('No pending approvals')).toBeInTheDocument();
    expect(screen.getByText('All current approvals are resolved.')).toBeInTheDocument();
  });
});
