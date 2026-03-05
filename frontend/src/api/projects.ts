import apiClient from './client';
import type { Project, ApiResponse, PaginatedResponse, ProjectFormData } from '@/types';

interface ProjectListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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

  create: async (data: ProjectFormData): Promise<Project> => {
    const res = await apiClient.post<ApiResponse<Project>>('/projects', data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<ProjectFormData>): Promise<Project> => {
    const res = await apiClient.patch<ApiResponse<Project>>(`/projects/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },

  exportXlsx: async (params?: ProjectListParams): Promise<Blob> => {
    const res = await apiClient.get('/projects/export/xlsx', {
      params,
      responseType: 'blob',
    });
    return res.data;
  },

  exportPdf: async (params?: ProjectListParams): Promise<Blob> => {
    const res = await apiClient.get('/projects/export/pdf', {
      params,
      responseType: 'blob',
    });
    return res.data;
  },
};
