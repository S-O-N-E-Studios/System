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
};

function getMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  return `${y}-${m.toString().padStart(2, '0')}`;
}

function getMonthsInRange(start: Date, end: Date): string[] {
  const months: string[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cur <= last) {
    months.push(getMonthKey(cur));
    cur.setMonth(cur.getMonth() + 1);
  }

  return months;
}

function getBarPosition(
  activityStart: Date,
  activityEnd: Date,
  months: string[]
): { leftPercent: number; widthPercent: number } {
  const startKey = getMonthKey(activityStart);
  const endKey = getMonthKey(activityEnd);
  const startIdx = months.indexOf(startKey);
  const endIdx = months.indexOf(endKey);

  if (startIdx === -1 || endIdx === -1) return { leftPercent: 0, widthPercent: 0 };

  const span = endIdx - startIdx + 1;
  const leftPercent = (startIdx / months.length) * 100;
  const widthPercent = (span / months.length) * 100;

  return { leftPercent, widthPercent };
}

function getTodayMarkerPercent(months: string[]): number | null {
  const today = new Date();
  const todayKey = getMonthKey(today);
  const idx = months.indexOf(todayKey);
  if (idx === -1 || months.length === 0) return null;
  return ((idx + 0.5) / months.length) * 100;
}

function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleDateString('en-GB', {
    month: 'short',
    year: '2-digit',
  });
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

  const months = getMonthsInRange(effectiveStart, effectiveEnd);
  const monthCellWidth = 64;
  const timelineWidth = months.length * monthCellWidth;
  const todayPercent = getTodayMarkerPercent(months);

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
                {months.map((m) => (
                  <div
                    key={m}
                    className="h-10 border-b border-r border-[var(--border)] flex items-center justify-center bg-[var(--table-header-bg)] shrink-0"
                    style={{ width: monthCellWidth }}
                  >
                    <span className="text-[0.62rem] font-semibold tracking-[2px] uppercase text-[var(--text-muted)]">
                      {formatMonthLabel(m)}
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
                  months
                );

                return (
                  <div
                    key={a.id}
                    className="relative h-11 border-b border-[var(--border)]"
                  >
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-4 rounded-none min-w-[4px] bg-[var(--accent)] hover:bg-[var(--accent-light)] transition-colors"
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                      }}
                      title={`${a.name}: ${formatDate(a.startDate)} – ${formatDate(
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
                  {formatDate(a.startDate)} – {formatDate(a.endDate)}
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

