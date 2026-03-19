import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import IDPView from './IDPView';
import { idpApi } from '@/api/idp';
import { type IDPProjectRow } from '@/types';

vi.mock('@/api/idp', () => ({
  idpApi: {
    list: vi.fn(),
    exportXlsx: vi.fn(),
    exportPdf: vi.fn(),
  },
}));

const mockProjects: IDPProjectRow[] = [
  {
    id: '1',
    idpProjectNo: 'IDP-2026-001',
    name: 'Test Project',
    localMunicipality: 'Emalahleni',
    funderType: 'mig' as const,
    currentStage: 4 as const,
    status: 'active' as const,
  },
];

function renderIDPView() {
  return render(
    <MemoryRouter initialEntries={['/demo']}>
      <Routes>
        <Route path="/:tenantSlug" element={<IDPView />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('IDPView', () => {
  beforeEach(() => {
    vi.mocked(idpApi.list).mockResolvedValue(mockProjects);
  });

  it('renders IDP View heading', async () => {
    renderIDPView();
    expect(screen.getByText('IDP View')).toBeInTheDocument();
  });

  it('renders description', async () => {
    renderIDPView();
    expect(screen.getByText(/Integrated Development Plan/)).toBeInTheDocument();
  });

  it('loads and displays projects', async () => {
    renderIDPView();
    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    vi.mocked(idpApi.list).mockImplementation(() => new Promise(() => {}));
    renderIDPView();
    expect(document.querySelector('.skeleton')).toBeInTheDocument();
  });
});
