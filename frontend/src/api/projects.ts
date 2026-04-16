import apiClient from './client';
import { useTenantStore } from '@/store/tenantStore';
import type { Project, ApiResponse, ProjectFormData } from '@/types';

function slug() {
  return useTenantStore.getState().getSlug() || '';
}

interface ProjectListParams {
  page?: number;
  limit?: number;
  status?: string;
  serviceCategory?: string;
  localMunicipality?: string;
  stage?: number;
  contractType?: string;
  search?: string;
  deptId?: string;
}

type ProjectUpsertData = Partial<ProjectFormData> & Record<string, unknown>;

export const projectsApi = {
  list: async (params?: ProjectListParams): Promise<{ projects: Project[]; total: number }> => {
    const res = await apiClient.get<ApiResponse<{ projects: Project[]; total: number }>>(`/${slug()}/projects`, { params });
    return res.data.data;
  },

  getById: async (id: string): Promise<Project> => {
    const res = await apiClient.get<ApiResponse<{ project: Project }>>(`/${slug()}/projects/${id}`);
    return res.data.data.project;
  },

  create: async (data: ProjectUpsertData): Promise<Project> => {
    const res = await apiClient.post<ApiResponse<{ project: Project }>>(`/${slug()}/projects`, data);
    return res.data.data.project;
  },

  update: async (id: string, data: ProjectUpsertData): Promise<Project> => {
    const res = await apiClient.patch<ApiResponse<{ project: Project }>>(`/${slug()}/projects/${id}`, data);
    return res.data.data.project;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/${slug()}/projects/${id}`);
  },

  getBudgetSummary: async (deptId?: string) => {
    const params = deptId ? { deptId } : {};
    const res = await apiClient.get<ApiResponse<{ summary: Record<string, number> }>>(`/${slug()}/projects/budget-summary`, { params });
    return res.data.data.summary;
  },

  getStageStatus: async (projectId: string) => {
    const res = await apiClient.get<ApiResponse<Record<string, unknown>>>(`/${slug()}/projects/${projectId}/stage-status`);
    return res.data.data;
  },

  advanceStage: async (projectId: string) => {
    const res = await apiClient.post<ApiResponse<Record<string, unknown>>>(`/${slug()}/projects/${projectId}/advance-stage`);
    return res.data.data;
  },

  listPayments: async (projectId: string) => {
    const res = await apiClient.get<ApiResponse<{ payments: unknown[] }>>(`/${slug()}/projects/${projectId}/payments`);
    return res.data.data.payments;
  },

  addPayment: async (projectId: string, data: Record<string, unknown>) => {
    const res = await apiClient.post<ApiResponse<{ payment: unknown }>>(`/${slug()}/projects/${projectId}/payments`, data);
    return res.data.data.payment;
  },

  getPaymentForecast: async (projectId: string) => {
    const res = await apiClient.get<ApiResponse<{ forecast: unknown[] }>>(`/${slug()}/projects/${projectId}/payment-forecast`);
    return res.data.data.forecast;
  },
};
