import type { ReactNode } from 'react';

type BadgeStatus = 'active' | 'review' | 'planning' | 'done' | 'danger' | 'accent';

interface StatusBadgeProps {
  status: BadgeStatus;
  children: ReactNode;
}

const statusConfig: Record<BadgeStatus, { bg: string; border: string; text: string }> = {
  active: {
    bg: 'rgba(74,222,128,0.05)',
    border: 'rgba(74,222,128,0.3)',
    text: 'var(--status-active)',
  },
  review: {
    bg: 'rgba(250,204,21,0.05)',
    border: 'rgba(250,204,21,0.3)',
    text: 'var(--status-review)',
  },
  planning: {
    bg: 'rgba(96,165,250,0.05)',
    border: 'rgba(96,165,250,0.3)',
    text: 'var(--status-planning)',
  },
  done: {
    bg: 'rgba(167,139,250,0.05)',
    border: 'rgba(167,139,250,0.3)',
    text: 'var(--status-done)',
  },
  danger: {
    bg: 'rgba(248,113,113,0.05)',
    border: 'rgba(248,113,113,0.3)',
    text: 'var(--status-danger)',
  },
  accent: {
    bg: 'rgba(201,169,97,0.05)',
    border: 'rgba(201,169,97,0.3)',
    text: 'var(--accent)',
  },
};

export default function StatusBadge({ status, children }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className="text-button inline-flex items-center px-3 py-1 text-[0.6rem]"
      style={{
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        color: config.text,
      }}
      aria-live="polite"
    >
      {children}
    </span>
  );
}
