import apiClient from './client';
import { useTenantStore } from '@/store/tenantStore';
import type { MultiYearPlan, Project, ApiResponse } from '@/types';

function slug() {
  return useTenantStore.getState().getSlug() || '';
}

interface PlanListParams {
  plannedYear?: number;
  serviceCategory?: string;
  localMunicipality?: string;
  funderType?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const planningApi = {
  list: async (params?: PlanListParams): Promise<{ plans: MultiYearPlan[]; total: number }> => {
    const res = await apiClient.get<ApiResponse<{ plans: MultiYearPlan[]; total: number }>>(`/${slug()}/planning`, { params });
    return res.data.data;
  },

  getById: async (id: string): Promise<MultiYearPlan> => {
    const res = await apiClient.get<ApiResponse<{ plan: MultiYearPlan }>>(`/${slug()}/planning/${id}`);
    return res.data.data.plan;
  },

  create: async (data: Partial<MultiYearPlan>): Promise<MultiYearPlan> => {
    const res = await apiClient.post<ApiResponse<{ plan: MultiYearPlan }>>(`/${slug()}/planning`, data);
    return res.data.data.plan;
  },

  update: async (id: string, data: Partial<MultiYearPlan>): Promise<MultiYearPlan> => {
    const res = await apiClient.patch<ApiResponse<{ plan: MultiYearPlan }>>(`/${slug()}/planning/${id}`, data);
    return res.data.data.plan;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/${slug()}/planning/${id}`);
  },

  beginInception: async (id: string): Promise<Project> => {
    const res = await apiClient.post<ApiResponse<{ project: Project }>>(`/${slug()}/planning/${id}/begin-inception`);
    return res.data.data.project;
  },
};
