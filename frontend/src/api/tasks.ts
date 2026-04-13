import apiClient from './client';
import { useTenantStore } from '@/store/tenantStore';
import type { Task, Sprint, ApiResponse } from '@/types';

function slug() {
  return useTenantStore.getState().getSlug() || '';
}

interface CreateTaskData {
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignedTo?: string;
  projectId?: string;
  sprintId?: string;
  dueDate?: string;
}

export const tasksApi = {
  list: async (params?: { sprintId?: string; projectId?: string; status?: string }): Promise<{ tasks: Task[]; total: number }> => {
    try {
      const res = await apiClient.get<ApiResponse<{ tasks: Task[]; total: number }>>(`/${slug()}/tasks`, { params });
      return res.data.data;
    } catch {
      return { tasks: [], total: 0 };
    }
  },

  create: async (data: CreateTaskData): Promise<Task> => {
    const res = await apiClient.post<ApiResponse<{ task: Task }>>(`/${slug()}/tasks`, data);
    return res.data.data.task;
  },

  update: async (id: string, data: Partial<CreateTaskData>): Promise<Task> => {
    const res = await apiClient.patch<ApiResponse<{ task: Task }>>(`/${slug()}/tasks/${id}`, data);
    return res.data.data.task;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/${slug()}/tasks/${id}`);
  },
};

export const sprintsApi = {
  list: async (): Promise<Sprint[]> => {
    try {
      const res = await apiClient.get<ApiResponse<{ sprints: Sprint[] }>>(`/${slug()}/sprints`);
      const data = res.data?.data;
      return Array.isArray(data) ? data : (data as Record<string, unknown>)?.sprints as Sprint[] || [];
    } catch {
      return [];
    }
  },
};
