import type { ServiceCategory } from '@/types';

/** In-memory portfolio rows for MVP demos until `projectsApi.list` is wired everywhere. */
export type MockPortfolioProject = {
  id: string;
  name: string;
  ref: string;
  gps: string;
  contractValue: number;
  expenditure: number;
  balance: number;
  status: 'active' | 'review' | 'planning';
  attachments: number;
  geoTecEngineer: string;
  geoTecReport: string;
  ddrStatus: string;
  challenges: string;
  recommendation: string;
  contractor: string;
  startDate: string;
  completionDate: string;
  percentComplete: number;
  constructionStatus: 'on_track' | 'at_risk' | 'delayed';
  serviceCategory: ServiceCategory;
  localMunicipality: string;
};

export const MOCK_PORTFOLIO_PROJECTS: MockPortfolioProject[] = [
  {
    id: '1',
    name: 'Polokwane Water Treatment Upgrade',
    ref: 'PRJ-2026-001',
    gps: '-23.9045, 29.4688',
    contractValue: 45_000_000,
    expenditure: 18_200_000,
    balance: 26_800_000,
    status: 'active',
    attachments: 12,
    geoTecEngineer: 'Geoscience Ltd',
    geoTecReport: 'submitted',
    ddrStatus: 'complete',
    challenges: 'Groundwater contamination at borehole BH-3',
    recommendation: 'Re-route foundation to avoid contaminated zone',
    contractor: 'BuildCorp SA',
    startDate: '15 Jan 2026',
    completionDate: '30 Nov 2026',
    percentComplete: 42,
    constructionStatus: 'on_track',
    serviceCategory: 'water_sanitation',
    localMunicipality: 'Emalahleni',
  },
  {
    id: '2',
    name: 'Mokopane Road Rehabilitation',
    ref: 'PRJ-2026-002',
    gps: '-24.1868, 29.0148',
    contractValue: 32_000_000,
    expenditure: 14_500_000,
    balance: 17_500_000,
    status: 'review',
    attachments: 8,
    geoTecEngineer: 'Terra Investigations',
    geoTecReport: 'in_review',
    ddrStatus: 'in_review',
    challenges: 'Expansive clay subsoils along section km 4-7',
    recommendation: 'Lime stabilisation required',
    contractor: 'RoadWorks Inc',
    startDate: '01 Mar 2026',
    completionDate: '28 Feb 2027',
    percentComplete: 28,
    constructionStatus: 'at_risk',
    serviceCategory: 'roads_stormwater',
    localMunicipality: 'Steve Tshwete',
  },
  {
    id: '3',
    name: 'Tzaneen Bridge Construction',
    ref: 'PRJ-2026-003',
    gps: '-23.8318, 30.1636',
    contractValue: 78_000_000,
    expenditure: 5_200_000,
    balance: 72_800_000,
    status: 'planning',
    attachments: 3,
    geoTecEngineer: '',
    geoTecReport: 'not_started',
    ddrStatus: 'pending',
    challenges: '',
    recommendation: '',
    contractor: '',
    startDate: '01 Jun 2026',
    completionDate: '31 Dec 2027',
    percentComplete: 5,
    constructionStatus: 'delayed',
    serviceCategory: 'roads_stormwater',
    localMunicipality: 'Victor Khanye',
  },
];
