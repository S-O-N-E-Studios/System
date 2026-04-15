import apiClient from './client';
import { useTenantStore } from '@/store/tenantStore';
import type { IDPProjectRow } from '@/types';

function slug() {
  return useTenantStore.getState().getSlug() || '';
}

interface IDPListParams {
  localMunicipality?: string;
  funder?: string;
  serviceCategory?: string;
  stage?: number;
  status?: string;
}

export const idpApi = {
  list: async (params?: IDPListParams): Promise<IDPProjectRow[]> => {
    try {
      const res = await apiClient.get(`/${slug()}/idp`, { params });
      const data = res.data?.data || res.data;
      return Array.isArray(data) ? data : (data?.projects || []);
    } catch {
      return [];
    }
  },

  exportXlsx: async (params?: IDPListParams): Promise<Blob> => {
    const res = await apiClient.get(`/${slug()}/idp/export`, {
      params: { ...params, format: 'xlsx' },
      responseType: 'blob',
    });
    return res.data;
  },

  exportPdf: async (params?: IDPListParams): Promise<Blob> => {
    const res = await apiClient.get(`/${slug()}/idp/export`, {
      params: { ...params, format: 'pdf' },
      responseType: 'blob',
    });
    return res.data;
  },
};
