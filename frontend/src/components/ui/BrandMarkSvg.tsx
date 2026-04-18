import type { SVGProps } from 'react';

const DISPLAY_STACK = "'DM Serif Display', Georgia, serif";

/** Sidebar IQ tile — same 32×32 geometry and colours as `syncAppFavicon` (terracotta on surface). */
export default function BrandMarkSvg({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={['h-8 w-8 shrink-0', className].filter(Boolean).join(' ')}
      aria-hidden="true"
      {...props}
    >
      <rect width="32" height="32" fill="var(--bg-surface)" />
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        fill="none"
        stroke="var(--accent)"
        strokeWidth={1}
      />
      <text
        x={16}
        y={16}
        dominantBaseline="central"
        textAnchor="middle"
        fill="var(--accent)"
        style={{
          fontFamily: DISPLAY_STACK,
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        IQ
      </text>
    </svg>
  );
}
