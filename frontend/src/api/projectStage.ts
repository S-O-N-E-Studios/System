import apiClient from './client';
import { useTenantStore } from '@/store/tenantStore';
import type { ProjectStage } from '@/types';

function slug() {
  return useTenantStore.getState().getSlug() || '';
}

export interface StageMissingDoc {
  documentName?: string;
  category: string;
  reason?: string;
}

export interface StageStatusResponse {
  currentStage: ProjectStage;
  gatePassed: boolean;
  missing: StageMissingDoc[];
}

export async function fetchProjectStageStatus(params: {
  tenantSlug: string;
  projectId: string;
}): Promise<StageStatusResponse> {
  const tenantSlug = params.tenantSlug || slug();
  const res = await apiClient.get(`/${tenantSlug}/projects/${params.projectId}/stage-status`);
  const data = res.data?.data || res.data;

  return {
    currentStage: data.currentStage as ProjectStage,
    gatePassed: data.gatePassed ?? false,
    missing: Array.isArray(data.missing) ? data.missing : [],
  };
}

export async function advanceProjectStage(params: {
  tenantSlug: string;
  projectId: string;
}): Promise<void> {
  const tenantSlug = params.tenantSlug || slug();
  await apiClient.post(`/${tenantSlug}/projects/${params.projectId}/advance-stage`);
}
