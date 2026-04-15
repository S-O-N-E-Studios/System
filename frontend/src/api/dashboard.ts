import apiClient from './client';
import { useTenantStore } from '@/store/tenantStore';
import type { CalendarEventType } from '@/types';

function slug() {
  return useTenantStore.getState().getSlug() || '';
}

export interface DepartmentBudgetSummary {
  id: string;
  name: string;
  fullName: string;
  budget: number;
  spent: number;
}

export interface RecentProjectSummary {
  id: string;
  name: string;
  dept: string;
  status: 'active' | 'review' | 'planning' | 'completed';
  updatedAt: string;
}

export interface OutstandingTaskSummary {
  id: string;
  title: string;
  dueStatus: 'danger' | 'review' | 'planning';
  due: string;
}

export interface UpcomingEventSummary {
  id: string;
  title: string;
  eventType: CalendarEventType;
  date: string;
  projectId?: string;
}

export interface DashboardSummaryResponse {
  departments: DepartmentBudgetSummary[];
  recentProjects: RecentProjectSummary[];
  outstandingTasks: OutstandingTaskSummary[];
  upcomingEvents: UpcomingEventSummary[];
}

export async function fetchDashboardSummary(): Promise<DashboardSummaryResponse> {
  try {
    const res = await apiClient.get(`/${slug()}/reports/dashboard`);
    const data = res.data?.data || res.data;
    return data as DashboardSummaryResponse;
  } catch {
    // Fallback to minimal data if backend not ready
    return {
      departments: [],
      recentProjects: [],
      outstandingTasks: [],
      upcomingEvents: [],
    };
  }
}
