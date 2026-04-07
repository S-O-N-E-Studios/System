import type { MockSettingsTeamMember } from '@/mocks/settingsTeamMembers';
import { DEFAULT_MOCK_TEAM_MEMBERS } from '@/mocks/settingsTeamMembers';

const orgKey = (slug: string) => `p360-org-general:${slug}`;
const notifyKey = (slug: string) => `p360-notify-prefs:${slug}`;
const teamKey = (slug: string) => `p360-mock-team:${slug}`;

export type OrgGeneralStored = {
  /** Local demo override; real tenant name still comes from auth until API sync exists. */
  orgName: string;
  primaryContact: string;
  address: string;
  timezone: string;
};

export function loadOrgGeneral(tenantSlug: string | undefined): OrgGeneralStored {
  const defaults: OrgGeneralStored = {
    orgName: '',
    primaryContact: '',
    address: '',
    timezone: 'Africa/Johannesburg',
  };
  if (!tenantSlug || typeof window === 'undefined') return defaults;
  try {
    const raw = localStorage.getItem(orgKey(tenantSlug));
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<OrgGeneralStored>;
    return {
      orgName: typeof parsed.orgName === 'string' ? parsed.orgName : '',
      primaryContact: typeof parsed.primaryContact === 'string' ? parsed.primaryContact : '',
      address: typeof parsed.address === 'string' ? parsed.address : '',
      timezone: typeof parsed.timezone === 'string' ? parsed.timezone : defaults.timezone,
    };
  } catch {
    return defaults;
  }
}

export function saveOrgGeneral(tenantSlug: string, data: OrgGeneralStored): boolean {
  try {
    localStorage.setItem(orgKey(tenantSlug), JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

const NOTIFY_LABELS = [
  'Project updates',
  'Task assignments',
  'Report submissions',
  'Deadline reminders',
  'Team invitations',
] as const;

export type NotificationPrefKey = (typeof NOTIFY_LABELS)[number];

export function defaultNotificationPrefs(): Record<NotificationPrefKey, boolean> {
  return Object.fromEntries(NOTIFY_LABELS.map((k) => [k, true])) as Record<NotificationPrefKey, boolean>;
}

export function loadNotificationPrefs(tenantSlug: string | undefined): Record<NotificationPrefKey, boolean> {
  const base = defaultNotificationPrefs();
  if (!tenantSlug || typeof window === 'undefined') return base;
  try {
    const raw = localStorage.getItem(notifyKey(tenantSlug));
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    const next = { ...base };
    for (const k of NOTIFY_LABELS) {
      if (typeof parsed[k] === 'boolean') next[k] = parsed[k];
    }
    return next;
  } catch {
    return base;
  }
}

export function saveNotificationPrefs(tenantSlug: string, prefs: Record<NotificationPrefKey, boolean>): boolean {
  try {
    localStorage.setItem(notifyKey(tenantSlug), JSON.stringify(prefs));
    return true;
  } catch {
    return false;
  }
}

export { NOTIFY_LABELS };

export function loadTeamMembers(tenantSlug: string | undefined): MockSettingsTeamMember[] {
  if (!tenantSlug || typeof window === 'undefined') return [...DEFAULT_MOCK_TEAM_MEMBERS];
  try {
    const raw = localStorage.getItem(teamKey(tenantSlug));
    if (!raw) return [...DEFAULT_MOCK_TEAM_MEMBERS];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...DEFAULT_MOCK_TEAM_MEMBERS];
    const cleaned = parsed.filter(
      (row): row is MockSettingsTeamMember =>
        !!row &&
        typeof row === 'object' &&
        typeof (row as MockSettingsTeamMember).id === 'string' &&
        typeof (row as MockSettingsTeamMember).email === 'string',
    );
    return cleaned.length > 0 ? cleaned : [...DEFAULT_MOCK_TEAM_MEMBERS];
  } catch {
    return [...DEFAULT_MOCK_TEAM_MEMBERS];
  }
}

export function saveTeamMembers(tenantSlug: string, members: MockSettingsTeamMember[]): boolean {
  try {
    localStorage.setItem(teamKey(tenantSlug), JSON.stringify(members));
    return true;
  } catch {
    return false;
  }
}
