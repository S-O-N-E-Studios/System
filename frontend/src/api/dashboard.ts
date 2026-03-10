import apiClient from './client';
import type { ApiResponse } from '@/types';

export interface DashboardStats {
  totalProjects: number;
  portfolioValue: number;
  expenditureToDate: number;
  expenditurePercent: number;
  reportsPending: number;
}

export interface RecentProject {
  id: string;
  name: string;
  status: 'active' | 'review' | 'planning' | 'done';
  updatedAt: string;
}

export interface OutstandingTask {
  id: string;
  title: string;
  dueStatus: 'danger' | 'review' | 'planning';
  due: string;
}

export interface SprintSummary {
  name: string;
  sprint: string;
  progress: number;
  status: 'active' | 'review' | 'planning';
}

export interface DashboardData {
  stats: DashboardStats;
  recentProjects: RecentProject[];
  outstandingTasks: OutstandingTask[];
  sprintProgress: SprintSummary[];
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardData> => {
    const res = await apiClient.get<ApiResponse<DashboardData>>('/dashboard/stats');
    return res.data.data;
  },
};
