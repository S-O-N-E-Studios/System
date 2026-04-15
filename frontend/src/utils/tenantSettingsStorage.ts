export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'suspended';
};

const orgKey = (slug: string) => `p360-org-general:${slug}`;
const notifyKey = (slug: string) => `p360-notify-prefs:${slug}`;

export type OrgGeneralStored = {
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
