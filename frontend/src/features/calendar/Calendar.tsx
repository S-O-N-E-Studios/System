import React, { useEffect } from 'react';
import { useCalendarStore } from '@/store/calendarStore';
import type { CalendarEvent, CalendarEventType } from '@/types';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { fetchCalendarEvents } from '@/api/calendar';

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

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const { events: loaded } = await fetchCalendarEvents({
          view,
          date: selectedDate,
          eventType: filterType,
        });
        if (!isMounted) return;
        setEvents(loaded);
      } catch {
        if (!isMounted) return;
        setError('Failed to load calendar events.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [view, selectedDate, filterType, setEvents, setLoading]);

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const filteredEvents: CalendarEvent[] =
    filterType == null ? events : events.filter((e) => e.eventType === filterType);

  return (
    <div className="animate-fade-in">
      <h1 className="text-h1 mb-8">Calendar</h1>

      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] mb-6 px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant={view === 'month' ? 'primary' : 'secondary'}
            onClick={() => setView('month')}
          >
            Month
          </Button>
          <Button
            type="button"
            variant={view === 'week' ? 'primary' : 'secondary'}
            onClick={() => setView('week')}
          >
            Week
          </Button>
          <Button
            type="button"
            variant={view === 'list' ? 'primary' : 'secondary'}
            onClick={() => setView('list')}
          >
            List
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-[var(--bg-surface-alt)] border border-[var(--border-default)] text-[var(--text-primary)] text-[0.8rem] px-3 py-2"
          />
          <Button type="button" variant="secondary" onClick={handleToday}>
            Today
          </Button>
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
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            title="No events for this view."
            description="Try changing the date, view, or event type filter."
          />
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between border border-[var(--border-default)] px-4 py-3 bg-[var(--bg-surface-alt)]"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex items-center justify-center rounded-none px-2 py-1 text-[0.62rem] uppercase tracking-wide"
                    style={{
                      backgroundColor: getEventBadgeBg(event.eventType),
                      color: 'var(--text-primary)',
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
      return 'var(--accent-sand)';
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

