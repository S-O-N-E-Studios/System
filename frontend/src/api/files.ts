import apiClient from './client';
import type { ProjectFile, ApiResponse, PaginatedResponse } from '@/types';

interface FileListParams {
  projectId?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}

export const filesApi = {
  list: async (params?: FileListParams): Promise<PaginatedResponse<ProjectFile>> => {
    const res = await apiClient.get<PaginatedResponse<ProjectFile>>('/files', { params });
    return res.data;
  },

  upload: async (file: File, projectId?: string): Promise<ProjectFile> => {
    const formData = new FormData();
    formData.append('file', file);
    if (projectId) formData.append('projectId', projectId);

    const res = await apiClient.post<ApiResponse<ProjectFile>>('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/files/${id}`);
  },

  getDownloadUrl: async (id: string): Promise<string> => {
    const res = await apiClient.get<ApiResponse<{ url: string }>>(`/files/${id}/download`);
    return res.data.data.url;
  },
};
