import apiClient from './client';
import { authMock } from './authMock';
import type { User, AuthTokens, ApiResponse } from '@/types';

/** Use mock auth when backend/DB is not set up. Set VITE_USE_MOCK_AUTH=false to use real API. */
const useMockAuth = import.meta.env.VITE_USE_MOCK_AUTH !== 'false';

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
}

interface CheckSlugResponse {
  available: boolean;
  suggestion?: string;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    if (useMockAuth) return authMock.login(data);
    const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data);
    return res.data.data;
  },

  registerOrg: async (data: RegisterOrgRequest): Promise<LoginResponse> => {
    if (useMockAuth) return authMock.registerOrg(data);
    const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/register-org', data);
    return res.data.data;
  },

  checkSlug: async (slug: string): Promise<CheckSlugResponse> => {
    if (useMockAuth) return authMock.checkSlug(slug);
    const res = await apiClient.get<ApiResponse<CheckSlugResponse>>(`/auth/check-slug/${slug}`);
    return res.data.data;
  },

  acceptInvite: async (token: string, password: string): Promise<LoginResponse> => {
    if (useMockAuth) return authMock.acceptInvite(token, password);
    const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/accept-invite', {
      token,
      password,
    });
    return res.data.data;
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> => {
    if (useMockAuth) return authMock.changePassword();
    await apiClient.post('/auth/change-password', data);
  },

  refreshToken: async (refreshToken: string): Promise<AuthTokens> => {
    if (useMockAuth) return authMock.refreshToken();
    const res = await apiClient.post<ApiResponse<AuthTokens>>('/auth/refresh', { refreshToken });
    return res.data.data;
  },

  getMe: async (): Promise<User> => {
    if (useMockAuth) return authMock.getMe();
    const res = await apiClient.get<ApiResponse<User>>('/auth/me');
    return res.data.data;
  },
};
