export type DepartmentProjectRow = {
  id: string;
  name: string;
  refCode: string;
  location: string;
  status: 'active' | 'review' | 'danger' | 'done';
  engineerCost: number;
  contractValue: number;
  expenditurePlan: number;
  expenditureActual: number;
  progressProjected: number;
  progressActual: number;
};

export type DepartmentRecord = {
  name: string;
  fullName: string;
  programs: { name: string; budget: number; spent: number }[];
  projects: DepartmentProjectRow[];
};

export const MOCK_DEPARTMENTS_BY_ID: Record<string, DepartmentRecord> = {
  dpw: {
    name: 'DPW',
    fullName: 'Department of Public Works',
    programs: [
      { name: 'Road Maintenance', budget: 1_000_000_000, spent: 420_000_000 },
      { name: 'Capital Projects', budget: 2_500_000_000, spent: 1_100_000_000 },
      { name: 'Public Facilities', budget: 1_000_000_000, spent: 350_000_000 },
      { name: 'Patchwork', budget: 500_000_000, spent: 230_000_000 },
    ],
    projects: [
      { id: '1', name: 'R573 Road Rehabilitation', refCode: 'PRJ-2026-001', location: 'Mbombela', status: 'active', engineerCost: 4_500_000, contractValue: 45_000_000, expenditurePlan: 18_000_000, expenditureActual: 15_200_000, progressProjected: 45, progressActual: 38 },
      { id: '2', name: 'N4 Bridge Widening', refCode: 'PRJ-2026-002', location: 'Nelspruit', status: 'active', engineerCost: 2_800_000, contractValue: 32_000_000, expenditurePlan: 12_000_000, expenditureActual: 11_800_000, progressProjected: 35, progressActual: 34 },
      { id: '3', name: 'Barberton Access Road', refCode: 'PRJ-2026-003', location: 'Barberton', status: 'review', engineerCost: 1_200_000, contractValue: 18_500_000, expenditurePlan: 8_000_000, expenditureActual: 9_200_000, progressProjected: 60, progressActual: 52 },
      { id: '4', name: 'White River Stormwater', refCode: 'PRJ-2025-018', location: 'White River', status: 'danger', engineerCost: 900_000, contractValue: 12_000_000, expenditurePlan: 10_000_000, expenditureActual: 11_500_000, progressProjected: 85, progressActual: 65 },
      { id: '5', name: 'Hazyview Community Hall', refCode: 'PRJ-2025-012', location: 'Hazyview', status: 'done', engineerCost: 600_000, contractValue: 8_000_000, expenditurePlan: 8_000_000, expenditureActual: 7_800_000, progressProjected: 100, progressActual: 100 },
    ],
  },
};

export const DEFAULT_DEPARTMENT_ID = 'dpw';

export function getMockDepartment(deptId: string | undefined): DepartmentRecord {
  if (deptId && MOCK_DEPARTMENTS_BY_ID[deptId]) {
    return MOCK_DEPARTMENTS_BY_ID[deptId];
  }
  return MOCK_DEPARTMENTS_BY_ID[DEFAULT_DEPARTMENT_ID];
}
