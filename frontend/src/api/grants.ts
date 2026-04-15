import apiClient from './client';
import { useTenantStore } from '@/store/tenantStore';
import type { Grant } from '@/types';

function slug() {
  return useTenantStore.getState().getSlug() || '';
}

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

export async function fetchGrants(params?: { status?: string | null }): Promise<Grant[]> {
  try {
    const res = await apiClient.get(`/${slug()}/grants`, { params });
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : (data?.grants || []);
  } catch {
    return [];
  }
}

export async function fetchGrantsSummary(): Promise<GrantsSummary> {
  try {
    const grants = await fetchGrants();
    const totalValue = grants.reduce((s, g) => s + g.totalValue, 0);
    const disbursedToDate = grants.reduce((s, g) => s + g.disbursedToDate, 0);

    const byTypeMap = new Map<string, { totalValue: number; disbursedToDate: number }>();
    for (const g of grants) {
      const existing = byTypeMap.get(g.grantType) || { totalValue: 0, disbursedToDate: 0 };
      existing.totalValue += g.totalValue;
      existing.disbursedToDate += g.disbursedToDate;
      byTypeMap.set(g.grantType, existing);
    }

    return {
      totalValue,
      disbursedToDate,
      remaining: totalValue - disbursedToDate,
      byType: Array.from(byTypeMap.entries()).map(([grantType, v]) => ({
        grantType,
        ...v,
        remaining: v.totalValue - v.disbursedToDate,
      })),
    };
  } catch {
    return { totalValue: 0, disbursedToDate: 0, remaining: 0, byType: [] };
  }
}

export async function createGrant(data: Partial<Grant>): Promise<Grant> {
  const res = await apiClient.post(`/${slug()}/grants`, data);
  return res.data?.data?.grant || res.data?.data || res.data;
}

export async function updateGrant(id: string, data: Partial<Grant>): Promise<Grant> {
  const res = await apiClient.patch(`/${slug()}/grants/${id}`, data);
  return res.data?.data?.grant || res.data?.data || res.data;
}

export async function deleteGrant(id: string): Promise<void> {
  await apiClient.delete(`/${slug()}/grants/${id}`);
}
