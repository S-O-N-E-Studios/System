import apiClient from './client';
import type {
  ApiResponse,
  FileCategory,
  PaginatedResponse,
  ProjectFile,
  ProjectStage,
} from '@/types';

export interface FileListParams {
  tenantSlug: string;
  projectId?: string;
  category?: FileCategory | string;
  stage?: ProjectStage;
  clientVisible?: boolean;
  page?: number;
  pageSize?: number;
}

export const filesApi = {
  list: async (params: FileListParams): Promise<PaginatedResponse<ProjectFile>> => {
    const { tenantSlug, ...query } = params;
    const res = await apiClient.get<PaginatedResponse<ProjectFile>>(
      `/${tenantSlug}/files`,
      { params: query }
    );
    return res.data;
  },

  /**
   * Get a presigned URL for direct browser-to-storage upload.
   *
   * Backend spec: POST `/:tenantSlug/files/upload-url`
   * Response shape may vary; we keep parsing defensive.
   */
  getUploadUrl: async (params: {
    tenantSlug: string;
    projectId: string;
    stage: ProjectStage;
    category: FileCategory | string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
  }): Promise<{
    uploadUrl: string;
    method: 'PUT' | 'POST';
    fields?: Record<string, string>;
    storagePath?: string;
  }> => {
    const res = await apiClient.post<ApiResponse<unknown>>(
      `/${params.tenantSlug}/files/upload-url`,
      {
        projectId: params.projectId,
        stage: params.stage,
        category: params.category,
        fileName: params.fileName,
        mimeType: params.mimeType,
        sizeBytes: params.sizeBytes,
      }
    );

    const raw: unknown = (res as { data: unknown }).data;
    const payload: unknown =
      raw && typeof raw === 'object' && 'data' in raw
        ? (raw as { data: unknown }).data
        : raw;
    const p =
      payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
    const uploadUrl =
      typeof p?.uploadUrl === 'string'
        ? p.uploadUrl
        : typeof p?.url === 'string'
          ? p.url
          : typeof p?.presignedUrl === 'string'
            ? p.presignedUrl
            : undefined;
    const method: 'PUT' | 'POST' = p?.method === 'POST' ? 'POST' : 'PUT';
    const fields = p?.fields as Record<string, string> | undefined;
    const storagePath =
      typeof p?.storagePath === 'string'
        ? p.storagePath
        : typeof p?.filePath === 'string'
          ? p.filePath
          : typeof p?.key === 'string'
            ? p.key
            : undefined;

    if (!uploadUrl || typeof uploadUrl !== 'string') {
      throw new Error('Upload URL missing from response');
    }

    return { uploadUrl, method, fields, storagePath };
  },

  /**
   * Register an already-uploaded file in the backend.
   *
   * Backend spec: POST `/:tenantSlug/files`
   */
  registerUploadedFile: async (params: {
    tenantSlug: string;
    projectId: string;
    stage: ProjectStage;
    category: FileCategory | string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    storagePath?: string;
  }): Promise<ProjectFile> => {
    const res = await apiClient.post<ApiResponse<ProjectFile>>(`/${params.tenantSlug}/files`, {
      projectId: params.projectId,
      stage: params.stage,
      category: params.category,
      originalName: params.originalName,
      mimeType: params.mimeType,
      sizeBytes: params.sizeBytes,
      storagePath: params.storagePath,
    });

    return res.data.data;
  },

  /**
   * Convenience: upload + register in one call.
   * Uses upload-url then direct fetch to the presigned URL.
   */
  uploadStageDocument: async (params: {
    tenantSlug: string;
    projectId: string;
    stage: ProjectStage;
    category: FileCategory | string;
    file: File;
  }): Promise<ProjectFile> => {
    const { uploadUrl, method, fields, storagePath } = await filesApi.getUploadUrl({
      tenantSlug: params.tenantSlug,
      projectId: params.projectId,
      stage: params.stage,
      category: params.category,
      fileName: params.file.name,
      mimeType: params.file.type || 'application/octet-stream',
      sizeBytes: params.file.size,
    });

    // Direct upload to storage using the presigned URL.
    if (method === 'POST' && fields) {
      const formData = new FormData();
      Object.entries(fields).forEach(([k, v]) => formData.append(k, v));
      formData.append('file', params.file);
      const resp = await fetch(uploadUrl, { method: 'POST', body: formData });
      if (!resp.ok) throw new Error('Presigned POST upload failed');
    } else {
      const resp = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': params.file.type || 'application/octet-stream' },
        body: params.file,
      });
      if (!resp.ok) throw new Error('Presigned PUT upload failed');
    }

    return filesApi.registerUploadedFile({
      tenantSlug: params.tenantSlug,
      projectId: params.projectId,
      stage: params.stage,
      category: params.category,
      originalName: params.file.name,
      mimeType: params.file.type || 'application/octet-stream',
      sizeBytes: params.file.size,
      storagePath,
    });
  },

  setVisibility: async (params: {
    tenantSlug: string;
    fileId: string;
    clientVisible: boolean;
  }): Promise<ProjectFile> => {
    const res = await apiClient.patch<ApiResponse<ProjectFile>>(
      `/${params.tenantSlug}/files/${params.fileId}/visibility`,
      { clientVisible: params.clientVisible }
    );
    return res.data.data;
  },

  delete: async (params: { tenantSlug: string; id: string }): Promise<void> => {
    await apiClient.delete(`/${params.tenantSlug}/files/${params.id}`);
  },

  getDownloadUrl: async (params: { tenantSlug: string; id: string }): Promise<string> => {
    const res = await apiClient.get<ApiResponse<{ url: string }>>(
      `/${params.tenantSlug}/files/${params.id}/download-url`
    );
    return res.data.data.url;
  },
};
