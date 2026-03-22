import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import NormalServices from './NormalServices';
import { servicesApi } from '@/api/services';

vi.mock('@/api/services', () => ({
  servicesApi: {
    summary: vi.fn(),
    exportXlsx: vi.fn(),
    exportPdf: vi.fn(),
  },
}));

const mockSummaries = [
  {
    category: 'water_sanitation' as const,
    projectCount: 2,
    totalBudget: 20_000_000,
    totalExpenditure: 8_000_000,
    projects: [],
  },
  {
    category: 'roads_stormwater' as const,
    projectCount: 1,
    totalBudget: 10_000_000,
    totalExpenditure: 5_000_000,
    projects: [],
  },
];

function renderNormalServices() {
  return render(
    <MemoryRouter initialEntries={['/demo']}>
      <Routes>
        <Route path="/:tenantSlug" element={<NormalServices />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('NormalServices', () => {
  beforeEach(() => {
    vi.mocked(servicesApi.summary).mockResolvedValue(mockSummaries);
  });

  it('renders Normal Services heading', async () => {
    renderNormalServices();
    expect(await screen.findByText('Normal Services')).toBeInTheDocument();
  });

  it('loads and displays service categories', async () => {
    renderNormalServices();
    await waitFor(() => {
      expect(screen.getByText('Water and Sanitation')).toBeInTheDocument();
      expect(screen.getByText('Roads and Stormwater')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    vi.mocked(servicesApi.summary).mockImplementation(() => new Promise(() => {}));
    renderNormalServices();
    expect(document.querySelector('.skeleton')).toBeInTheDocument();
  });
});
