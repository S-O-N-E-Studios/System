import apiClient from './client';
import type { ServiceCategorySummary, ServiceCategory } from '@/types';
import { getMockServiceSummaries } from '@/mocks/normalServiceSummaries';

const useMockAuth = import.meta.env.VITE_USE_MOCK_AUTH !== 'false';
const mockDelay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const servicesApi = {
  summary: async (): Promise<ServiceCategorySummary[]> => {
    if (useMockAuth) {
      await mockDelay(180);
      return getMockServiceSummaries();
    }
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
