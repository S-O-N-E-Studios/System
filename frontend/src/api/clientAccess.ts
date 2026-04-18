import apiClient from './client';
import type { TemporaryAccess, TemporaryAccessStatus, AccessExtension } from '@/types';

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

/** Axios `response.data` → inner `data` payload from `sendSuccess`. */
function unwrapApiBody(axiosData: unknown): unknown {
  if (axiosData && typeof axiosData === 'object' && 'data' in axiosData) {
    return (axiosData as { data: unknown }).data;
  }
  return axiosData;
}

function mapAccessRow(raw: Record<string, unknown>): TemporaryAccess {
  const projectIds = (Array.isArray(raw.projectIds) ? raw.projectIds : []).map((id) => String(id));
  return {
    id: String(raw._id ?? raw.id ?? ''),
    tenantId: String(raw.tenantId ?? ''),
    grantedBy: String(raw.grantedBy ?? ''),
    clientEmail: String(raw.clientEmail ?? ''),
    projectIds,
    expiresAt: raw.expiresAt ? new Date(raw.expiresAt as string).toISOString() : '',
    grantedAt: raw.createdAt ? new Date(raw.createdAt as string).toISOString() : '',
    status: (raw.status as TemporaryAccess['status']) || 'pending',
    extensionHistory: Array.isArray(raw.extensionHistory)
      ? (raw.extensionHistory as AccessExtension[])
      : [],
    notes: typeof raw.notes === 'string' ? raw.notes : undefined,
    revokedAt: raw.revokedAt ? new Date(raw.revokedAt as string).toISOString() : undefined,
    revokedBy: raw.revokedBy ? String(raw.revokedBy) : undefined,
  };
}

export async function clientAccessCheck(params: {
  tenantSlug: string;
  projectId: string;
}): Promise<{
  allowedProjectIds: string[];
  expiresAt: string | null;
}> {
  const res = await apiClient.get<unknown>(
    `/${params.tenantSlug}/projects/${params.projectId}/client-access-check`,
  );

  const body = unwrapApiBody(res.data);
  const bodyRecord = body && typeof body === 'object' ? (body as Record<string, unknown>) : null;

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

export const clientAccessApi = {
  list: async (tenantSlug: string, status?: TemporaryAccessStatus): Promise<TemporaryAccess[]> => {
    const res = await apiClient.get(`/${tenantSlug}/client-access`, {
      params: status ? { status } : undefined,
    });
    const payload = unwrapApiBody(res.data);
    const rows =
      payload && typeof payload === 'object' && 'access' in (payload as object)
        ? (payload as { access: unknown }).access
        : payload;
    if (!Array.isArray(rows)) return [];
    return rows.map((r) => mapAccessRow(r as Record<string, unknown>));
  },

  extend: async (tenantSlug: string, id: string, expiresAt: string): Promise<void> => {
    await apiClient.patch(`/${tenantSlug}/client-access/${id}/extend`, { expiresAt });
  },

  revoke: async (tenantSlug: string, id: string): Promise<void> => {
    await apiClient.patch(`/${tenantSlug}/client-access/${id}/revoke`);
  },

  grant: async (
    tenantSlug: string,
    payload: {
      clientEmail: string;
      projectIds: string[];
      expiresAt: string;
      canApproveDocuments?: boolean;
    }
  ): Promise<void> => {
    await apiClient.post(`/${tenantSlug}/client-access`, payload);
  },
};

export async function fetchClientAccessGrants(params: {
  tenantSlug: string;
  status?: TemporaryAccessStatus;
}): Promise<{
  grants: TemporaryAccess[];
  allowedProjectIds: string[];
  expiresAt: string | null;
}> {
  const grants = await clientAccessApi.list(params.tenantSlug, params.status ?? 'active');
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
