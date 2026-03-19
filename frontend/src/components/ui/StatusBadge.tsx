import type { ReactNode } from 'react';

type BadgeStatus = 'active' | 'review' | 'planning' | 'done' | 'danger' | 'accent';

interface StatusBadgeProps {
  status: BadgeStatus;
  children: ReactNode;
}

const statusConfig: Record<BadgeStatus, { bg: string; border: string; text: string }> = {
  active: {
    bg: 'rgba(122,155,118,0.08)',
    border: 'rgba(122,155,118,0.3)',
    text: 'var(--status-success)',
  },
  review: {
    bg: 'rgba(196,164,90,0.08)',
    border: 'rgba(196,164,90,0.3)',
    text: 'var(--status-warning)',
  },
  planning: {
    bg: 'rgba(151,168,215,0.08)',
    border: 'rgba(151,168,215,0.3)',
    text: 'var(--accent-periwinkle)',
  },
  done: {
    bg: 'rgba(206,214,236,0.08)',
    border: 'rgba(206,214,236,0.3)',
    text: 'var(--accent-lavender)',
  },
  danger: {
    bg: 'rgba(176,122,110,0.08)',
    border: 'rgba(176,122,110,0.3)',
    text: 'var(--status-danger)',
  },
  accent: {
    bg: 'rgba(215,198,151,0.08)',
    border: 'rgba(215,198,151,0.3)',
    text: 'var(--accent-sand)',
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
