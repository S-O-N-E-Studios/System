import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import IDPTable from './IDPTable';
import { type IDPProjectRow } from '@/types';

const mockProjects: IDPProjectRow[] = [
  {
    id: '1',
    idpProjectNo: 'IDP-2026-001',
    name: 'R573 Road Rehabilitation',
    description: 'Road rehab',
    localMunicipality: 'Emalahleni',
    mtefYear1: 15_000_000,
    funderType: 'mig' as const,
    currentStage: 4 as const,
    status: 'active' as const,
  },
  {
    id: '2',
    idpProjectNo: 'IDP-2026-002',
    name: 'Water Treatment',
    localMunicipality: 'Steve Tshwete',
    funderType: 'rbig' as const,
    currentStage: 3 as const,
    status: 'active' as const,
  },
];

function renderWithRouter() {
  return render(
    <MemoryRouter initialEntries={['/demo']}>
      <Routes>
        <Route path="/:tenantSlug" element={<IDPTable projects={mockProjects} />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('IDPTable', () => {
  it('renders filter bar', () => {
    renderWithRouter();
    expect(screen.getByText('All Funders')).toBeInTheDocument();
  });

  it('renders project names', () => {
    renderWithRouter();
    expect(screen.getByText('R573 Road Rehabilitation')).toBeInTheDocument();
    expect(screen.getByText('Water Treatment')).toBeInTheDocument();
  });

  it('renders Export XLSX and PDF buttons', () => {
    renderWithRouter();
    expect(screen.getByText('Export XLSX')).toBeInTheDocument();
    expect(screen.getByText('Export PDF')).toBeInTheDocument();
  });

  it('shows loading skeleton when isLoading', () => {
    render(
      <MemoryRouter>
        <IDPTable projects={[]} isLoading />
      </MemoryRouter>
    );
    expect(document.querySelector('.skeleton')).toBeInTheDocument();
  });

  it('calls onExport when export button clicked', () => {
    const onExport = vi.fn();
    render(
      <MemoryRouter>
        <IDPTable projects={mockProjects} onExport={onExport} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('Export XLSX'));
    expect(onExport).toHaveBeenCalledWith('xlsx');
  });
});
