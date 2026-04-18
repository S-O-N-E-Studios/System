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

export interface StageRequiredDoc {
  documentName: string;
  category: string;
  group?: string;
}

export interface StageStatusResponse {
  currentStage: ProjectStage;
  gatePassed: boolean;
  missing: StageMissingDoc[];
  requiredDocuments: StageRequiredDoc[];
  workflowProfile?: string;
  stageRequirements?: Record<string, StageRequiredDoc[]>;
  stage7Readiness?: {
    periods: Array<{
      period: string;
      progressReportPresent: boolean;
      safetyReportPresent: boolean;
      cashFlowPresent: boolean;
      paymentCertificateCount: number;
      evidenceImageCount: number;
      reportingComplete: boolean;
      evidenceMinimum: number;
      evidenceSufficient: boolean;
    }>;
    pendingVariationCount: number;
  } | null;
  activitiesMissingImages?: Array<{
    activityId: string;
    name: string;
    imageCount: number;
    required: number;
  }>;
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
    requiredDocuments: Array.isArray(data.requiredDocuments) ? data.requiredDocuments : [],
    workflowProfile: typeof data.workflowProfile === 'string' ? data.workflowProfile : undefined,
    stageRequirements:
      data.stageRequirements && typeof data.stageRequirements === 'object'
        ? (data.stageRequirements as Record<string, StageRequiredDoc[]>)
        : undefined,
    stage7Readiness:
      data.stage7Readiness && typeof data.stage7Readiness === 'object'
        ? (data.stage7Readiness as StageStatusResponse['stage7Readiness'])
        : null,
    activitiesMissingImages: Array.isArray(data.activitiesMissingImages)
      ? data.activitiesMissingImages
      : [],
  };
}

export async function advanceProjectStage(params: {
  tenantSlug: string;
  projectId: string;
}): Promise<void> {
  const tenantSlug = params.tenantSlug || slug();
  await apiClient.post(`/${tenantSlug}/projects/${params.projectId}/advance-stage`);
}
