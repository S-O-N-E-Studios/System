import { create } from 'zustand';
import type { CalendarEvent, CalendarEventType } from '@/types';

type CalendarView = 'month' | 'week' | 'list';

interface CalendarState {
  events: CalendarEvent[];
  view: CalendarView;
  selectedDate: string;
  filterType: CalendarEventType | null;
  isLoading: boolean;

  setEvents: (events: CalendarEvent[]) => void;
  addEvent: (event: CalendarEvent) => void;
  removeEvent: (id: string) => void;
  setView: (view: CalendarView) => void;
  setSelectedDate: (date: string) => void;
  setFilterType: (type: CalendarEventType | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  events: [],
  view: 'month',
  selectedDate: new Date().toISOString().split('T')[0],
  filterType: null,
  isLoading: false,

  setEvents: (events) => set({ events }),

  addEvent: (event) =>
    set((s) => ({ events: [...s.events, event] })),

  removeEvent: (id) =>
    set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

  setView: (view) => set({ view }),

  setSelectedDate: (date) => set({ selectedDate: date }),

  setFilterType: (type) => set({ filterType: type }),

  setLoading: (isLoading) => set({ isLoading }),
}));
