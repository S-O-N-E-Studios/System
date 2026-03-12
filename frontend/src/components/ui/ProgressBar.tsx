import { useEffect, useState } from 'react';

interface ProgressBarProps {
  value: number;
  showLabel?: boolean;
  height?: number;
}

export default function ProgressBar({ value, showLabel = true, height = 2 }: ProgressBarProps) {
  const [width, setWidth] = useState(0);
  const clamped = Math.max(0, Math.min(100, value));

  useEffect(() => {
    const timer = requestAnimationFrame(() => setWidth(clamped));
    return () => cancelAnimationFrame(timer);
  }, [clamped]);

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex-1 bg-[var(--bg-secondary)] overflow-hidden"
        style={{ height: `${height}px` }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-[var(--accent)] transition-[width] duration-[800ms]"
          style={{
            width: `${width}%`,
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>
      {showLabel && (
        <span className="font-display text-base font-medium text-[var(--text-primary)] min-w-[3ch] text-right">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}
