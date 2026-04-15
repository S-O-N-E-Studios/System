import apiClient from './client';
import { useTenantStore } from '@/store/tenantStore';
import type { ServiceCategorySummary, ServiceCategory } from '@/types';

function slug() {
  return useTenantStore.getState().getSlug() || '';
}

export const servicesApi = {
  summary: async (): Promise<ServiceCategorySummary[]> => {
    try {
      const res = await apiClient.get(`/${slug()}/services`);
      const data = res.data?.data || res.data;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
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
