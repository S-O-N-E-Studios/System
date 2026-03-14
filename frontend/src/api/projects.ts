import apiClient from './client';
import type { Project, ApiResponse, PaginatedResponse, PaymentHistoryEntry, ScheduleActivity } from '@/types';

interface ProjectListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  type?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaymentForecastEntry {
  month: number;
  year: number;
  forecastAmount: number;
  actualAmount: number;
}

export const projectsApi = {
  list: async (params?: ProjectListParams): Promise<PaginatedResponse<Project>> => {
    const res = await apiClient.get<PaginatedResponse<Project>>('/projects', { params });
    return res.data;
  },

  getById: async (id: string): Promise<Project> => {
    const res = await apiClient.get<ApiResponse<Project>>(`/projects/${id}`);
    return res.data.data;
  },

  create: async (data: Partial<Project>): Promise<Project> => {
    const res = await apiClient.post<ApiResponse<Project>>('/projects', data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<Project>): Promise<Project> => {
    const res = await apiClient.patch<ApiResponse<Project>>(`/projects/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },

  getBudgetSummary: async () => {
    const res = await apiClient.get('/projects/budget-summary');
    return res.data.data;
  },

  exportXlsx: async (params?: ProjectListParams): Promise<Blob> => {
    const res = await apiClient.get('/projects/export/xlsx', { params, responseType: 'blob' });
    return res.data;
  },

  exportPdf: async (params?: ProjectListParams): Promise<Blob> => {
    const res = await apiClient.get('/projects/export/pdf', { params, responseType: 'blob' });
    return res.data;
  },

  getActivities: async (projectId: string): Promise<ScheduleActivity[]> => {
    const res = await apiClient.get<ApiResponse<ScheduleActivity[]>>(`/projects/${projectId}/activities`);
    return res.data.data;
  },

  createActivity: async (projectId: string, data: Partial<ScheduleActivity>): Promise<ScheduleActivity> => {
    const res = await apiClient.post<ApiResponse<ScheduleActivity>>(`/projects/${projectId}/activities`, data);
    return res.data.data;
  },

  updateActivity: async (projectId: string, actId: string, data: Partial<ScheduleActivity>): Promise<ScheduleActivity> => {
    const res = await apiClient.patch<ApiResponse<ScheduleActivity>>(`/projects/${projectId}/activities/${actId}`, data);
    return res.data.data;
  },

  deleteActivity: async (projectId: string, actId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/activities/${actId}`);
  },

  getPayments: async (projectId: string): Promise<PaymentHistoryEntry[]> => {
    const res = await apiClient.get<ApiResponse<PaymentHistoryEntry[]>>(`/projects/${projectId}/payments`);
    return res.data.data;
  },

  createPayment: async (projectId: string, data: Partial<PaymentHistoryEntry>): Promise<PaymentHistoryEntry> => {
    const res = await apiClient.post<ApiResponse<PaymentHistoryEntry>>(`/projects/${projectId}/payments`, data);
    return res.data.data;
  },

  getPaymentForecast: async (projectId: string, year?: number): Promise<PaymentForecastEntry[]> => {
    const params = year ? { year } : {};
    const res = await apiClient.get<ApiResponse<PaymentForecastEntry[]>>(`/projects/${projectId}/payment-forecast`, { params });
    return res.data.data;
  },

  upsertPaymentForecast: async (projectId: string, data: { year: number; month: number; forecastAmount: number; actualAmount: number }) => {
    const res = await apiClient.post(`/projects/${projectId}/payment-forecast`, data);
    return res.data.data;
  },
};
