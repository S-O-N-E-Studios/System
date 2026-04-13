import apiClient from './client';
import type { TemporaryAccess, TemporaryAccessStatus } from '@/types';

function extractStringArray(value: unknown): string[] | null {
  if (!value) return null;
  if (Array.isArray(value) && value.every((v) => typeof v === 'string')) return value;
  return null;
}

function extractExpiresAt(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return null;
}

export async function clientAccessCheck(params: {
  tenantSlug: string;
  projectId: string;
}): Promise<{
  allowedProjectIds: string[];
  expiresAt: string | null;
}> {
  const res = await apiClient.get<unknown>(
    `/${params.tenantSlug}/projects/${params.projectId}/client-access-check`
  );

  const payload: unknown = (res as { data: unknown }).data;
  const body: unknown =
    payload && typeof payload === 'object' && 'data' in payload
      ? (payload as { data: unknown }).data
      : payload;

  const bodyRecord =
    body && typeof body === 'object' ? (body as Record<string, unknown>) : null;

  const allowedProjectIds =
    extractStringArray(bodyRecord?.allowedProjectIds) ??
    extractStringArray(bodyRecord?.projectIds) ??
    extractStringArray(bodyRecord?.allowed) ??
    [];

  const expiresAt =
    extractExpiresAt(bodyRecord?.expiresAt) ??
    extractExpiresAt(bodyRecord?.expiry) ??
    null;

  return { allowedProjectIds, expiresAt };
}

export async function fetchClientAccessGrants(params: {
  tenantSlug: string;
  status?: TemporaryAccessStatus;
}): Promise<{
  grants: TemporaryAccess[];
  allowedProjectIds: string[];
  expiresAt: string | null;
}> {
  const res = await apiClient.get<unknown>(`/${params.tenantSlug}/client-access`, {
    params: { status: params.status ?? 'active' },
  });

  const axiosData: unknown = (res as { data: unknown }).data;
  const payload: unknown =
    axiosData && typeof axiosData === 'object' && 'data' in axiosData
      ? (axiosData as { data: unknown }).data
      : axiosData;

  const grants: TemporaryAccess[] = Array.isArray(payload)
    ? payload.filter(Boolean).map((g) => g as TemporaryAccess)
    : [];

  const allowedProjectIds = grants.flatMap((g) => g.projectIds ?? []);
  const sortedExpiry = grants
    .map((g) => g.expiresAt)
    .filter((v): v is string => typeof v === 'string')
    .sort();
  const expiresAt = sortedExpiry.length > 0 ? sortedExpiry[0] : null;

  return { grants, allowedProjectIds, expiresAt };
}

export async function fetchClientTempScope(params: {
  tenantSlug: string;
}): Promise<{ allowedProjectIds: string[]; expiresAt: string | null }> {
  try {
    const { allowedProjectIds, expiresAt } = await fetchClientAccessGrants({
      tenantSlug: params.tenantSlug,
      status: 'active',
    });
    return { allowedProjectIds, expiresAt };
  } catch {
    return { allowedProjectIds: [], expiresAt: null };
  }
}
