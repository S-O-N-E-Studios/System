import type { Project, ServiceCategory, ServiceCategorySummary } from '@/types';

const CATEGORIES: ServiceCategory[] = [
  'water_sanitation',
  'energy_electricity',
  'roads_stormwater',
  'waste_management',
  'recreational_sport_libraries',
  'public_transportation',
];

/** Demo projects underpinning Normal Services category rollups (frontend-only). */
const MOCK_SERVICE_PROJECTS: Project[] = [
  {
    id: '1',
    tenantId: 't1',
    name: 'R573 Road Rehabilitation',
    refCode: 'PRJ-2026-001',
    status: 'active',
    currentStage: 4,
    serviceCategory: 'roads_stormwater',
    localMunicipality: 'Emalahleni',
    contractValue: 45_000_000,
    contractValueOriginal: 4_500_000_000,
    contractValueAdjusted: 4_500_000_000,
    expenditureToDate: 18_200_000,
    balance: 26_800_000,
    contractTypes: ['professional', 'construction'],
    createdAt: '2026-01-01',
    updatedAt: '2026-03-01',
  },
  {
    id: '2',
    tenantId: 't1',
    name: 'Mokopane Water Treatment',
    refCode: 'PRJ-2026-002',
    status: 'active',
    currentStage: 3,
    serviceCategory: 'water_sanitation',
    localMunicipality: 'Steve Tshwete',
    contractValue: 55_000_000,
    contractValueOriginal: 5_500_000_000,
    contractValueAdjusted: 5_500_000_000,
    expenditureToDate: 12_000_000,
    balance: 43_000_000,
    contractTypes: ['professional', 'geotechnical'],
    createdAt: '2026-01-15',
    updatedAt: '2026-02-28',
  },
  {
    id: '3',
    tenantId: 't1',
    name: 'Victor Khanye Community Hall',
    refCode: 'PRJ-2026-003',
    status: 'active',
    currentStage: 5,
    serviceCategory: 'recreational_sport_libraries',
    localMunicipality: 'Victor Khanye',
    contractValue: 8_000_000,
    contractValueOriginal: 800_000_000,
    contractValueAdjusted: 800_000_000,
    expenditureToDate: 5_200_000,
    balance: 2_800_000,
    contractTypes: ['construction'],
    createdAt: '2025-11-01',
    updatedAt: '2026-03-10',
  },
  {
    id: '4',
    tenantId: 't1',
    name: 'Emakhazeni Waste Transfer Station',
    refCode: 'PRJ-2025-012',
    status: 'complete',
    currentStage: 6,
    serviceCategory: 'waste_management',
    localMunicipality: 'Emakhazeni',
    contractValue: 8_000_000,
    contractValueOriginal: 800_000_000,
    contractValueAdjusted: 800_000_000,
    expenditureToDate: 8_000_000,
    balance: 0,
    contractTypes: ['professional', 'construction'],
    createdAt: '2025-06-01',
    updatedAt: '2026-01-15',
  },
];

export function getMockServiceSummaries(): ServiceCategorySummary[] {
  return CATEGORIES.map((category) => {
    const projects = MOCK_SERVICE_PROJECTS.filter((p) => p.serviceCategory === category);
    return {
      category,
      projectCount: projects.length,
      totalBudget: projects.reduce((s, p) => s + p.contractValue, 0),
      totalExpenditure: projects.reduce((s, p) => s + p.expenditureToDate, 0),
      projects,
    };
  });
}
