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
    const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data);
    return res.data.data;
  },

  registerOrg: async (data: RegisterOrgRequest): Promise<LoginResponse> => {
    const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/register-org', data);
    return res.data.data;
  },

  checkSlug: async (slug: string): Promise<CheckSlugResponse> => {
    const res = await apiClient.get<ApiResponse<CheckSlugResponse>>(`/auth/check-slug/${slug}`);
    return res.data.data;
  },

  acceptInvite: async (token: string, password: string): Promise<LoginResponse> => {
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
    await apiClient.post('/auth/change-password', data);
  },

  refreshToken: async (refreshToken: string): Promise<AuthTokens> => {
    const res = await apiClient.post<ApiResponse<AuthTokens>>('/auth/refresh', { refreshToken });
    return res.data.data;
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get<ApiResponse<User>>('/auth/me');
    return res.data.data;
  },
};
