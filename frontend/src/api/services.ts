import apiClient from './client';
import type { ServiceCategorySummary, ServiceCategory } from '@/types';

export const servicesApi = {
  summary: async (): Promise<ServiceCategorySummary[]> => {
    const res = await apiClient.get<{ data: ServiceCategorySummary[] }>('/services');
    return res.data.data ?? res.data;
  },

  byCategory: async (
    category: ServiceCategory,
    params?: { localMunicipality?: string; funder?: string; stage?: number; status?: string }
  ) => {
    const res = await apiClient.get<{ data: ServiceCategorySummary }>(`/services/${category}`, {
      params,
    });
    return res.data.data ?? res.data;
  },

  exportXlsx: async (): Promise<Blob> => {
    const res = await apiClient.get('/services/export', {
      params: { format: 'xlsx' },
      responseType: 'blob',
    });
    return res.data;
  },

  exportPdf: async (): Promise<Blob> => {
    const res = await apiClient.get('/services/export', {
      params: { format: 'pdf' },
      responseType: 'blob',
    });
    return res.data;
  },
};
