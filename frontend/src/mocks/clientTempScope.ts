/**
 * Single source of truth for CLIENT_TEMP mock scope (aligned with portfolio mock ids).
 * Backend still being developed; real users fall through to `fetchClientAccessGrants` where applicable.
 */
export const MOCK_CLIENT_TEMP_ALLOWED_PROJECT_IDS: readonly string[] = ['1'];

export function mockClientTempExpiresAtIso(): string {
  return new Date(Date.now() + 3 * 24 * 3_600_000).toISOString();
}
