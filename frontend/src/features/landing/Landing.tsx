import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';

/** Shared horizontal rhythm with header + footer. */
const SHELL = 'w-full max-w-6xl mx-auto px-5 sm:px-8 lg:px-10';

/** Minimal bridge / section schematic — stroke-only, Sahara tokens. */
function EngineeringSchematic({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <pattern id="landing-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path
            d="M 20 0 L 0 0 0 20"
            stroke="var(--border-emphasis)"
            strokeWidth="0.35"
            opacity="0.45"
          />
        </pattern>
      </defs>
      <rect width="400" height="220" fill="url(#landing-grid)" opacity="0.35" />

      <line x1="24" y1="178" x2="376" y2="178" stroke="var(--text-muted)" strokeWidth="0.75" opacity="0.5" />
      {[48, 120, 200, 280, 352].map((x) => (
        <line
          key={x}
          x1={x}
          y1="174"
          x2={x}
          y2="182"
          stroke="var(--text-muted)"
          strokeWidth="0.5"
          opacity="0.4"
        />
      ))}

      <line x1="100" y1="178" x2="100" y2="108" stroke="var(--accent)" strokeWidth="1.25" opacity="0.85" />
      <line x1="300" y1="178" x2="300" y2="108" stroke="var(--accent)" strokeWidth="1.25" opacity="0.85" />

      <path
        d="M 72 142 Q 200 88 328 142"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 72 148 Q 200 96 328 148"
        stroke="var(--gold)"
        strokeWidth="0.85"
        strokeLinecap="round"
        fill="none"
        opacity="0.75"
      />

      {[
        [118, 124],
        [158, 112],
        [200, 106],
        [242, 112],
        [282, 124],
      ].map(([x, y]) => (
        <line
          key={x}
          x1={x}
          y1={y}
          x2={x}
          y2="178"
          stroke="var(--text-muted)"
          strokeWidth="0.4"
          strokeDasharray="3 3"
          opacity="0.35"
        />
      ))}

      <g transform="translate(340 36)">
        <polygon points="0,0 -6,14 6,14" fill="var(--accent)" opacity="0.9" />
        <text
          x="0"
          y="26"
          textAnchor="middle"
          fill="var(--text-muted)"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', letterSpacing: '0.12em' }}
        >
          N
        </text>
      </g>

      <rect
        x="32"
        y="32"
        width="120"
        height="44"
        stroke="var(--accent)"
        strokeWidth="0.75"
        fill="var(--accent-light)"
        opacity="0.6"
        rx="1"
      />
      <text
        x="92"
        y="52"
        textAnchor="middle"
        fill="var(--accent)"
        style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.2em' }}
      >
        SEC A-A
      </text>
      <text
        x="92"
        y="66"
        textAnchor="middle"
        fill="var(--text-secondary)"
        style={{ fontFamily: 'var(--font-mono)', fontSize: '7px', letterSpacing: '0.08em' }}
      >
        SCALE NTS
      </text>
    </svg>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <header className="relative z-20 shrink-0 border-b border-[var(--border-default)] bg-[var(--nav-backdrop)] backdrop-blur-sm">
        <div className={`${SHELL} flex min-h-[3.25rem] items-center justify-between gap-4 py-3`}>
          <Link
            to="/"
            className="text-[0.95rem] font-display tracking-[0.28em] uppercase text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors duration-300 text-left leading-none"
          >
            Project 360
          </Link>
          <nav className="flex items-center justify-end gap-4 sm:gap-5 shrink-0" aria-label="Account">
            <Link
              to="/login"
              className="text-[0.68rem] font-body uppercase tracking-[0.18em] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors duration-300 whitespace-nowrap leading-none py-1"
            >
              Sign in
            </Link>
            <Link to="/register" className="inline-flex items-center">
              <Button variant="primary" className="!py-2 !px-4 !text-[0.62rem] !tracking-wider uppercase">
                Register
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative flex flex-1 flex-col min-h-0 overflow-hidden">
        {/* Full-bleed background (centered geometry) */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: [
              'linear-gradient(90deg, var(--accent) 1px, transparent 1px)',
              'linear-gradient(var(--accent) 1px, transparent 1px)',
            ].join(', '),
            backgroundSize: '48px 48px',
            backgroundPosition: 'center top',
          }}
        />
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[min(72vmin,520px)] w-[min(72vmin,520px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--border-emphasis)] opacity-25"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-35"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-[28%] left-1/2 h-px w-[min(90%,36rem)] -translate-x-1/2 bg-[var(--border-default)] opacity-60"
          aria-hidden
        />

        {/* Centered hero column */}
        <div
          className={`${SHELL} relative z-10 flex flex-1 flex-col items-center justify-center text-center py-12 sm:py-16 lg:py-20`}
        >
          <div className="flex w-full max-w-[440px] flex-col items-center">
            <div
              className="mb-8 w-full sm:mb-10 [&>svg]:block [&>svg]:h-auto [&>svg]:max-h-[min(38vh,220px)] [&>svg]:w-full [&>svg]:max-w-full"
              style={{ filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.06))' }}
            >
              <EngineeringSchematic className="aspect-[400/220] w-full" />
            </div>

            <div
              className="mb-6 flex w-full items-center justify-center gap-3 sm:gap-4"
              aria-hidden
            >
              <div className="h-px w-10 bg-[var(--accent)] opacity-60 sm:w-16" />
              <div className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-[var(--accent)] sm:h-12 sm:w-12">
                <span
                  className="text-[1.35rem] leading-none text-[var(--accent)] sm:text-[1.5rem]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  IQ
                </span>
              </div>
              <div className="h-px w-10 bg-[var(--accent)] opacity-60 sm:w-16" />
            </div>

            <h1 className="mb-3 w-full max-w-xl text-balance font-display text-[clamp(1.65rem,4.2vw,2.65rem)] uppercase leading-tight tracking-[0.22em] text-[var(--text-primary)] pl-[0.11em]">
              Project 360
            </h1>
            <p
              className="max-w-md text-balance font-mono text-[0.62rem] uppercase leading-relaxed tracking-[0.28em] text-[var(--text-muted)] sm:text-[0.68rem] sm:tracking-[0.32em]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Engineering · delivery · control
            </p>
          </div>
        </div>
      </main>

      <footer className="relative z-10 shrink-0 border-t border-[var(--border-default)] bg-[var(--bg-surface)]/80">
        <div className={`${SHELL} py-3.5 text-center`}>
          <p className="mx-auto max-w-2xl text-balance font-mono text-[0.6rem] leading-relaxed tracking-wide text-[var(--text-muted)] opacity-90">
            Mock data ·{' '}
            <span className="whitespace-nowrap text-[var(--text-secondary)]">VITE_USE_MOCK_AUTH=false</span>{' '}
            for API
          </p>
        </div>
      </footer>
    </div>
  );
}
