import type { ScheduleActivity, ScheduleActivityStatus } from '@/types';
import { formatDate } from '@/utils/formatters';
import EmptyState from '@/components/ui/EmptyState';

interface GanttChartProps {
  activities: ScheduleActivity[];
  startMonth?: Date;
  endMonth?: Date;
  onActivityClick?: (id: string) => void;
}

const STATUS_COLOR_TOKEN: Record<ScheduleActivityStatus, string> = {
  on_track: 'var(--status-active)',
  at_risk: 'var(--status-review)',
  delayed: 'var(--status-danger)',
  complete: 'var(--status-success)',
};

function getMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  return `${y}-${m.toString().padStart(2, '0')}`;
}

type TimelineBucket = {
  key: string;
  label: string;
  start: Date;
  end: Date;
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + mondayOffset);
  return d;
}

function endOfWeek(date: Date): Date {
  const s = startOfWeek(date);
  return endOfDay(new Date(s.getFullYear(), s.getMonth(), s.getDate() + 6));
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

function startOfQuarter(date: Date): Date {
  const quarterStartMonth = Math.floor(date.getMonth() / 3) * 3;
  return new Date(date.getFullYear(), quarterStartMonth, 1);
}

function endOfQuarter(date: Date): Date {
  const quarterStartMonth = Math.floor(date.getMonth() / 3) * 3;
  return endOfDay(new Date(date.getFullYear(), quarterStartMonth + 3, 0));
}

function getTimelineBucketsInRange(start: Date, end: Date): TimelineBucket[] {
  const durationDays = Math.max(
    1,
    Math.ceil((endOfDay(end).getTime() - startOfDay(start).getTime()) / 86_400_000)
  );

  // Auto-scale:
  // <= 45 days: daily
  // <= 180 days: weekly
  // <= 900 days (~2.5 years): monthly
  // > 900 days: quarterly
  if (durationDays <= 45) {
    const buckets: TimelineBucket[] = [];
    let cursor = startOfDay(start);
    const last = endOfDay(end);
    while (cursor <= last) {
      const bucketStart = startOfDay(cursor);
      const bucketEnd = endOfDay(cursor);
      buckets.push({
        key: `d-${bucketStart.toISOString().slice(0, 10)}`,
        label: bucketStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        start: bucketStart,
        end: bucketEnd,
      });
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
    }
    return buckets;
  }

  if (durationDays <= 180) {
    const buckets: TimelineBucket[] = [];
    let cursor = startOfWeek(start);
    const last = endOfDay(end);
    while (cursor <= last) {
      const bucketStart = startOfWeek(cursor);
      const bucketEnd = endOfWeek(cursor);
      buckets.push({
        key: `w-${bucketStart.toISOString().slice(0, 10)}`,
        label: `Wk ${bucketStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`,
        start: bucketStart,
        end: bucketEnd,
      });
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 7);
    }
    return buckets;
  }

  if (durationDays <= 900) {
    const buckets: TimelineBucket[] = [];
    let cursor = startOfMonth(start);
    const last = endOfDay(end);
    while (cursor <= last) {
      const bucketStart = startOfMonth(cursor);
      const bucketEnd = endOfMonth(cursor);
      buckets.push({
        key: `m-${getMonthKey(bucketStart)}`,
        label: bucketStart.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
        start: bucketStart,
        end: bucketEnd,
      });
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }
    return buckets;
  }

  const buckets: TimelineBucket[] = [];
  let cursor = startOfQuarter(start);
  const last = endOfDay(end);
  while (cursor <= last) {
    const bucketStart = startOfQuarter(cursor);
    const bucketEnd = endOfQuarter(cursor);
    const quarter = Math.floor(bucketStart.getMonth() / 3) + 1;
    buckets.push({
      key: `q-${bucketStart.getFullYear()}-${quarter}`,
      label: `Q${quarter} ${String(bucketStart.getFullYear()).slice(-2)}`,
      start: bucketStart,
      end: bucketEnd,
    });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 3, 1);
  }
  return buckets;
}

function getBarPosition(
  activityStart: Date,
  activityEnd: Date,
  buckets: TimelineBucket[]
): { leftPercent: number; widthPercent: number } {
  const startIdx = buckets.findIndex((b) => activityStart <= b.end && activityEnd >= b.start);
  const endIdx = (() => {
    for (let i = buckets.length - 1; i >= 0; i -= 1) {
      const b = buckets[i];
      if (activityStart <= b.end && activityEnd >= b.start) return i;
    }
    return -1;
  })();

  if (startIdx === -1 || endIdx === -1 || buckets.length === 0) return { leftPercent: 0, widthPercent: 0 };

  const span = endIdx - startIdx + 1;
  const leftPercent = (startIdx / buckets.length) * 100;
  const widthPercent = (span / buckets.length) * 100;

  return { leftPercent, widthPercent };
}

