// Dashboard API – mocked for MVP frontend work.
// Swap implementation to use apiClient when backend is ready.

import type { CalendarEventType } from '@/types';

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
  // Mocked data for now – keeps frontend functional without backend.
  const departments: DepartmentBudgetSummary[] = [
    {
      id: 'dpw',
      name: 'DPW',
      fullName: 'Department of Public Works',
      budget: 5_000_000_000,
      spent: 2_100_000_000,
    },
    {
      id: 'land',
      name: 'Land',
      fullName: 'Department of Land Affairs',
      budget: 3_500_000_000,
      spent: 1_200_000_000,
    },
    {
      id: 'education',
      name: 'Education',
      fullName: 'Department of Education',
      budget: 2_500_000_000,
      spent: 900_000_000,
    },
    {
      id: 'health',
      name: 'Health',
      fullName: 'Department of Health',
      budget: 1_800_000_000,
      spent: 750_000_000,
    },
  ];

  const recentProjects: RecentProjectSummary[] = [
    {
      id: '1',
      name: 'R573 Road Rehabilitation',
      dept: 'DPW',
      status: 'active',
      updatedAt: '2 hours ago',
    },
    {
      id: '2',
      name: 'Mokopane Water Treatment',
      dept: 'DPW',
      status: 'review',
      updatedAt: '5 hours ago',
    },
    {
      id: '3',
      name: 'Tzaneen Bridge Construction',
      dept: 'Transport',
      status: 'active',
      updatedAt: '1 day ago',
    },
  ];

  const outstandingTasks: OutstandingTaskSummary[] = [
    {
      id: '1',
      title: 'Submit monthly progress: R573',
      dueStatus: 'danger',
      due: 'Overdue (2 days)',
    },
    {
      id: '2',
      title: 'Review geo-tech report: Mokopane',
      dueStatus: 'review',
      due: 'Due today',
    },
    {
      id: '3',
      title: 'Update schedule: Tzaneen Bridge',
      dueStatus: 'planning',
      due: 'Due in 3 days',
    },
  ];

  // Use local calendar arithmetic to avoid UTC-vs-local off-by-one for non-UTC users.
  const daysFromNow = (d: number): string => {
    const dt = new Date();
    dt.setDate(dt.getDate() + d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const upcomingEvents: UpcomingEventSummary[] = [
    {
      id: 'ue-1',
      title: 'Stage 4 Complete · R573',
      eventType: 'milestone',
      date: daysFromNow(1),
      projectId: '1',
    },
    {
      id: 'ue-2',
      title: 'Payment Certificate · Mokopane WTW',
      eventType: 'payment',
      date: daysFromNow(2),
      projectId: '2',
    },
    {
      id: 'ue-3',
      title: 'Site Visit · Tzaneen Bridge',
      eventType: 'site_visit',
      date: daysFromNow(3),
      projectId: '3',
    },
    {
      id: 'ue-4',
      title: 'Monthly Safety Report Due',
      eventType: 'report_due',
      date: daysFromNow(4),
    },
    {
      id: 'ue-5',
      title: 'Project Review Meeting',
      eventType: 'meeting',
      date: daysFromNow(7),
    },
  ];

  return Promise.resolve({
    departments,
    recentProjects,
    outstandingTasks,
    upcomingEvents,
  });
}

