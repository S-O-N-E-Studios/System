import apiClient from './client';
import { useTenantStore } from '@/store/tenantStore';
import type { ProjectFile, ApiResponse } from '@/types';

function slug() {
  return useTenantStore.getState().getSlug() || '';
}

interface MediaListParams {
  stage?: number;
  type?: 'image' | 'video';
  activityId?: string;
  page?: number;
  limit?: number;
}

export const mediaApi = {
  list: async (projectId: string, params?: MediaListParams): Promise<{ media: ProjectFile[]; total: number }> => {
    try {
      const res = await apiClient.get<ApiResponse<{ media: ProjectFile[]; total: number }>>(`/${slug()}/projects/${projectId}/media`, { params });
      return res.data.data;
    } catch {
      return { media: [], total: 0 };
    }
  },

  getUploadUrl: async (projectId: string, fileName: string): Promise<{ url: string; key: string }> => {
    const res = await apiClient.post<ApiResponse<{ url: string; key: string }>>(`/${slug()}/projects/${projectId}/media/upload-url`, { fileName });
    return res.data.data;
  },

  register: async (projectId: string, data: {
    originalName: string;
    storagePath: string;
    mimeType: string;
    sizeBytes: number;
    mediaType: 'image' | 'video';
    stage?: number;
    captureDate?: string;
    captureGPS?: { lat: number; lng: number };
    description?: string;
    activityId?: string;
    mediaDurationSeconds?: number;
  }): Promise<ProjectFile> => {
    const res = await apiClient.post<ApiResponse<{ media: ProjectFile }>>(`/${slug()}/projects/${projectId}/media`, data);
    return res.data.data.media;
  },

  delete: async (projectId: string, mediaId: string): Promise<void> => {
    await apiClient.delete(`/${slug()}/projects/${projectId}/media/${mediaId}`);
  },

  getUrl: async (projectId: string, mediaId: string): Promise<string> => {
    const res = await apiClient.get<ApiResponse<{ url: string }>>(`/${slug()}/projects/${projectId}/media/${mediaId}/url`);
    return res.data.data.url;
  },
};
