import apiClient from './client';
import type { User, ApiResponse } from '@/types';

interface InviteUserData {
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

export const usersApi = {
  list: async (): Promise<User[]> => {
    const res = await apiClient.get<ApiResponse<User[]>>('/users');
    return res.data.data;
  },

  invite: async (data: InviteUserData): Promise<void> => {
    await apiClient.post('/users/invite', data);
  },

  updateRole: async (userId: string, role: string): Promise<User> => {
    const res = await apiClient.patch<ApiResponse<User>>(`/users/${userId}/role`, { role });
    return res.data.data;
  },

  suspend: async (userId: string): Promise<void> => {
    await apiClient.post(`/users/${userId}/suspend`);
  },

  reactivate: async (userId: string): Promise<void> => {
    await apiClient.post(`/users/${userId}/reactivate`);
  },
};
