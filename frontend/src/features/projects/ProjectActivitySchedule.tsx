import { useState, useEffect } from 'react';
import type { ScheduleActivity } from '@/types';
import { formatDate } from '@/utils/formatters';
import GanttChart from '@/components/ui/GanttChart';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';

const MOCK_ACTIVITIES: (ScheduleActivity & { expectedFunds: number; actualFunds: number })[] = [
  { id: '1', name: 'Excavation', startDate: '2026-01-15', endDate: '2026-03-15', status: 'on_track', expectedFunds: 100, actualFunds: 95 },
  { id: '2', name: 'Steel', startDate: '2026-02-01', endDate: '2026-04-30', status: 'on_track', expectedFunds: 100, actualFunds: 100 },
  { id: '3', name: 'Concrete', startDate: '2026-03-01', endDate: '2026-06-30', status: 'at_risk', expectedFunds: 100, actualFunds: 85 },
  { id: '4', name: 'Road Base', startDate: '2026-05-01', endDate: '2026-08-31', status: 'on_track', expectedFunds: 100, actualFunds: 0 },
  { id: '5', name: 'Surfacing', startDate: '2026-07-01', endDate: '2026-10-31', status: 'on_track', expectedFunds: 100, actualFunds: 0 },
  { id: '6', name: 'Handover', startDate: '2026-10-01', endDate: '2026-11-30', status: 'on_track', expectedFunds: 100, actualFunds: 0 },
];

const MOCK_PROJECT = {
  name: 'R573 Road Rehabilitation',
  refCode: 'PRJ-2026-001',
  startDate: '2026-01-15',
  completionDate: '2026-11-30',
  progress: 38,
};

function useCountdown(targetDate: string) {
  const [remaining, setRemaining] = useState(() => {
    const diff = new Date(targetDate).getTime() - Date.now();
    return Math.max(0, diff);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = new Date(targetDate).getTime() - Date.now();
      setRemaining(Math.max(0, diff));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);

  return { days, hours, minutes, seconds, isExpired: remaining <= 0 };
}

export default function ProjectActivitySchedule() {
  const activities = MOCK_ACTIVITIES;
  const project = MOCK_PROJECT;
  const countdown = useCountdown(project.completionDate);

  return (
    <div className="space-y-6">
      {/* Project info + Countdown clock */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
        <div className="lg:col-span-2 p-4 bg-[var(--bg-surface)] border border-[var(--border-default)]">
          <p className="text-eyebrow mb-1">Project</p>
          <p className="text-[0.82rem] font-medium text-[var(--text-primary)]">{project.name}</p>
          <p className="text-mono text-[0.68rem] mt-1">{project.refCode}</p>
        </div>
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-default)]">
          <p className="text-eyebrow mb-1">Timeline</p>
          <p className="text-[0.82rem] text-[var(--text-primary)]">
            {formatDate(project.startDate)} to {formatDate(project.completionDate)}
          </p>
        </div>
        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-default)]">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-3.5 w-3.5 text-[var(--accent-periwinkle)]" />
            <p className="text-eyebrow">Countdown to Completion</p>
          </div>
          {countdown.isExpired ? (
            <p className="text-[0.82rem] font-semibold text-[var(--status-success)]">Complete</p>
          ) : (
            <div
              className="flex items-baseline gap-1"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              <span className="text-[1.1rem] font-semibold text-[var(--text-primary)]">{countdown.days}</span>
              <span className="text-[0.6rem] text-[var(--text-muted)]">d</span>
              <span className="text-[1.1rem] font-semibold text-[var(--text-primary)] ml-1">{String(countdown.hours).padStart(2, '0')}</span>
              <span className="text-[0.6rem] text-[var(--text-muted)]">:</span>
              <span className="text-[1.1rem] font-semibold text-[var(--text-primary)]">{String(countdown.minutes).padStart(2, '0')}</span>
              <span className="text-[0.6rem] text-[var(--text-muted)]">:</span>
              <span className="text-[1.1rem] font-semibold text-[var(--text-primary)]">{String(countdown.seconds).padStart(2, '0')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Gantt chart */}
      <GanttChart
        activities={activities}
        startMonth={new Date(project.startDate)}
        endMonth={new Date(project.completionDate)}
      />

      {/* Expected vs Actual Funds table */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)]">
        <div className="px-6 py-4 border-b border-[var(--border-default)]">
          <h3 className="text-h3">Expected vs Actual Funds</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ background: 'var(--table-header-bg)' }}>
              <th className="text-table-header text-left px-4 py-3">Activity</th>
              <th className="text-table-header text-right px-4 py-3">Expected (R'000)</th>
              <th className="text-table-header text-right px-4 py-3">Actual (R'000)</th>
              <th className="text-table-header text-right px-4 py-3">Variance</th>
              <th className="text-table-header text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((act, i) => {
              const variance = act.actualFunds - act.expectedFunds;
              const isOver = variance > 0;
              const isUnder = variance < 0 && act.actualFunds > 0;
              return (
                <tr
                  key={act.id}
                  className={[
                    'border-b border-[var(--border-default)]',
                    i % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-surface)]',
                  ].join(' ')}
                >
                  <td className="px-4 py-3 text-[0.82rem] text-[var(--text-primary)]">{act.name}</td>
                  <td
                    className="px-4 py-3 text-right text-[0.82rem]"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}
                  >
                    {act.expectedFunds}
                  </td>
                  <td
                    className="px-4 py-3 text-right text-[0.82rem]"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-financial)' }}
                  >
                    {act.actualFunds || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {act.actualFunds > 0 ? (
                      <span
                        className="inline-flex items-center gap-1 text-[0.78rem]"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          color: isOver
                            ? 'var(--status-danger)'
                            : isUnder
                              ? 'var(--status-success)'
                              : 'var(--text-muted)',
                        }}
                      >
                        {isOver && <TrendingUp className="h-3 w-3" />}
                        {isUnder && <TrendingDown className="h-3 w-3" />}
                        {variance > 0 ? `+${variance}` : variance === 0 ? '0' : String(variance)}
                      </span>
                    ) : (
                      <span className="text-[0.78rem] text-[var(--text-muted)]">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-[0.68rem] font-semibold uppercase tracking-wider"
                      style={{
                        color: act.status === 'on_track'
                          ? 'var(--status-success)'
                          : act.status === 'at_risk'
                            ? 'var(--status-warning)'
                            : 'var(--status-danger)',
                      }}
                    >
                      {act.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
