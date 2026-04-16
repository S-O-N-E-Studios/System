import apiClient from './client';
import { useTenantStore } from '@/store/tenantStore';
import type { ServiceCategorySummary, ServiceCategory } from '@/types';

function slug() {
  return useTenantStore.getState().getSlug() || '';
}

export const servicesApi = {
  summary: async (): Promise<ServiceCategorySummary[]> => {
    const res = await apiClient.get(`/${slug()}/services`);
    const data = res.data?.data || res.data;
    const summary = Array.isArray(data?.summary) ? data.summary : [];
    return summary.map((row: Record<string, unknown>) => ({
      category: (row.category ?? row.serviceCategory) as ServiceCategory,
      projectCount: Number(row.projectCount ?? 0),
      totalBudget: Number(row.totalBudget ?? 0),
      totalExpenditure: Number(row.totalExpenditure ?? 0),
      projects: Array.isArray(row.projects) ? row.projects : [],
    })) as ServiceCategorySummary[];
  },

  byCategory: async (
    category: ServiceCategory,
    params?: { localMunicipality?: string; funder?: string; stage?: number; status?: string }
  ) => {
    const res = await apiClient.get(`/${slug()}/services/${encodeURIComponent(category)}`, { params });
    return res.data?.data || res.data;
  },

  exportXlsx: async (): Promise<Blob> => {
    const res = await apiClient.get(`/${slug()}/services/export`, {
      params: { format: 'xlsx' },
      responseType: 'blob',
    });
    return res.data;
  },

  exportPdf: async (): Promise<Blob> => {
    const res = await apiClient.get(`/${slug()}/services/export`, {
      params: { format: 'pdf' },
      responseType: 'blob',
    });
    return res.data;
  },
};
