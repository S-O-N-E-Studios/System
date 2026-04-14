import apiClient from './client';
import { useTenantStore } from '@/store/tenantStore';
import type { Activity, ApiResponse } from '@/types';

function slug() {
  return useTenantStore.getState().getSlug() || '';
}

function mapActivity(raw: Record<string, unknown>): Activity {
  return {
    id: String(raw._id ?? raw.id ?? ''),
    tenantId: String(raw.tenantId ?? ''),
    projectId: String(raw.projectId ?? ''),
    name: String(raw.name ?? ''),
    startDate: raw.startDate ? new Date(raw.startDate as string).toISOString() : '',
    endDate: raw.endDate ? new Date(raw.endDate as string).toISOString() : '',
    status: (raw.status as Activity['status']) || 'pending',
    expectedFunds: Number(raw.expectedFunds ?? 0),
    actualFunds: Number(raw.actualFunds ?? 0),
    supportingImages: Array.isArray(raw.supportingImages)
      ? (raw.supportingImages as Record<string, unknown>[]).map((img) => ({
          fileId: String(img.fileId ?? img._id ?? ''),
          uploadedBy: String(img.uploadedBy ?? ''),
          uploadedAt: img.uploadedAt ? new Date(img.uploadedAt as string).toISOString() : '',
          caption: img.caption ? String(img.caption) : undefined,
        }))
      : [],
    createdAt: raw.createdAt ? new Date(raw.createdAt as string).toISOString() : '',
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt as string).toISOString() : '',
  };
}

export const activitiesApi = {
  list: async (projectId: string): Promise<Activity[]> => {
    const res = await apiClient.get<ApiResponse<{ activities: Record<string, unknown>[] }>>(
      `/${slug()}/projects/${projectId}/activities`,
    );
    const rows = res.data.data?.activities ?? [];
    return rows.map((r) => mapActivity(r));
  },
};
