import type { ReactNode } from 'react';

type BadgeStatus = 'active' | 'review' | 'planning' | 'done' | 'danger' | 'accent';

interface StatusBadgeProps {
  status: BadgeStatus;
  children: ReactNode;
}

const statusConfig: Record<BadgeStatus, { bg: string; border: string; text: string }> = {
  active: {
    bg: 'var(--badge-active-bg)',
    border: 'var(--badge-active-border)',
    text: 'var(--status-success)',
  },
  review: {
    bg: 'var(--badge-review-bg)',
    border: 'var(--badge-review-border)',
    text: 'var(--status-warning)',
  },
  planning: {
    bg: 'var(--badge-planning-bg)',
    border: 'var(--badge-planning-border)',
    text: 'var(--accent-periwinkle)',
  },
  done: {
    bg: 'var(--badge-done-bg)',
    border: 'var(--badge-done-border)',
    text: 'var(--accent-lavender)',
  },
  danger: {
    bg: 'var(--badge-danger-bg)',
    border: 'var(--badge-danger-border)',
    text: 'var(--status-danger)',
  },
  accent: {
    bg: 'var(--badge-accent-bg)',
    border: 'var(--badge-accent-border)',
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
