import apiClient from './client';
import { useTenantStore } from '@/store/tenantStore';
import type { User, ApiResponse } from '@/types';

function slug() {
  return useTenantStore.getState().getSlug() || '';
}

interface InviteUserData {
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

type ListMembersPayload = { members: User[]; total: number; page: number; limit: number };

export const usersApi = {
  list: async (): Promise<User[]> => {
    const res = await apiClient.get<ApiResponse<ListMembersPayload | User[]>>(`/${slug()}/users`);
    const data = res.data.data as ListMembersPayload | User[] | undefined;
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && 'members' in data) return data.members ?? [];
    return [];
  },

  invite: async (data: InviteUserData): Promise<void> => {
    const role = data.role === 'PROJECT_MANAGER' ? 'PM' : data.role;
    await apiClient.post(`/${slug()}/users/invite`, { ...data, role });
  },

  updateProfile: async (body: { fullName?: string; avatarUrl?: string | null }): Promise<User> => {
    const res = await apiClient.patch<ApiResponse<{ user: User }>>(`/${slug()}/users/me`, body);
    const d = res.data.data;
    return d.user;
  },

  /** Multipart field name: `file` (JPEG/PNG/WebP/GIF, max 2MB). */
  uploadAvatar: async (file: File): Promise<{ user: User; avatarUrl: string }> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await apiClient.post<ApiResponse<{ user: User; avatarUrl: string }>>(
      `/${slug()}/users/me/avatar`,
      fd,
    );
    return res.data.data;
  },

  updateRole: async (userId: string, role: string): Promise<User> => {
    const res = await apiClient.patch<ApiResponse<{ user: User }>>(`/${slug()}/users/${userId}/role`, { role });
    return res.data.data.user;
  },

  suspend: async (userId: string): Promise<void> => {
    await apiClient.post(`/${slug()}/users/${userId}/suspend`);
  },

  reactivate: async (userId: string): Promise<void> => {
    await apiClient.post(`/${slug()}/users/${userId}/reactivate`);
  },
};
