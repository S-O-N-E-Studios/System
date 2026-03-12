import apiClient from './client';
import type { Task, Sprint, ApiResponse, PaginatedResponse } from '@/types';

interface CreateTaskData {
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigneeId?: string;
  projectId?: string;
  sprintId?: string;
  dueDate?: string;
}

export const tasksApi = {
  list: async (sprintId?: string): Promise<PaginatedResponse<Task>> => {
    const params = sprintId ? { sprintId } : {};
    const res = await apiClient.get<PaginatedResponse<Task>>('/tasks', { params });
    return res.data;
  },

  create: async (data: CreateTaskData): Promise<Task> => {
    const res = await apiClient.post<ApiResponse<Task>>('/tasks', data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<CreateTaskData>): Promise<Task> => {
    const res = await apiClient.patch<ApiResponse<Task>>(`/tasks/${id}`, data);
    return res.data.data;
  },

  updateStatus: async (id: string, status: string): Promise<Task> => {
    const res = await apiClient.patch<ApiResponse<Task>>(`/tasks/${id}/status`, { status });
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },
};

export const sprintsApi = {
  list: async (): Promise<Sprint[]> => {
    const res = await apiClient.get<ApiResponse<Sprint[]>>('/sprints');
    return res.data.data;
  },

  getActive: async (): Promise<Sprint | null> => {
    const res = await apiClient.get<ApiResponse<Sprint | null>>('/sprints/active');
    return res.data.data;
  },
};
