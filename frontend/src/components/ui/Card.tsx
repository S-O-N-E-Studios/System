import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Subtle gold wash for financial / KPI panels */
  variant?: 'default' | 'financial';
}

/**
 * Atlas Sahara surface card: gradient fill, hover lift, 2px terracotta top accent.
 */
export default function Card({ children, variant = 'default', className = '', ...props }: CardProps) {
  return (
    <div
      className={[
        'sahara-card',
        variant === 'financial' ? 'sahara-card--financial' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      <div className="sahara-card__body">{children}</div>
    </div>
  );
}
