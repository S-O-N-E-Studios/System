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

function toApiStatus(status: string | undefined): string | undefined {
  if (!status) return undefined;
  if (status === 'backlog') return 'todo';
  if (status === 'in_progress') return 'in-progress';
  if (status === 'in_review') return 'review';
  return status;
}

function fromApiStatus(status: string | undefined): Task['status'] {
  if (status === 'todo') return 'backlog';
  if (status === 'in-progress') return 'in_progress';
  if (status === 'review') return 'in_review';
  if (status === 'done') return 'done';
  return 'backlog';
}

function mapTask(raw: Task & { _id?: string; assignedTo?: unknown }): Task {
  return {
    ...raw,
    id: raw.id || raw._id || '',
    status: fromApiStatus(raw.status),
    assigneeId:
      typeof raw.assigneeId === 'string'
        ? raw.assigneeId
        : raw.assignedTo && typeof raw.assignedTo === 'object' && '_id' in (raw.assignedTo as object)
          ? String((raw.assignedTo as { _id?: unknown })._id ?? '')
          : undefined,
    assigneeName:
      raw.assigneeName ||
      (raw.assignedTo && typeof raw.assignedTo === 'object' && 'fullName' in (raw.assignedTo as object)
        ? String((raw.assignedTo as { fullName?: unknown }).fullName ?? '')
        : undefined),
  };
}

export const tasksApi = {
  list: async (params?: { sprintId?: string; projectId?: string; status?: string }): Promise<{ tasks: Task[]; total: number }> => {
    const res = await apiClient.get<ApiResponse<{ tasks: Task[]; total: number }>>(`/${slug()}/tasks`, {
      params: {
        ...params,
        status: toApiStatus(params?.status),
      },
    });
    return {
      tasks: (res.data.data.tasks || []).map(mapTask),
      total: res.data.data.total || 0,
    };
  },

  create: async (data: CreateTaskData): Promise<Task> => {
    const res = await apiClient.post<ApiResponse<{ task: Task }>>(`/${slug()}/tasks`, {
      ...data,
      status: toApiStatus(data.status),
    });
    return mapTask(res.data.data.task);
  },

  update: async (id: string, data: Partial<CreateTaskData>): Promise<Task> => {
    const res = await apiClient.patch<ApiResponse<{ task: Task }>>(`/${slug()}/tasks/${id}`, {
      ...data,
      status: toApiStatus(data.status),
    });
    return mapTask(res.data.data.task);
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
