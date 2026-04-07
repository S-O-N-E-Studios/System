import { MOCK_PORTFOLIO_PROJECTS } from '@/mocks/portfolioProjects';

export type MapMockProject = {
  id: string;
  name: string;
  status: 'active' | 'review' | 'planning';
  contractValue: number;
  lat?: number;
  lng?: number;
  hasGps: boolean;
  fullAddress: string;
};

function parseGps(gps: string): { lat: number; lng: number } | null {
  const parts = gps.split(',').map((s) => parseFloat(s.trim()));
  if (parts.length >= 2 && parts.every((n) => !Number.isNaN(n))) {
    return { lat: parts[0], lng: parts[1] };
  }
  return null;
}

const fromPortfolio: MapMockProject[] = MOCK_PORTFOLIO_PROJECTS.map((p) => {
  const coords = parseGps(p.gps);
  return {
    id: p.id,
    name: p.name,
    status: p.status,
    contractValue: p.contractValue,
    lat: coords?.lat,
    lng: coords?.lng,
    hasGps: Boolean(coords),
    fullAddress: `${p.name}, ${p.localMunicipality}, Limpopo, South Africa`,
  };
});

/** Fourth row: no GPS (aligned with portfolio count + demo “no GPS” case). */
const extra: MapMockProject = {
  id: '4',
  name: 'Musina Wastewater Plant',
  status: 'active',
  contractValue: 22_000_000,
  hasGps: false,
  fullAddress: 'Industrial zone, Musina, Limpopo, South Africa',
};

export const MAP_MOCK_PROJECTS: MapMockProject[] = [...fromPortfolio, extra];
