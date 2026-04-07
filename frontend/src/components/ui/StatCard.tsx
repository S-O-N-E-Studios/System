import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  subline?: string;
  icon?: ReactNode;
  isCurrency?: boolean;
}

export default function StatCard({ label, value, subline, icon, isCurrency = false }: StatCardProps) {
  return (
    <div
      className={[
        'sahara-card group cursor-default p-8',
        isCurrency ? 'sahara-card--financial' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="sahara-card__body flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-eyebrow">{label}</p>
          <p
            className={
              isCurrency
                ? 'font-display text-[1.2rem] font-semibold text-[var(--accent)]'
                : 'font-display text-[1.2rem] font-semibold text-[var(--text-primary)]'
            }
          >
            {value}
          </p>
          {subline && (
            <p className="font-body text-[0.55rem] tracking-[1.5px] text-[var(--text-muted)] uppercase">
              {subline}
            </p>
          )}
        </div>
        {icon && <div className="text-[var(--accent-dim)] opacity-70">{icon}</div>}
      </div>
    </div>
  );
}
