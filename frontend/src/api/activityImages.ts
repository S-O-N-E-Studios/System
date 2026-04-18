import apiClient from './client';
import { mediaApi } from './media';

export async function uploadActivityImage(params: {
  tenantSlug: string;
  projectId: string;
  activityId: string;
  file: File;
  caption?: string;
}): Promise<void> {
  // Route expects an existing fileId, so upload to media first then attach.
  const upload = await mediaApi.getUploadUrl(params.projectId, params.file.name);
  const uploadResp = await fetch(upload.url, {
    method: 'PUT',
    headers: { 'Content-Type': params.file.type || 'application/octet-stream' },
    body: params.file,
  });
  if (!uploadResp.ok) {
    throw new Error('Presigned activity image upload failed');
  }

  const media = await mediaApi.register(params.projectId, {
    originalName: params.file.name,
    storagePath: upload.key,
    mimeType: params.file.type || 'application/octet-stream',
    sizeBytes: params.file.size,
    mediaType: 'image',
    activityId: params.activityId,
    description: params.caption,
  });
  const fileId = (media as { id?: string; _id?: string }).id || (media as { id?: string; _id?: string })._id;
  if (!fileId) {
    throw new Error('Activity image registration failed');
  }

  await apiClient.post(`/${params.tenantSlug}/projects/${params.projectId}/activities/${params.activityId}/images`, {
    fileId,
    caption: params.caption || '',
  });
}

export async function removeActivityImage(params: {
  tenantSlug: string;
  projectId: string;
  activityId: string;
  imageId: string;
}): Promise<void> {
  await apiClient.delete(
    `/${params.tenantSlug}/projects/${params.projectId}/activities/${params.activityId}/images/${params.imageId}`
  );
}