function getTodayMarkerPercent(buckets: TimelineBucket[]): number | null {
  const today = new Date();
  const idx = buckets.findIndex((b) => today >= b.start && today <= b.end);
  if (idx === -1 || buckets.length === 0) return null;
  return ((idx + 0.5) / buckets.length) * 100;
}

export default function GanttChart({
  activities,
  startMonth,
  endMonth,
  onActivityClick,
}: GanttChartProps) {
  if (!activities.length) {
    return (
      <div className="border border-dashed border-[var(--border)] bg-[var(--bg-card)]">
        <EmptyState title="No activities scheduled yet." />
      </div>
    );
  }

  const effectiveStart =
    startMonth ??
    new Date(Math.min(...activities.map((a) => new Date(a.startDate).getTime())));
  const effectiveEnd =
    endMonth ?? new Date(Math.max(...activities.map((a) => new Date(a.endDate).getTime())));

  const buckets = getTimelineBucketsInRange(effectiveStart, effectiveEnd);
  const monthCellWidth = 64;
  const timelineWidth = buckets.length * monthCellWidth;
  const todayPercent = getTodayMarkerPercent(buckets);

  return (
    <div className="border border-[var(--border)] bg-[var(--bg-card)]">
      {/* Desktop / tablet Gantt */}
      <div className="hidden md:block overflow-x-auto">
        <div
          className="flex"
          style={{ minWidth: 240 + 48 + timelineWidth }}
        >
          {/* Left: activity names */}
          <div className="w-[240px] shrink-0 border-r border-[var(--border)]">
            <div className="h-10 border-b border-[var(--border)] flex items-center px-3 bg-[var(--table-header-bg)]">
              <span className="text-eyebrow text-[var(--text-secondary)]">Activity</span>
            </div>
            {activities.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={onActivityClick ? () => onActivityClick(a.id) : undefined}
                className="group h-11 w-full border-b border-[var(--border)] flex items-center px-3 text-left hover:bg-[var(--accent-glow)] transition-colors"
              >
                <span
                  className="text-[0.8rem] text-[var(--text-primary)] truncate"
                  title={a.name}
                >
                  {a.name}
                </span>
              </button>
            ))}
          </div>

          {/* Middle: timeline by month with duration bars */}
          <div className="flex-1">
            <div
              className="relative"
              style={{ width: timelineWidth }}
            >
              {/* Month header */}
              <div className="flex">
                {buckets.map((bucket) => (
                  <div
                    key={bucket.key}
                    className="h-10 border-b border-r border-[var(--border)] flex items-center justify-center bg-[var(--table-header-bg)] shrink-0"
                    style={{ width: monthCellWidth }}
                  >
                    <span className="text-[0.62rem] font-semibold tracking-[2px] uppercase text-[var(--text-muted)]">
                      {bucket.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Today marker */}
              {todayPercent !== null && (
                <div
                  className="pointer-events-none absolute top-10 bottom-0"
                  style={{ left: `${todayPercent}%` }}
                >
                  <div className="h-full border-l border-dashed border-[var(--accent)]" />
                </div>
              )}

              {/* Rows with bars */}
              {activities.map((a) => {
                const activityStart = new Date(a.startDate);
                const activityEnd = new Date(a.endDate);
                const { leftPercent, widthPercent } = getBarPosition(
                  activityStart,
                  activityEnd,
                  buckets
                );

                return (
                  <div
                    key={a.id}
                    className="relative h-11 border-b border-[var(--border)]"
                  >
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-4 rounded-none min-w-[4px] bg-[var(--chart-activity-bar)] hover:bg-[var(--chart-activity-bar-hover)] transition-colors"
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                      }}
                      title={`${a.name}: ${formatDate(a.startDate)} to ${formatDate(
                        a.endDate
                      )}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: status indicator column */}
          <div className="w-12 shrink-0 border-l border-[var(--border)]">
            <div className="h-10 border-b border-[var(--border)] flex items-center justify-center bg-[var(--table-header-bg)]">
              <span className="text-eyebrow text-[var(--text-secondary)]">Status</span>
            </div>
            {activities.map((a) => (
              <div
                key={a.id}
                className="h-11 border-b border-[var(--border)] flex items-center justify-center"
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: STATUS_COLOR_TOKEN[a.status] }}
                  aria-hidden
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile: list view fallback */}
      <div className="md:hidden divide-y divide-[var(--border)]">
        {activities.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={onActivityClick ? () => onActivityClick(a.id) : undefined}
            className="w-full text-left p-4 bg-[var(--bg-card)] hover:bg-[var(--accent-glow)] transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.85rem] text-[var(--text-primary)] mb-1">{a.name}</p>
                <p className="text-[0.7rem] text-[var(--text-muted)]">
                  {formatDate(a.startDate)} to {formatDate(a.endDate)}
                </p>
              </div>
              <span
                className="w-3 h-3 rounded-full mt-1 shrink-0"
                style={{ backgroundColor: STATUS_COLOR_TOKEN[a.status] }}
                aria-hidden
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

