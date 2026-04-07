import apiClient from './client';
import type { TemporaryAccess, TemporaryAccessStatus } from '@/types';
import {
  MOCK_CLIENT_TEMP_ALLOWED_PROJECT_IDS,
  mockClientTempExpiresAtIso,
} from '@/mocks/clientTempScope';

const useMockAuth = import.meta.env.VITE_USE_MOCK_AUTH !== 'false';

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

/**
 * CLIENT_TEMP scope check.
 *
 * Backend contract (v6.0):
 * GET /:tenantSlug/projects/:id/client-access-check
 * Returns whether the current user is a CLIENT_TEMP and the allowed project scope.
 *
 * We keep response parsing defensive because the backend may wrap in `{ data: ... }`.
 */
export async function clientAccessCheck(params: {
  tenantSlug: string;
  projectId: string;
}): Promise<{
  allowedProjectIds: string[];
  expiresAt: string | null;
}> {
  if (useMockAuth) {
    // Minimal mock scope for frontend-only development.
    // `ClientGuard` will deny if the projectId isn't in allowedProjectIds.
    return {
      allowedProjectIds: [...MOCK_CLIENT_TEMP_ALLOWED_PROJECT_IDS],
      expiresAt: mockClientTempExpiresAtIso(),
    };
  }

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

/**
 * Best-effort helper for CLIENT_TEMP UX:
 * - Used to show the expiry banner on /projects list and to scope project list.
 *
 * Backend contract says Org Admin role, but we call defensively and ignore failures.
 */
export async function fetchClientAccessGrants(params: {
  tenantSlug: string;
  status?: TemporaryAccessStatus;
}): Promise<{
  grants: TemporaryAccess[];
  allowedProjectIds: string[];
  expiresAt: string | null;
}> {
  if (useMockAuth) {
    const expiresAt = mockClientTempExpiresAtIso();
    return {
      grants: [
        {
          id: 'mock-temp-grant',
          tenantId: params.tenantSlug,
          grantedBy: 'mock-user',
          clientEmail: 'client@example.com',
          projectIds: [...MOCK_CLIENT_TEMP_ALLOWED_PROJECT_IDS],
          expiresAt,
          grantedAt: new Date().toISOString(),
          status: 'active',
          extensionHistory: [],
        },
      ],
      allowedProjectIds: [...MOCK_CLIENT_TEMP_ALLOWED_PROJECT_IDS],
      expiresAt,
    };
  }

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

const scopeDelay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * CLIENT_TEMP list/banner hydration without requiring the org-admin `GET /client-access` route.
 * In mock mode this mirrors `clientAccessCheck` scope; with a real backend it falls back to grants.
 */
export async function fetchClientTempScope(params: {
  tenantSlug: string;
}): Promise<{ allowedProjectIds: string[]; expiresAt: string | null }> {
  if (useMockAuth) {
    await scopeDelay(120);
    return {
      allowedProjectIds: [...MOCK_CLIENT_TEMP_ALLOWED_PROJECT_IDS],
      expiresAt: mockClientTempExpiresAtIso(),
    };
  }

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

