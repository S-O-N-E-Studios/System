import apiClient from './client';
import { useTenantStore } from '@/store/tenantStore';
import type { VariationOrder, ApiResponse } from '@/types';

function slug() {
  return useTenantStore.getState().getSlug() || '';
}

export const variationsApi = {
  list: async (projectId: string): Promise<VariationOrder[]> => {
    const res = await apiClient.get<ApiResponse<VariationOrder[]>>(`/${slug()}/projects/${projectId}/variations`);
    const data = res.data?.data;
    return Array.isArray(data) ? data : (data as Record<string, unknown>)?.variations as VariationOrder[] || [];
  },

  getById: async (projectId: string, voId: string): Promise<VariationOrder> => {
    const res = await apiClient.get<ApiResponse<{ variation: VariationOrder }>>(`/${slug()}/projects/${projectId}/variations/${voId}`);
    return res.data.data.variation;
  },

  create: async (projectId: string, data: { description: string; reason: string; estimatedAmount: number }): Promise<VariationOrder> => {
    const res = await apiClient.post<ApiResponse<{ variation: VariationOrder }>>(`/${slug()}/projects/${projectId}/variations`, data);
    return res.data.data.variation;
  },

  update: async (projectId: string, voId: string, data: Partial<VariationOrder>): Promise<VariationOrder> => {
    const res = await apiClient.patch<ApiResponse<{ variation: VariationOrder }>>(`/${slug()}/projects/${projectId}/variations/${voId}`, data);
    return res.data.data.variation;
  },

  submit: async (projectId: string, voId: string): Promise<void> => {
    await apiClient.post(`/${slug()}/projects/${projectId}/variations/${voId}/submit`);
  },

  approve: async (projectId: string, voId: string, approvedAmount?: number): Promise<void> => {
    await apiClient.post(`/${slug()}/projects/${projectId}/variations/${voId}/approve`, { approvedAmount });
  },

  reject: async (projectId: string, voId: string, reason: string): Promise<void> => {
    await apiClient.post(`/${slug()}/projects/${projectId}/variations/${voId}/reject`, { reason });
  },

  withdraw: async (projectId: string, voId: string): Promise<void> => {
    await apiClient.post(`/${slug()}/projects/${projectId}/variations/${voId}/withdraw`);
  },
};
