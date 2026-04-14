import apiClient from './client';
import { useTenantStore } from '@/store/tenantStore';
import type { ApiResponse, OrgType } from '@/types';

function slug() {
  return useTenantStore.getState().getSlug() || '';
}

export type OutboundEmailSettings = {
  enabled: boolean;
  host: string | null;
  port: number;
  secure: boolean;
  authUser: string | null;
  /** Present on GET when a password was stored; never returned as plaintext. */
  authPassSet?: boolean;
  fromName: string | null;
  fromAddress: string | null;
  replyTo: string | null;
};

export type Organization = {
  _id: string;
  slug: string;
  name: string;
  orgType?: OrgType;
  primaryContact?: string | null;
  logoUrl?: string | null;
  localMunicipalities?: string[];
  theme?: Record<string, unknown>;
  outboundEmail?: OutboundEmailSettings;
};

export type OrganizationPatch = Partial<
  Pick<Organization, 'name' | 'primaryContact' | 'logoUrl' | 'localMunicipalities' | 'theme'>
> & {
  outboundEmail?: Partial<OutboundEmailSettings> & { authPass?: string };
};

export const organizationApi = {
  get: async (): Promise<Organization> => {
    const res = await apiClient.get<ApiResponse<{ organization: Organization }>>(`/${slug()}/organizations`);
    return res.data.data.organization;
  },

  update: async (body: OrganizationPatch): Promise<Organization> => {
    const res = await apiClient.patch<ApiResponse<{ organization: Organization }>>(`/${slug()}/organizations`, body);
    return res.data.data.organization;
  },

  /** Multipart field name: `file` (JPEG/PNG/WebP/GIF, max 2MB). Org admin only. */
  uploadLogo: async (file: File): Promise<Organization> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await apiClient.post<ApiResponse<{ organization: Organization; logoUrl: string }>>(
      `/${slug()}/organizations/logo`,
      fd,
    );
    return res.data.data.organization;
  },
};
