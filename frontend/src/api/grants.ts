// Grants API – mocked for MVP frontend work.
// Swap implementation to use apiClient when backend is ready.
import type { Grant } from '@/types';

export interface GrantsSummary {
  totalValue: number;
  disbursedToDate: number;
  remaining: number;
  byType: Array<{
    grantType: string;
    totalValue: number;
    disbursedToDate: number;
    remaining: number;
  }>;
}

export async function fetchGrants(params?: { status?: string | null }) {
  const status = params?.status ?? null;

  const base: Grant[] = [
    {
      id: 'g-1',
      tenantId: 'mock-tenant',
      grantName: 'MIG 2025/26',
      grantType: 'MIG',
      funderOrg: 'National Treasury',
      financialYear: '2025/26',
      totalValue: 250_000_000,
      allocatedToProjects: 180_000_000,
      disbursedToDate: 95_000_000,
      remaining: 155_000_000,
      complianceDeadline: '2026-03-31',
      reportingSchedule: [],
      linkedProjects: ['proj-1', 'proj-2'],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'g-2',
      tenantId: 'mock-tenant',
      grantName: 'WSIG 2025/26',
      grantType: 'WSIG',
      funderOrg: 'DWS',
      financialYear: '2025/26',
      totalValue: 80_000_000,
      allocatedToProjects: 60_000_000,
      disbursedToDate: 24_000_000,
      remaining: 56_000_000,
      complianceDeadline: '2026-02-28',
      reportingSchedule: [],
      linkedProjects: ['proj-3'],
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const filtered = status ? base.filter((g) => g.status === status) : base;
  return Promise.resolve(filtered);
}

export async function fetchGrantsSummary() {
  const totalValue = 330_000_000;
  const disbursedToDate = 119_000_000;
  const remaining = totalValue - disbursedToDate;

  const byType: GrantsSummary['byType'] = [
    {
      grantType: 'MIG',
      totalValue: 250_000_000,
      disbursedToDate: 95_000_000,
      remaining: 155_000_000,
    },
    {
      grantType: 'WSIG',
      totalValue: 80_000_000,
      disbursedToDate: 24_000_000,
      remaining: 56_000_000,
    },
  ];

  return Promise.resolve({
    totalValue,
    disbursedToDate,
    remaining,
    byType,
  });
}

