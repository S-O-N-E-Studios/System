import apiClient from './client';
import type { User, AuthTokens, ApiResponse } from '@/types';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

interface RegisterOrgRequest {
  orgName: string;
  slug: string;
  orgType: 'provincial_gov' | 'private_firm';
  industryType: string;
  primaryContactName: string;
  primaryContactEmail: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  localMunicipalityIds?: string[];
}

interface CheckSlugResponse {
  available: boolean;
  suggestion?: string;
}

function mapBackendUser(raw: Record<string, unknown>): User {
  return {
    id: (raw._id || raw.id || '') as string,
    email: (raw.email || '') as string,
    firstName: ((raw.fullName as string) || '').split(' ')[0] || '',
    lastName: ((raw.fullName as string) || '').split(' ').slice(1).join(' ') || '',
    fullName: (raw.fullName || '') as string,
    role: (raw.role || 'MEMBER') as User['role'],
    avatarUrl: (raw.avatarUrl || undefined) as string | undefined,
    isActive: raw.isActive === false ? false : true,
    tenants: Array.isArray(raw.tenants)
      ? raw.tenants.map((t: Record<string, unknown>) => ({
          id: (t.tenantId || t.id || '') as string,
          slug: (t.tenantSlug || t.slug || '') as string,
          name: (t.name || t.tenantSlug || '') as string,
          role: (t.role || 'MEMBER') as User['role'],
          deptId: (t.deptId || undefined) as string | undefined,
        }))
      : [],
    temporaryAccessId: (raw.temporaryAccessId || undefined) as string | undefined,
    lastLoginAt: (raw.lastLoginAt || undefined) as string | undefined,
  };
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await apiClient.post('/auth/login', data);
    const body = res.data?.data || res.data;
    const user = mapBackendUser(body.user || body);
    return {
      user,
      tokens: { accessToken: body.accessToken, refreshToken: body.refreshToken },
    };
  },

  registerOrg: async (data: RegisterOrgRequest): Promise<LoginResponse> => {
    const payload = {
      fullName: `${data.adminFirstName} ${data.adminLastName}`,
      email: data.adminEmail,
      password: data.adminPassword,
      orgName: data.orgName,
      orgType: data.orgType,
      orgSlug: data.slug,
      localMunicipalities: data.localMunicipalityIds,
    };
    const res = await apiClient.post('/auth/register-org', payload);
    const body = res.data?.data || res.data;
    const user = mapBackendUser(body.user || body);
    return {
      user,
      tokens: { accessToken: body.accessToken, refreshToken: body.refreshToken },
    };
  },

  checkSlug: async (slugVal: string): Promise<CheckSlugResponse> => {
    const res = await apiClient.get<ApiResponse<CheckSlugResponse>>(`/auth/check-slug/${slugVal}`);
    return res.data.data;
  },

  acceptInvite: async (token: string, password: string): Promise<LoginResponse> => {
    const res = await apiClient.post(`/auth/accept-invite/${token}`, { fullName: 'Invited User', password });
    const body = res.data?.data || res.data;
    const user = mapBackendUser(body.user || body);
    return {
      user,
      tokens: { accessToken: body.accessToken, refreshToken: body.refreshToken },
    };
  },

  clientActivate: async (token: string, data: { password: string }): Promise<LoginResponse> => {
    const res = await apiClient.post(`/auth/client-activate/${token}`, { password: data.password });
    const body = res.data?.data || res.data;
    const user = mapBackendUser(body.user || body);
    return {
      user,
      tokens: { accessToken: body.accessToken, refreshToken: body.refreshToken },
    };
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    await apiClient.post('/auth/change-password', data);
  },

  refreshToken: async (refreshToken?: string): Promise<AuthTokens> => {
    const res = refreshToken
      ? await apiClient.post('/auth/refresh', { refreshToken })
      : await apiClient.post('/auth/refresh');
    const body = res.data?.data || res.data;
    return { accessToken: body.accessToken, refreshToken: body.refreshToken };
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get<ApiResponse<{ user: Record<string, unknown> }>>('/auth/me');
    const body = res.data?.data ?? res.data;
    const raw =
      body && typeof body === 'object' && 'user' in body
        ? (body as { user: Record<string, unknown> }).user
        : (body as Record<string, unknown>);
    return mapBackendUser(raw);
  },
};
