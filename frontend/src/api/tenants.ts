import apiClient from './client';
import type { Tenant, ApiResponse, PaginatedResponse } from '@/types';

export const tenantsApi = {
  list: async (): Promise<PaginatedResponse<Tenant>> => {
    const res = await apiClient.get<PaginatedResponse<Tenant>>('/admin/tenants');
    return res.data;
  },

  getById: async (id: string): Promise<Tenant> => {
    const res = await apiClient.get<ApiResponse<Tenant>>(`/admin/tenants/${id}`);
    return res.data.data;
  },

  suspend: async (id: string): Promise<void> => {
    await apiClient.post(`/admin/tenants/${id}/suspend`);
  },

  reactivate: async (id: string): Promise<void> => {
    await apiClient.post(`/admin/tenants/${id}/reactivate`);
  },
};
