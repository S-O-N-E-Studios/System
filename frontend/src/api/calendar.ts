import apiClient from './client';
import { useTenantStore } from '@/store/tenantStore';
import type { CalendarEvent, CalendarEventType } from '@/types';

function slug() {
  return useTenantStore.getState().getSlug() || '';
}

export interface CalendarEventsResponse {
  events: CalendarEvent[];
}

export async function fetchCalendarEvents(params?: {
  view?: 'month' | 'week' | 'day';
  date?: string;
  eventType?: CalendarEventType | null;
  startDate?: string;
  endDate?: string;
}): Promise<CalendarEventsResponse> {
  const res = await apiClient.get(`/${slug()}/calendar/events`, { params });
  const data = res.data?.data || res.data;
  const events = Array.isArray(data) ? data : (data?.events || []);
  return { events };
}

export async function createCalendarEvent(data: Partial<CalendarEvent>): Promise<CalendarEvent> {
  const res = await apiClient.post(`/${slug()}/calendar/events`, data);
  return res.data?.data?.event || res.data?.data || res.data;
}

export async function updateCalendarEvent(id: string, data: Partial<CalendarEvent>): Promise<CalendarEvent> {
  const res = await apiClient.patch(`/${slug()}/calendar/events/${id}`, data);
  return res.data?.data?.event || res.data?.data || res.data;
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  await apiClient.delete(`/${slug()}/calendar/events/${id}`);
}
