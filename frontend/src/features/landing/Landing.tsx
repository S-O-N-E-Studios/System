import { Link } from 'react-router-dom';

/** Realistic engineering plan drawing — composite girder road bridge, elevation + plan + title block. */
function EngineeringSchematic({ className }: { className?: string }) {
  const mono = 'var(--font-mono)';
  const acc = 'var(--accent)';
  const muted = 'var(--text-muted)';
  const sec = 'var(--text-secondary)';
  const border = 'var(--border-default)';
  // Hatching stripe pattern (concrete sections in engineering drawings)
  return (
    <svg className={className} viewBox="0 0 580 360" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" stroke={border} strokeWidth="0.25" opacity="0.5" />
        </pattern>
        {/* 45° hatch for concrete sections */}
        <pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke={muted} strokeWidth="0.5" opacity="0.55" />
        </pattern>
        {/* Dense hatch for fill/soil */}
        <pattern id="soil" width="4" height="4" patternUnits="userSpaceOnUse">
          <line x1="0" y1="4" x2="4" y2="0" stroke={muted} strokeWidth="0.4" opacity="0.4" />
          <line x1="-1" y1="1" x2="1" y2="-1" stroke={muted} strokeWidth="0.4" opacity="0.4" />
          <line x1="3" y1="5" x2="5" y2="3" stroke={muted} strokeWidth="0.4" opacity="0.4" />
        </pattern>
      </defs>

      {/* Background grid */}
      <rect width="580" height="360" fill="url(#grid)" opacity="0.35" />

      {/* ── OUTER DRAWING BORDER ── */}
      <rect x="10" y="10" width="560" height="340" stroke={muted} strokeWidth="0.5" opacity="0.4" />
      <rect x="14" y="14" width="552" height="332" stroke={acc} strokeWidth="0.3" opacity="0.2" />

      {/* ── TITLE / DRAWING HEADER ── */}
      <line x1="14" y1="28" x2="566" y2="28" stroke={muted} strokeWidth="0.4" opacity="0.4" />
      <text x="290" y="23" textAnchor="middle" fill={acc} style={{ fontFamily: mono, fontSize: '7px', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
        COMPOSITE GIRDER BRIDGE — SHEET 3 OF 6
      </text>

      {/* ── SECTION LABELS ── */}
      <text x="108" y="44" textAnchor="middle" fill={muted} style={{ fontFamily: mono, fontSize: '6px', letterSpacing: '0.22em' }}>ELEVATION · SCALE 1:200</text>
      <text x="430" y="44" textAnchor="middle" fill={muted} style={{ fontFamily: mono, fontSize: '6px', letterSpacing: '0.22em' }}>PLAN VIEW · SCALE 1:200</text>
      <line x1="14" y1="47" x2="566" y2="47" stroke={border} strokeWidth="0.3" opacity="0.5" />

      {/* ══════════════════════════════════════════
          LEFT HALF: BRIDGE ELEVATION (SIDE VIEW)
          Ground at y=210 | Soffit at y=165 | Deck top y=155
          ══════════════════════════════════════════ */}

      {/* Natural ground line */}
      <line x1="20" y1="210" x2="222" y2="210" stroke={muted} strokeWidth="0.7" opacity="0.6" />
      {/* Ground hatch below */}
      <rect x="20" y="210" width="202" height="12" fill="url(#soil)" opacity="0.7" />
      <line x1="20" y1="222" x2="222" y2="222" stroke={muted} strokeWidth="0.3" opacity="0.4" />

      {/* Left abutment — body */}
      <rect x="28" y="163" width="26" height="47" fill="url(#hatch)" stroke={acc} strokeWidth="0.7" opacity="0.85" />
      {/* Left abutment — footing */}
      <rect x="22" y="198" width="38" height="12" fill="url(#hatch)" stroke={acc} strokeWidth="0.6" opacity="0.7" />
      {/* Left approach embankment */}
      <path d="M 14 210 L 28 163 L 28 210 Z" fill="url(#soil)" opacity="0.5" />

      {/* Right abutment — body */}
      <rect x="166" y="163" width="26" height="47" fill="url(#hatch)" stroke={acc} strokeWidth="0.7" opacity="0.85" />
      {/* Right abutment — footing */}
      <rect x="160" y="198" width="38" height="12" fill="url(#hatch)" stroke={acc} strokeWidth="0.6" opacity="0.7" />
      {/* Right approach embankment */}
      <path d="M 220 210 L 192 163 L 192 210 Z" fill="url(#soil)" opacity="0.5" />

      {/* ── GIRDER (I-BEAM PROFILE) ── */}
      {/* Top flange */}
      <rect x="54" y="152" width="112" height="6" fill="var(--accent-light)" stroke={acc} strokeWidth="0.8" opacity="0.9" />
      {/* Web */}
      <rect x="66" y="158" width="88" height="18" fill="none" stroke={acc} strokeWidth="0.7" opacity="0.8" />
      {/* Bottom flange */}
      <rect x="58" y="176" width="104" height="5" fill="var(--accent-light)" stroke={acc} strokeWidth="0.8" opacity="0.9" />
      {/* Web stiffeners (vertical ribs) */}
      {[88, 110, 132].map((x) => (
        <line key={x} x1={x} y1="158" x2={x} y2="176" stroke={acc} strokeWidth="0.4" opacity="0.5" />
      ))}

      {/* ── BRIDGE DECK SLAB ── */}
      <rect x="48" y="145" width="124" height="9" fill="url(#hatch)" stroke={acc} strokeWidth="0.7" opacity="0.85" />

      {/* ── PARAPET WALLS ── */}
      <rect x="48" y="134" width="10" height="11" fill="url(#hatch)" stroke={acc} strokeWidth="0.6" opacity="0.8" />
      <rect x="162" y="134" width="10" height="11" fill="url(#hatch)" stroke={acc} strokeWidth="0.6" opacity="0.8" />
      {/* Parapet rail */}
      <line x1="50" y1="134" x2="50" y2="128" stroke={acc} strokeWidth="0.8" opacity="0.7" />
      <line x1="170" y1="134" x2="170" y2="128" stroke={acc} strokeWidth="0.8" opacity="0.7" />
      <line x1="50" y1="128" x2="170" y2="128" stroke={acc} strokeWidth="0.6" opacity="0.6" />

      {/* ── ROAD SURFACE ── */}
      <line x1="50" y1="145" x2="170" y2="145" stroke="var(--gold)" strokeWidth="1.2" opacity="0.7" />
      {/* Centreline marking (dashes) */}
      {[68,84,100,116,132,148].map((x) => (
        <line key={x} x1={x} y1="145" x2={x+8} y2="145" stroke="var(--gold)" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.45" />
      ))}

      {/* ── BEARING PADS ── */}
      {[[50,181],[162,181]].map(([bx, by]) => (
        <rect key={bx} x={bx} y={by} width="12" height="4" fill="none" stroke={sec} strokeWidth="0.6" opacity="0.7" strokeDasharray="2 1" />
      ))}

      {/* ── DIMENSION LINES — Elevation ── */}
      {/* Span dimension */}
      <line x1="54" y1="220" x2="166" y2="220" stroke={muted} strokeWidth="0.5" opacity="0.5" />
      <line x1="54" y1="216" x2="54" y2="224" stroke={muted} strokeWidth="0.5" opacity="0.5" />
      <line x1="166" y1="216" x2="166" y2="224" stroke={muted} strokeWidth="0.5" opacity="0.5" />
      <text x="110" y="230" textAnchor="middle" fill={muted} style={{ fontFamily: mono, fontSize: '5.5px', letterSpacing: '0.1em' }}>SPAN = 40 000</text>

      {/* Overall width dimension (vertical) */}
      <line x1="24" y1="128" x2="24" y2="210" stroke={muted} strokeWidth="0.5" opacity="0.5" />
      <line x1="20" y1="128" x2="28" y2="128" stroke={muted} strokeWidth="0.5" opacity="0.5" />
      <line x1="20" y1="210" x2="28" y2="210" stroke={muted} strokeWidth="0.5" opacity="0.5" />
      <text x="17" y="173" textAnchor="middle" fill={muted} style={{ fontFamily: mono, fontSize: '5px', letterSpacing: '0.06em' }} transform="rotate(-90 17 173)">H=5 250</text>

      {/* Section cut indicator A-A */}
      <line x1="110" y1="126" x2="110" y2="238" stroke={acc} strokeWidth="0.5" strokeDasharray="5 3" opacity="0.5" />
      <circle cx="110" cy="124" r="5" stroke={acc} strokeWidth="0.6" fill="none" opacity="0.7" />
      <text x="110" y="126" textAnchor="middle" fill={acc} style={{ fontFamily: mono, fontSize: '5px' }}>A</text>
      <circle cx="110" cy="240" r="5" stroke={acc} strokeWidth="0.6" fill="none" opacity="0.7" />
      <text x="110" y="242" textAnchor="middle" fill={acc} style={{ fontFamily: mono, fontSize: '5px' }}>A</text>

      {/* Vertical divider between elevation and plan views */}
      <line x1="240" y1="47" x2="240" y2="300" stroke={border} strokeWidth="0.4" strokeDasharray="4 3" opacity="0.55" />

      {/* ══════════════════════════════════════════
          RIGHT HALF: BRIDGE PLAN VIEW (TOP VIEW)
          ══════════════════════════════════════════ */}

      {/* Road carriageway outline */}
      <rect x="256" y="80" width="290" height="46" stroke={acc} strokeWidth="0.8" opacity="0.8" fill="none" />
      {/* Road surface fill */}
      <rect x="258" y="82" width="286" height="42" fill="var(--accent-light)" opacity="0.12" />

      {/* Lane markings */}
      <line x1="258" y1="103" x2="544" y2="103" stroke="var(--gold)" strokeWidth="0.6" strokeDasharray="12 6" opacity="0.5" />

      {/* Edge beams (parallel to road) */}
      <rect x="256" y="76" width="290" height="6" fill="url(#hatch)" stroke={acc} strokeWidth="0.6" opacity="0.75" />
      <rect x="256" y="124" width="290" height="6" fill="url(#hatch)" stroke={acc} strokeWidth="0.6" opacity="0.75" />

      {/* Left abutment — plan */}
      <rect x="256" y="68" width="14" height="72" fill="url(#hatch)" stroke={acc} strokeWidth="0.7" opacity="0.8" />
      {/* Right abutment — plan */}
      <rect x="532" y="68" width="14" height="72" fill="url(#hatch)" stroke={acc} strokeWidth="0.7" opacity="0.8" />

      {/* Main girders — plan projection (4 girders) */}
      {[88,96,110,118].map((y) => (
        <line key={y} x1="270" y1={y} x2="532" y2={y} stroke={acc} strokeWidth="0.5" opacity={y === 88 || y === 118 ? 0.7 : 0.35} />
      ))}

      {/* Diaphragms / cross-frames at intervals */}
      {[308, 360, 412, 464].map((x) => (
        <line key={x} x1={x} y1="88" x2={x} y2="118" stroke={acc} strokeWidth="0.5" opacity="0.5" />
      ))}

      {/* Road centreline */}
      <line x1="270" y1="103" x2="532" y2="103" stroke="var(--gold)" strokeWidth="0.5" strokeDasharray="8 4" opacity="0.4" />

      {/* Bearing positions (dots at each support) */}
      {[[270,88],[270,118],[532,88],[532,118]].map(([bx,by], i) => (
        <circle key={i} cx={bx} cy={by} r="3" stroke={acc} strokeWidth="0.6" fill="none" opacity="0.7" />
      ))}

      {/* Plan width dimension */}
      <line x1="548" y1="76" x2="548" y2="130" stroke={muted} strokeWidth="0.5" opacity="0.5" />
      <line x1="544" y1="76" x2="552" y2="76" stroke={muted} strokeWidth="0.5" opacity="0.5" />
      <line x1="544" y1="130" x2="552" y2="130" stroke={muted} strokeWidth="0.5" opacity="0.5" />
      <text x="558" y="106" textAnchor="middle" fill={muted} style={{ fontFamily: mono, fontSize: '5px', letterSpacing: '0.06em' }} transform="rotate(90 558 106)">W = 8 500</text>

      {/* Plan span dimension */}
      <line x1="270" y1="142" x2="532" y2="142" stroke={muted} strokeWidth="0.5" opacity="0.5" />
      <line x1="270" y1="138" x2="270" y2="146" stroke={muted} strokeWidth="0.5" opacity="0.5" />
      <line x1="532" y1="138" x2="532" y2="146" stroke={muted} strokeWidth="0.5" opacity="0.5" />
      <text x="401" y="152" textAnchor="middle" fill={muted} style={{ fontFamily: mono, fontSize: '5.5px', letterSpacing: '0.1em' }}>L = 40 000</text>

      {/* North arrow — plan view */}
      <g transform="translate(393 65)">
        <line x1="0" y1="12" x2="0" y2="-2" stroke={acc} strokeWidth="0.8" opacity="0.7" />
        <polygon points="0,-2 -4,6 4,6" fill={acc} opacity="0.8" />
        <text x="0" y="20" textAnchor="middle" fill={muted} style={{ fontFamily: mono, fontSize: '6px', letterSpacing: '0.15em' }}>N</text>
      </g>

      {/* ── SECTION VIEW A-A (small inset, bottom right) ── */}
      <rect x="420" y="165" width="130" height="70" stroke={muted} strokeWidth="0.4" opacity="0.4" />
      <text x="485" y="175" textAnchor="middle" fill={muted} style={{ fontFamily: mono, fontSize: '5.5px', letterSpacing: '0.18em' }}>SECTION A–A</text>
      {/* Deck slab */}
      <rect x="432" y="182" width="106" height="8" fill="url(#hatch)" stroke={acc} strokeWidth="0.6" opacity="0.8" />
      {/* 4 I-beam cross sections */}
      {[444, 462, 480, 498, 516].map((x) => (
        <g key={x}>
          <rect x={x - 4} y="190" width="8" height="2.5" fill="var(--accent-light)" stroke={acc} strokeWidth="0.5" opacity="0.85" />
          <rect x={x - 1} y="192.5" width="2" height="12" fill="none" stroke={acc} strokeWidth="0.5" opacity="0.7" />
          <rect x={x - 4.5} y="204.5" width="9" height="2.5" fill="var(--accent-light)" stroke={acc} strokeWidth="0.5" opacity="0.85" />
        </g>
      ))}
      {/* Road surface line in section */}
      <line x1="432" y1="182" x2="538" y2="182" stroke="var(--gold)" strokeWidth="0.8" opacity="0.65" />
      {/* Section labels */}
      <text x="432" y="227" fill={muted} style={{ fontFamily: mono, fontSize: '4.5px', letterSpacing: '0.1em' }}>SCALE 1:50</text>
      <text x="432" y="233" fill={muted} style={{ fontFamily: mono, fontSize: '4.5px', letterSpacing: '0.1em' }}>DWG NO: STR-04-EL-003</text>

      {/* ── TITLE BLOCK (bottom strip) ── */}
      <line x1="14" y1="300" x2="566" y2="300" stroke={acc} strokeWidth="0.5" opacity="0.4" />
      <rect x="14" y="300" width="552" height="44" stroke={muted} strokeWidth="0.3" opacity="0.2" />

      {/* Title block grid */}
      <line x1="200" y1="300" x2="200" y2="344" stroke={muted} strokeWidth="0.3" opacity="0.3" />
      <line x1="360" y1="300" x2="360" y2="344" stroke={muted} strokeWidth="0.3" opacity="0.3" />
      <line x1="460" y1="300" x2="460" y2="344" stroke={muted} strokeWidth="0.3" opacity="0.3" />
      <line x1="14" y1="320" x2="566" y2="320" stroke={muted} strokeWidth="0.3" opacity="0.3" />

      {/* Title block content */}
      <text x="22" y="312" fill={muted} style={{ fontFamily: mono, fontSize: '5px', letterSpacing: '0.1em' }}>PROJECT</text>
      <text x="22" y="335" fill={sec} style={{ fontFamily: mono, fontSize: '6px', letterSpacing: '0.08em' }}>R573 ROAD REHABILITATION — BRIDGE 4B</text>

      <text x="210" y="312" fill={muted} style={{ fontFamily: mono, fontSize: '5px', letterSpacing: '0.1em' }}>DRAWING TITLE</text>
      <text x="210" y="335" fill={sec} style={{ fontFamily: mono, fontSize: '5.5px', letterSpacing: '0.08em' }}>BRIDGE ELEVATION AND PLAN</text>

      <text x="368" y="312" fill={muted} style={{ fontFamily: mono, fontSize: '5px', letterSpacing: '0.1em' }}>DATE</text>
      <text x="368" y="335" fill={sec} style={{ fontFamily: mono, fontSize: '5.5px', letterSpacing: '0.08em' }}>APR 2026</text>

      <text x="468" y="312" fill={muted} style={{ fontFamily: mono, fontSize: '5px', letterSpacing: '0.1em' }}>REV</text>
      <text x="468" y="335" fill={acc} style={{ fontFamily: mono, fontSize: '6.5px', letterSpacing: '0.08em' }}>C</text>

      {/* Corner registration marks */}
      {[[14,14],[566,14],[14,344],[566,344]].map(([cx,cy], i) => (
        <g key={i}>
          <line x1={cx-7} y1={cy} x2={cx+7} y2={cy} stroke={muted} strokeWidth="0.4" opacity="0.35" />
          <line x1={cx} y1={cy-7} x2={cx} y2={cy+7} stroke={muted} strokeWidth="0.4" opacity="0.35" />
        </g>
      ))}
    </svg>
  );
}

export default function Landing() {
  return (
    <div className="relative min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden">

      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            'linear-gradient(90deg, var(--accent) 1px, transparent 1px)',
            'linear-gradient(var(--accent) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '48px 48px',
          backgroundPosition: 'center center',
          opacity: 0.045,
        }}
        aria-hidden
      />

      {/* Radial glow — center */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 'min(90vw, 700px)',
          height: 'min(90vw, 700px)',
          background: 'radial-gradient(ellipse at center, var(--accent-light) 0%, transparent 70%)',
          opacity: 0.35,
        }}
        aria-hidden
      />

      {/* Top shimmer line */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, var(--accent), transparent)', opacity: 0.5 }}
        aria-hidden
      />

      {/* Corner watermark — top left */}
      <div className="absolute top-6 left-8 z-20 select-none">
        <span
          className="text-[0.7rem] uppercase tracking-[0.3em] text-[var(--text-muted)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          SONE · PROJECT 360
        </span>
      </div>

      {/* Corner info — top right */}
      <div className="absolute top-6 right-8 z-20 select-none hidden sm:block">
        <span
          className="text-[0.62rem] uppercase tracking-[0.22em] text-[var(--text-muted)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          v6.0 · MVP
        </span>
      </div>

      {/* Main hero — vertically and horizontally centered */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">

        {/* Schematic */}
        <div
          className="w-full max-w-[520px] mb-10"
          style={{ filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.08))' }}
        >
          <EngineeringSchematic className="w-full aspect-[480/260]" />
        </div>

        {/* IQ emblem */}
        <div className="flex items-center justify-center gap-5 mb-8" aria-hidden>
          <div className="h-px w-12 bg-[var(--accent)] opacity-50 sm:w-20" />
          <div className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-[var(--accent)] sm:h-14 sm:w-14">
            <span
              className="text-[1.4rem] leading-none text-[var(--accent)] sm:text-[1.6rem]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              IQ
            </span>
          </div>
          <div className="h-px w-12 bg-[var(--accent)] opacity-50 sm:w-20" />
        </div>

        {/* Heading */}
        <h1
          className="mb-3 text-balance uppercase leading-none tracking-[0.24em] text-[var(--text-primary)]"
          style={{
            fontFamily: 'var(--font-display-override, var(--font-display))',
            fontSize: 'clamp(2rem, 6vw, 3.6rem)',
            fontWeight: 400,
            paddingLeft: '0.12em',
          }}
        >
          Project 360
        </h1>

        {/* Tagline */}
        <p
          className="mb-12 text-balance uppercase text-[var(--text-muted)]"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(0.6rem, 1.4vw, 0.72rem)',
            letterSpacing: '0.34em',
            lineHeight: '1.8',
          }}
        >
          Engineering · Delivery · Control
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-stretch justify-center gap-4 w-full max-w-md">
          <Link
            to="/login"
            className="sahara-btn sahara-btn--primary flex-1 text-center whitespace-nowrap"
            style={{ padding: '0.875rem 2rem', fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="sahara-btn sahara-btn--secondary flex-1 text-center whitespace-nowrap"
            style={{ padding: '0.875rem 2rem', fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}
          >
            Register Organisation
          </Link>
        </div>

        {/* Feature micro-list */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {[
            'Multi-tenant SaaS',
            '6-Stage Lifecycle',
            'Grant Tracking',
            'Payment Forecasts',
            'Atlas Sahara UI',
          ].map((label) => (
            <span
              key={label}
              className="flex items-center gap-2 text-[var(--text-muted)]"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.18em' }}
            >
              <span className="h-1 w-1 rounded-full bg-[var(--accent)] opacity-70" aria-hidden />
              {label.toUpperCase()}
            </span>
          ))}
        </div>
      </main>

      {/* Bottom border line */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, var(--border-default), transparent)', opacity: 0.6 }}
        aria-hidden
      />

      {/* Bottom env note */}
      <footer className="relative z-10 shrink-0 py-4 text-center">
        <p
          className="text-[var(--text-muted)] opacity-60"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.14em' }}
        >
          MOCK DATA ACTIVE · SET{' '}
          <span className="text-[var(--text-secondary)]">VITE_USE_MOCK_AUTH=false</span>{' '}
          FOR API
        </p>
      </footer>
    </div>
  );
}
