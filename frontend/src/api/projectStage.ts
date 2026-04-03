import apiClient from './client';
import type { ProjectStage } from '@/types';

export interface StageMissingDoc {
  documentName: string;
  category: string;
}

export interface StageStatusResponse {
  currentStage: ProjectStage;
  gatePassed: boolean;
  missing: StageMissingDoc[];
}

function unwrapApiData(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') return payload;
  if (!('data' in payload)) return payload;
  return (payload as { data: unknown }).data;
}

function isProjectStage(value: unknown): value is ProjectStage {
  if (typeof value !== 'number') return false;
  return [1, 2, 3, 4, 5, 6].includes(value);
}

export async function fetchProjectStageStatus(params: {
  tenantSlug: string;
  projectId: string;
}): Promise<StageStatusResponse> {
  const res = await apiClient.get<unknown>(
    `/${params.tenantSlug}/projects/${params.projectId}/stage-status`
  );

  const body = unwrapApiData(res.data);
  const record = body && typeof body === 'object' ? (body as Record<string, unknown>) : null;

  const currentStage = record?.currentStage;
  const gatePassed = record?.gatePassed;
  const missing = record?.missing;

  const missingDocs: StageMissingDoc[] = Array.isArray(missing)
    ? missing
        .map((m) => {
          if (!m || typeof m !== 'object') return null;
          const r = m as Record<string, unknown>;
          const documentName = r.documentName;
          const category = r.category;
          if (typeof documentName !== 'string' || typeof category !== 'string') return null;
          return { documentName, category };
        })
        .filter((v): v is StageMissingDoc => v != null)
    : [];

  if (!isProjectStage(currentStage) || typeof gatePassed !== 'boolean') {
    throw new Error('Invalid stage-status response shape');
  }

  return { currentStage, gatePassed, missing: missingDocs };
}

export async function advanceProjectStage(params: {
  tenantSlug: string;
  projectId: string;
}): Promise<void> {
  await apiClient.post(
    `/${params.tenantSlug}/projects/${params.projectId}/advance-stage`,
    {}
  );
}

