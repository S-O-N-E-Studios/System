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
        'group relative p-8 border border-[var(--border)]',
        'bg-[var(--bg-card)]',
        'hover:bg-[var(--bg-secondary)]',
        'transition-[background-color] duration-500',
        'cursor-default overflow-hidden',
      ].join(' ')}
    >
      {/* Bottom border sweep on hover */}
      <div
        className={[
          'absolute bottom-0 left-0 w-full h-0',
          'bg-[var(--accent)]',
          'group-hover:h-[3px]',
          'transition-[height] duration-[400ms] ease-in-out',
        ].join(' ')}
      />

      <div className="flex items-start justify-between gap-4">
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
        {icon && (
          <div className="text-[var(--accent-dim)] opacity-70">{icon}</div>
        )}
      </div>
    </div>
  );
}
