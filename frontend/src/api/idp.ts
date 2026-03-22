import apiClient from './client';
import type { IDPProjectRow } from '@/types';

interface IDPListParams {
  localMunicipality?: string;
  funder?: string;
  serviceCategory?: string;
  stage?: number;
  status?: string;
}

export const idpApi = {
  list: async (params?: IDPListParams): Promise<IDPProjectRow[]> => {
    const res = await apiClient.get<{ data: IDPProjectRow[] }>('/idp', { params });
    return res.data.data ?? res.data;
  },

  exportXlsx: async (params?: IDPListParams): Promise<Blob> => {
    const res = await apiClient.get('/idp/export', {
      params: { ...params, format: 'xlsx' },
      responseType: 'blob',
    });
    return res.data;
  },

  exportPdf: async (params?: IDPListParams): Promise<Blob> => {
    const res = await apiClient.get('/idp/export', {
      params: { ...params, format: 'pdf' },
      responseType: 'blob',
    });
    return res.data;
  },
};
