import apiClient from './client';

export async function uploadActivityImage(params: {
  tenantSlug: string;
  projectId: string;
  activityId: string;
  file: File;
  caption?: string;
}): Promise<void> {
  const formData = new FormData();
  formData.append('file', params.file);
  if (params.caption) formData.append('caption', params.caption);

  await apiClient.post(
    `/${params.tenantSlug}/projects/${params.projectId}/activities/${params.activityId}/images`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
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

