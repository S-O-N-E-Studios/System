import { Link } from 'react-router-dom';
import type { CalendarEventType } from '@/types';
import { CalendarDays } from 'lucide-react';

export interface UpcomingEventItem {
  id: string;
  title: string;
  eventType: CalendarEventType;
  date: string;
  projectId?: string;
}

export interface UpcomingEventsStripProps {
  events: UpcomingEventItem[];
  tenantSlug?: string;
}

const EVENT_COLORS: Record<CalendarEventType, string> = {
  milestone: 'var(--accent)',
  payment: 'var(--status-success)',
  site_visit: 'var(--ochre)',
  report_due: 'var(--status-warning)',
  meeting: 'var(--sienna)',
  deadline: 'var(--status-danger)',
  activity_update: 'var(--text-muted)',
  project_complete: 'var(--status-success)',
};

const EVENT_LABELS: Record<CalendarEventType, string> = {
  milestone: 'Milestone',
  payment: 'Payment',
  site_visit: 'Site Visit',
  report_due: 'Report Due',
  meeting: 'Meeting',
  deadline: 'Deadline',
  activity_update: 'Activity',
  project_complete: 'Complete',
};

function relativeDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays > 1 && diffDays < 7) return `In ${diffDays}d`;
  if (diffDays < 0) return 'Overdue';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function UpcomingEventsStrip({ events, tenantSlug }: UpcomingEventsStripProps) {
  if (events.length === 0) return null;

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] mb-8">
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-default)]">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 text-[var(--accent)]" />
          <span
            className="uppercase tracking-wider text-[var(--text-muted)]"
            style={{ fontSize: '0.62rem', fontWeight: 600 }}
          >
            Upcoming Events
          </span>
        </div>
        {tenantSlug && (
          <Link
            to={`/${tenantSlug}/calendar`}
            className="text-[0.6rem] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
          >
            View Calendar
          </Link>
        )}
      </div>

      <div className="flex overflow-x-auto divide-x divide-[var(--border-default)] scrollbar-none">
        {events.map((evt) => {
          const color = EVENT_COLORS[evt.eventType];
          const typeLabel = EVENT_LABELS[evt.eventType];
          const dateLabel = relativeDate(evt.date);

          const card = (
            <div className="px-5 py-3 flex-shrink-0 min-w-[160px] max-w-[210px] hover:bg-[var(--accent-sand-glow)] transition-colors cursor-default">
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: color }}
                />
                <span
                  className="uppercase tracking-wider font-semibold"
                  style={{ color, fontSize: '0.57rem' }}
                >
                  {typeLabel}
                </span>
              </div>
              <p className="text-[0.78rem] text-[var(--text-primary)] truncate leading-snug">
                {evt.title}
              </p>
              <p
                className="text-[var(--text-muted)] mt-0.5"
                style={{ fontSize: '0.6rem', fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {dateLabel}
              </p>
            </div>
          );

          if (tenantSlug && evt.projectId) {
            return (
              <Link
                key={evt.id}
                to={`/${tenantSlug}/projects/${evt.projectId}`}
                className="block"
              >
                {card}
              </Link>
            );
          }

          return <div key={evt.id}>{card}</div>;
        })}
      </div>
    </div>
  );
}
