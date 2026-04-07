import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  addDays,
  addMonths,
  addWeeks,
  isToday,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns';
import { useCalendarStore } from '@/store/calendarStore';
import type { CalendarEvent, CalendarEventType } from '@/types';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { fetchCalendarEvents } from '@/api/calendar';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  milestone: 'Milestone',
  payment: 'Payment',
  site_visit: 'Site Visit',
  report_due: 'Report Due',
  meeting: 'Meeting',
  deadline: 'Deadline',
  activity_update: 'Activity Update',
  project_complete: 'Project Complete',
};

export default function Calendar() {
  const {
    events,
    view,
    selectedDate,
    filterType,
    isLoading,
    setEvents,
    setView,
    setSelectedDate,
    setFilterType,
    setLoading,
  } = useCalendarStore();
  const [error, setError] = React.useState<string | null>(null);

  const { data, isLoading: calendarQueryLoading, isError } = useQuery({
    queryKey: ['calendar', 'events', view, selectedDate, filterType],
    queryFn: () =>
      fetchCalendarEvents({
        view,
        date: selectedDate,
        eventType: filterType,
      }),
  });

  useEffect(() => {
    setLoading(calendarQueryLoading);
  }, [calendarQueryLoading, setLoading]);

  useEffect(() => {
    if (data?.events) setEvents(data.events);
  }, [data, setEvents]);

  useEffect(() => {
    setError(isError ? 'Failed to load calendar events.' : null);
  }, [isError]);

  const selectedDateObj = startOfDay(new Date(`${selectedDate}T00:00:00`));

  const handleStep = (dir: -1 | 1) => {
    const next =
      view === 'month'
        ? dir === -1
          ? subMonths(selectedDateObj, 1)
          : addMonths(selectedDateObj, 1)
        : view === 'week'
          ? dir === -1
            ? subWeeks(selectedDateObj, 1)
            : addWeeks(selectedDateObj, 1)
          : dir === -1
            ? subDays(selectedDateObj, 1)
            : addDays(selectedDateObj, 1);

    setSelectedDate(format(next, 'yyyy-MM-dd'));
  };

  const visibleEvents: CalendarEvent[] =
    filterType == null ? events : events.filter((e) => e.eventType === filterType);

  const dayEvents = visibleEvents.filter((e) => e.date === selectedDate);

  const calendarDays: Date[] =
    view === 'day'
      ? [selectedDateObj]
      : (() => {
          const gridStart =
            view === 'month'
              ? startOfWeek(startOfMonth(selectedDateObj), { weekStartsOn: 1 })
              : startOfWeek(selectedDateObj, { weekStartsOn: 1 });

          const gridEnd =
            view === 'month'
              ? endOfWeek(endOfMonth(selectedDateObj), { weekStartsOn: 1 })
              : endOfWeek(selectedDateObj, { weekStartsOn: 1 });

          const days: Date[] = [];
          let d = gridStart;
          while (d.getTime() <= gridEnd.getTime()) {
            days.push(d);
            d = addDays(d, 1);
          }
          return days;
        })();

  return (
    <div className="animate-fade-in">
      <h1 className="text-h1 mb-8">Calendar</h1>

      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] mb-6 px-6 py-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)]">Calendar</p>
            <h2 className="text-h2">{format(selectedDateObj, 'MMMM yyyy')}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleStep(-1)}
              className="h-9 w-9 inline-flex items-center justify-center border border-[var(--border-default)] hover:border-[var(--accent)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
              aria-label="Previous period"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleStep(1)}
              className="h-9 w-9 inline-flex items-center justify-center border border-[var(--border-default)] hover:border-[var(--accent)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
              aria-label="Next period"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
          {Array.from({ length: 12 }, (_, i) => i).map((monthIndex) => {
            const monthDate = new Date(selectedDateObj.getFullYear(), monthIndex, 1);
            const active = monthIndex === selectedDateObj.getMonth();
            return (
              <button
                key={monthIndex}
                type="button"
                onClick={() => setSelectedDate(format(monthDate, 'yyyy-MM-dd'))}
                className={[
                  'px-3 py-2 whitespace-nowrap border text-[0.72rem] uppercase tracking-wider transition-colors',
                  active
                    ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-glow)]/15'
                    : 'border-[var(--border-default)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]',
                ].join(' ')}
              >
                {format(monthDate, 'MMM yyyy')}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant={view === 'month' ? 'primary' : 'secondary'} onClick={() => setView('month')}>
            Month
          </Button>
          <Button type="button" variant={view === 'week' ? 'primary' : 'secondary'} onClick={() => setView('week')}>
            Week
          </Button>
          <Button type="button" variant={view === 'day' ? 'primary' : 'secondary'} onClick={() => setView('day')}>
            Day
          </Button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-[var(--bg-surface-alt)] border border-[var(--border-default)] text-[var(--text-primary)] text-[0.8rem] px-3 py-2"
          />
          <select
            value={filterType ?? ''}
            onChange={(e) =>
              setFilterType(e.target.value ? (e.target.value as CalendarEventType) : null)
            }
            className="bg-[var(--bg-surface-alt)] border border-[var(--border-default)] text-[var(--text-primary)] text-[0.8rem] px-3 py-2"
          >
            <option value="">All event types</option>
            {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <Button type="button" variant="secondary">
            Export
          </Button>
        </div>
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] p-6">
        {isLoading ? (
          <LoadingState
            title="Loading events"
            description="Fetching project milestones, payments, and deadlines."
          />
        ) : error ? (
          <ErrorState
            title="Unable to load calendar"
            description="Please try again later."
          />
        ) : view === 'day' ? (
          dayEvents.length === 0 ? (
            <EmptyState
              title="No events on this day."
              description="Try changing the date or event type filter."
            />
          ) : (
            <div className="space-y-3">
              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between border border-[var(--border-default)] px-4 py-3 bg-[var(--bg-surface-alt)]"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex items-center justify-center rounded-none px-2 py-1 text-[0.62rem] uppercase tracking-wide"
                      style={{
                        backgroundColor: getEventBadgeBg(event.eventType),
                        color: 'white',
                      }}
                    >
                      {EVENT_TYPE_LABELS[event.eventType]}
                    </span>
                    <div>
                      <p className="text-[0.85rem] text-[var(--text-primary)]">{event.title}</p>
                      <p className="text-[0.7rem] text-[var(--text-muted)]">
                        {formatEventDateRange(event.date, event.endDate, event.allDay)}
                      </p>
                    </div>
                  </div>
                  {event.linkedEntity && (
                    <span className="text-[0.65rem] text-[var(--text-muted)]">
                      {event.linkedEntity.type.toUpperCase()} · {event.linkedEntity.id}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )
        ) : visibleEvents.length === 0 ? (
          <EmptyState
            title="No events for this view."
            description="Try changing the date, view, or event type filter."
          />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-px bg-[var(--border)]">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d} className="bg-[var(--bg-surface-alt)] p-2 text-[0.65rem] text-[var(--text-muted)]">
                  {d}
                </div>
              ))}

              {calendarDays.map((day) => {
                const iso = format(day, 'yyyy-MM-dd');
                const isSelected = isSameDay(day, selectedDateObj);
                const isTodayCell = isToday(day);
                const isInMonth = view === 'month' ? isSameMonth(day, selectedDateObj) : true;
                const dayCellEvents = visibleEvents.filter((e) => e.date === iso);
                const hasDeadline = dayCellEvents.some(
                  (event) => event.eventType === 'deadline' || event.eventType === 'report_due'
                );

                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setSelectedDate(iso)}
                    className={[
                      'bg-[var(--bg-card)] p-2 text-left transition-colors min-h-[92px]',
                      !isInMonth ? 'opacity-40' : '',
                      isSelected ? 'ring-1 ring-[var(--accent)]' : '',
                      isTodayCell ? 'bg-[var(--accent-glow)]/20' : '',
                      hasDeadline ? 'border border-[var(--status-warning)]' : '',
                      'hover:bg-[var(--accent-glow)]/15',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[0.78rem] font-body font-medium text-[var(--text-primary)]">
                        {format(day, 'd')}
                      </span>
                      {dayCellEvents.length > 0 && (
                        <span className="text-[0.6rem] text-[var(--text-muted)]">
                          {dayCellEvents.length}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 space-y-1">
                      {dayCellEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className="text-[0.66rem] leading-tight px-1 py-[2px] rounded-none bg-[var(--accent-periwinkle)] text-white truncate"
                          style={{ backgroundColor: getEventBadgeBg(event.eventType), color: 'white' }}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayCellEvents.length > 3 && (
                        <div className="text-[0.6rem] text-[var(--text-muted)]">
                          +{dayCellEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getEventBadgeBg(type: CalendarEventType): string {
  switch (type) {
    case 'milestone':
    case 'project_complete':
      return 'var(--status-success)';
    case 'payment':
      return 'var(--chart-bar-fill)';
    case 'deadline':
    case 'report_due':
      return 'var(--status-warning)';
    case 'activity_update':
      return 'var(--accent-lavender)';
    case 'meeting':
    case 'site_visit':
    default:
      return 'var(--accent-periwinkle)';
  }
}

function formatEventDateRange(date: string, endDate?: string, allDay?: boolean): string {
  if (!endDate || date === endDate) {
    return allDay ? `${date} · All day` : date;
  }
  return allDay ? `${date} – ${endDate} · All day` : `${date} – ${endDate}`;
}

