import apiClient from './client';
import { useTenantStore } from '@/store/tenantStore';

function slug() {
  return useTenantStore.getState().getSlug() || '';
}

export const NOTIFICATION_PREFS = [
  { key: 'projectUpdates', label: 'Project updates' },
  { key: 'taskAssignments', label: 'Task assignments' },
  { key: 'reportSubmissions', label: 'Report submissions' },
  { key: 'deadlineReminders', label: 'Deadline reminders' },
  { key: 'teamInvitations', label: 'Team invitations' },
] as const;

export type NotificationPrefKey = (typeof NOTIFICATION_PREFS)[number]['key'];

export type NotificationPreferences = Record<NotificationPrefKey, boolean>;

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
  type: string;
};

export async function fetchNotifications(): Promise<{
  notifications: NotificationItem[];
  preferences: NotificationPreferences;
}> {
  const res = await apiClient.get(`/${slug()}/notifications`);
  return res.data.data;
}

export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const res = await apiClient.patch(`/${slug()}/notifications/preferences`, preferences);
  return res.data.data.preferences;
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.post(`/${slug()}/notifications/read`, { id });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post(`/${slug()}/notifications/read-all`);
}
