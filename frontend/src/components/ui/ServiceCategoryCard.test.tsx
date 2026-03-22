import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ServiceCategoryCard from './ServiceCategoryCard';
import { type Project } from '@/types';

const mockProjects: Project[] = [
  {
    id: '1',
    tenantId: 't1',
    name: 'Road Project',
    refCode: 'PRJ-001',
    status: 'active' as const,
    currentStage: 4 as const,
    serviceCategory: 'roads_stormwater' as const,
    localMunicipality: 'Emalahleni',
    contractValue: 10_000_000,
    expenditureToDate: 5_000_000,
    balance: 5_000_000,
    contractTypes: ['professional'],
    createdAt: '2026-01-01',
    updatedAt: '2026-03-01',
  },
];

describe('ServiceCategoryCard', () => {
  it('renders category name', () => {
    render(
      <MemoryRouter>
        <ServiceCategoryCard
          category="roads_stormwater"
          projectCount={1}
          totalBudget={10_000_000}
          totalExpenditure={5_000_000}
          projects={mockProjects}
        />
      </MemoryRouter>
    );
    expect(screen.getByText('Roads and Stormwater')).toBeInTheDocument();
  });

  it('renders project count and budget', () => {
    render(
      <MemoryRouter>
        <ServiceCategoryCard
          category="water_sanitation"
          projectCount={2}
          totalBudget={20_000_000}
          totalExpenditure={8_000_000}
          projects={[]}
        />
      </MemoryRouter>
    );
    expect(screen.getByText(/2 project/)).toBeInTheDocument();
  });

  it('expands to show project list when clicked', () => {
    render(
      <MemoryRouter>
        <ServiceCategoryCard
          category="roads_stormwater"
          projectCount={1}
          totalBudget={10_000_000}
          totalExpenditure={5_000_000}
          projects={mockProjects}
        />
      </MemoryRouter>
    );
    const card = screen.getByText('Roads and Stormwater').closest('button');
    if (card) fireEvent.click(card);
    expect(screen.getByText('Road Project')).toBeInTheDocument();
  });
});
