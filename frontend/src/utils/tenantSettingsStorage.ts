export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'suspended';
};

const orgKey = (slug: string) => `p360-org-general:${slug}`;
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

