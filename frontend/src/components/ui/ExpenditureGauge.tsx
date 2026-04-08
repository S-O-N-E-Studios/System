import { useEffect, useRef } from 'react';

interface ExpenditureGaugeProps {
  label: string;
  sublabel?: string;
  /** Expenditure as a percentage of budget (0–100). */
  value: number;
  size?: number;
  className?: string;
}

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const STROKE = 8;

function trackColor(): string {
  return 'var(--chart-bar-base)';
}

function fillColor(pct: number): string {
  if (pct >= 90) return 'var(--status-danger)';
  if (pct >= 70) return 'var(--status-warning)';
  return 'var(--status-success)';
}

export default function ExpenditureGauge({
  label,
  sublabel,
  value,
  size = 140,
  className = '',
}: ExpenditureGaugeProps) {
  const circleRef = useRef<SVGCircleElement>(null);
  const clamped = Math.max(0, Math.min(100, value));
  const targetOffset = CIRCUMFERENCE * (1 - clamped / 100);
  const color = fillColor(clamped);
  const viewBox = (RADIUS + STROKE) * 2 + 4;
  const cx = viewBox / 2;
  const cy = viewBox / 2;

  useEffect(() => {
    const el = circleRef.current;
    if (!el) return;
    el.style.transition = 'none';
    el.style.strokeDashoffset = String(CIRCUMFERENCE);
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)';
        el.style.strokeDashoffset = String(targetOffset);
      });
    });
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [targetOffset]);

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div style={{ width: size, height: size }}>
        <svg
          viewBox={`0 0 ${viewBox} ${viewBox}`}
          width={size}
          height={size}
          aria-label={`${label}: ${Math.round(clamped)}%`}
          role="img"
          style={{ display: 'block' }}
        >
          {/* Track ring */}
          <circle
            cx={cx}
            cy={cy}
            r={RADIUS}
            fill="none"
            stroke={trackColor()}
            strokeWidth={STROKE}
          />
          {/* Expenditure fill — rotated so 0% starts at 12 o'clock */}
          <circle
            ref={circleRef}
            cx={cx}
            cy={cy}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="butt"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE}
            style={{
              transformOrigin: `${cx}px ${cy}px`,
              transform: 'rotate(-90deg)',
            }}
          />
          {/* Percentage label */}
          <text
            x="50%"
            y="46%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="var(--text-financial)"
            fontSize="17"
            fontFamily="'IBM Plex Mono', monospace"
            fontWeight="600"
          >
            {Math.round(clamped)}%
          </text>
          <text
            x="50%"
            y="62%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="var(--text-muted)"
            fontSize="9"
            fontFamily="'Inter', sans-serif"
          >
            spent
          </text>
        </svg>
      </div>
      <div className="text-center">
        <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--text-primary)] leading-tight">
          {label}
        </p>
        {sublabel && (
          <p className="text-[0.6rem] text-[var(--text-muted)] mt-0.5">{sublabel}</p>
        )}
      </div>
    </div>
  );
}
