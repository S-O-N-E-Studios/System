import { Link } from 'react-router-dom';

/**
 * Cable-stayed bridge — Zakim (Leonard P. Zakim Bunker Hill) inspired.
 * Profile: pylon wider at base AND top than at deck level → classic X / diamond silhouette.
 * Panels: elevation (left) · plan view (right) · section B-B inset · title block.
 * Animations: stroke-dashoffset draw-in on structural lines, group fade-in on fills,
 *             SVG <animate> scanner sweep + per-cable glow pulse after main draw completes.
 */
function EngineeringSchematic({ className }: { className?: string }) {
  const mono  = 'var(--font-mono)';
  const acc   = 'var(--accent)';
  const muted = 'var(--text-muted)';
  const sec   = 'var(--text-secondary)';
  const bdr   = 'var(--border-default)';
  const gold  = 'var(--gold)';
  const aLt   = 'var(--accent-light)';

  // ── Tower geometry (elevation view) ─────────────────────────────────────────
  // The X-profile: deck level is narrowest, base and mast-tips both spread wider.
  const TL: [number, number] = [100,  65];   // left mast cap
  const TR: [number, number] = [134,  65];   // right mast cap
  const LL: [number, number] = [106, 170];   // left column at deck
  const RL: [number, number] = [128, 170];   // right column at deck
  const LG: [number, number] = [ 90, 208];   // left foundation foot
  const RG: [number, number] = [144, 208];   // right foundation foot

  // Stay cable anchor points on the deck (y=170)
  const lCables: [number, number][] = [
    [44, 170], [56, 170], [68, 170], [80, 170], [92, 170], [106, 170],
  ];
  const rCables: [number, number][] = [
    [128, 170], [140, 170], [152, 170], [164, 170], [178, 170], [192, 170],
  ];
  const allCables = [...lCables, ...rCables];

  // Delay helper: returns CSS class name for animation delay slot n
  const d = (n: number) => `cs-d${String(n).padStart(2, '0')}`;

  // Generate 24 delay classes (0–23) at 0.18 s each
  const cssDelays = Array.from({ length: 24 }, (_, i) =>
    `.cs-d${String(i).padStart(2, '0')} { animation-delay: ${(i * 0.18).toFixed(2)}s; }`,
  ).join('\n          ');

  return (
    <svg
      className={className}
      viewBox="0 0 580 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        {/* Engineering paper grid */}
        <pattern id="cs-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" stroke={bdr} strokeWidth="0.25" opacity="0.5" />
        </pattern>
        {/* 45° hatch — concrete / structural sections */}
        <pattern id="cs-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="5" stroke={muted} strokeWidth="0.5" opacity="0.55" />
        </pattern>
        {/* Cross-hatch — embankment / soil fill */}
        <pattern id="cs-soil" width="4" height="4" patternUnits="userSpaceOnUse">
          <line x1="0" y1="4" x2="4" y2="0" stroke={muted} strokeWidth="0.4" opacity="0.4" />
          <line x1="-1" y1="1" x2="1" y2="-1" stroke={muted} strokeWidth="0.4" opacity="0.4" />
          <line x1="3" y1="5" x2="5" y2="3" stroke={muted} strokeWidth="0.4" opacity="0.4" />
        </pattern>

        <style>{`
          /* ── Draw-in: stroke-dashoffset sweep (structural lines) ── */
          @keyframes csLineDraw {
            from { stroke-dashoffset: 800; opacity: 0; }
            to   { stroke-dashoffset: 0;   opacity: 1; }
          }
          /* ── Group fade: for fills, hatch areas, multi-element groups ── */
          @keyframes csGroupFade {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          /* ── Text/label fade with micro-lift ── */
          @keyframes csFadeUp {
            from { opacity: 0; transform: translateY(2px); }
            to   { opacity: 1; transform: translateY(0); }
          }

          .cs-ldraw {
            stroke-dasharray: 800;
            stroke-dashoffset: 800;
            opacity: 0;
            animation: csLineDraw 1.0s ease both;
          }
          .cs-gfade { opacity: 0; animation: csGroupFade 0.75s ease both; }
          .cs-tfade { opacity: 0; animation: csFadeUp   0.60s ease both; }

          /* Staggered delay slots */
          ${cssDelays}

          @media (prefers-reduced-motion: reduce) {
            .cs-ldraw {
              animation: none;
              stroke-dasharray: none;
              stroke-dashoffset: 0;
              opacity: 1;
            }
            .cs-gfade,
            .cs-tfade { animation: none; opacity: 1; }
          }
        `}</style>
      </defs>

      {/* ── BACKGROUND GRID (instant) ── */}
      <rect width="580" height="360" fill="url(#cs-grid)" opacity="0.35" />

      {/* ── OUTER BORDERS ── d=0.00s */}
      <g className={`cs-gfade ${d(0)}`}>
        <rect x="10" y="10" width="560" height="340" stroke={muted} strokeWidth="0.5" opacity="0.4" />
        <rect x="14" y="14" width="552" height="332" stroke={acc}   strokeWidth="0.3" opacity="0.2" />
      </g>

      {/* ── HEADER ── d=0.18s */}
      <g className={`cs-tfade ${d(1)}`}>
        <line x1="14" y1="28" x2="566" y2="28" stroke={muted} strokeWidth="0.4" opacity="0.4" />
        <text x="290" y="23" textAnchor="middle" fill={acc}
          style={{ fontFamily: mono, fontSize: '7px', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
          CABLE-STAYED BRIDGE — SHEET 1 OF 5
        </text>
        <text x="115" y="44" textAnchor="middle" fill={muted}
          style={{ fontFamily: mono, fontSize: '6px', letterSpacing: '0.22em' }}>
          ELEVATION · SCALE 1:500
        </text>
        <text x="410" y="44" textAnchor="middle" fill={muted}
          style={{ fontFamily: mono, fontSize: '6px', letterSpacing: '0.22em' }}>
          PLAN VIEW · SCALE 1:500
        </text>
        <line x1="14" y1="47" x2="566" y2="47" stroke={bdr} strokeWidth="0.3" opacity="0.5" />
      </g>

      {/* Left/right panel divider */}
      <line x1="242" y1="47" x2="242" y2="298"
        stroke={bdr} strokeWidth="0.4" strokeDasharray="4 3" opacity="0.55" />

      {/* ══════════════════════════════════════════════════════════
          ELEVATION — LEFT HALF
          Ground y=208 · Deck top y=170 · Deck bottom y=178
          ══════════════════════════════════════════════════════════ */}

      {/* Ground + soil hatch ── d=0.36s */}
      <g className={`cs-gfade ${d(2)}`}>
        <line x1="18" y1="208" x2="232" y2="208" stroke={muted} strokeWidth="0.8" opacity="0.65" />
        <rect x="18" y="208" width="214" height="14" fill="url(#cs-soil)" opacity="0.7" />
        <line x1="18" y1="222" x2="232" y2="222" stroke={muted} strokeWidth="0.3" opacity="0.35" />
      </g>

      {/* Left abutment ── d=0.54s */}
      <g className={`cs-gfade ${d(3)}`}>
        <path d="M 14 208 L 26 170 L 26 208 Z" fill="url(#cs-soil)" opacity="0.45" />
        <rect x="26" y="170" width="18" height="38" fill="url(#cs-hatch)" stroke={acc} strokeWidth="0.7" opacity="0.85" />
        <rect x="20" y="200" width="30" height="8"  fill="url(#cs-hatch)" stroke={acc} strokeWidth="0.6" opacity="0.70" />
      </g>

      {/* Right abutment ── d=0.54s */}
      <g className={`cs-gfade ${d(3)}`}>
        <path d="M 232 208 L 210 170 L 210 208 Z" fill="url(#cs-soil)" opacity="0.45" />
        <rect x="192" y="170" width="18" height="38" fill="url(#cs-hatch)" stroke={acc} strokeWidth="0.7" opacity="0.85" />
        <rect x="186" y="200" width="30" height="8"  fill="url(#cs-hatch)" stroke={acc} strokeWidth="0.6" opacity="0.70" />
      </g>

      {/* Deck slab + road surface + parapets ── d=0.72s */}
      <g className={`cs-gfade ${d(4)}`}>
        {/* Concrete slab */}
        <rect x="38" y="170" width="158" height="8" fill="url(#cs-hatch)" stroke={acc} strokeWidth="0.7" opacity="0.85" />
        {/* Road surface line */}
        <line x1="44" y1="170" x2="192" y2="170" stroke={gold} strokeWidth="1.2" opacity="0.70" />
        {/* Centreline dashes */}
        {[58, 78, 98, 118, 138, 158, 178].map(x => (
          <line key={x} x1={x} y1="170" x2={x + 12} y2="170"
            stroke={gold} strokeWidth="0.5" strokeDasharray="6 6" opacity="0.38" />
        ))}
        {/* Left parapet */}
        <rect x="38" y="160" width="8" height="10" fill="url(#cs-hatch)" stroke={acc} strokeWidth="0.6" opacity="0.75" />
        {/* Right parapet */}
        <rect x="188" y="160" width="8" height="10" fill="url(#cs-hatch)" stroke={acc} strokeWidth="0.6" opacity="0.75" />
        {/* Parapet rail */}
        <line x1="40"  y1="160" x2="40"  y2="154" stroke={acc} strokeWidth="0.8"  opacity="0.65" />
        <line x1="194" y1="160" x2="194" y2="154" stroke={acc} strokeWidth="0.8"  opacity="0.65" />
        <line x1="40"  y1="154" x2="194" y2="154" stroke={acc} strokeWidth="0.55" opacity="0.55" />
      </g>

      {/* ── TOWER — A-frame legs below deck ── d=0.90s ── */}
      {/* These draw in with stroke-dashoffset so they feel like they're being sketched */}
      <line className={`cs-ldraw ${d(5)}`}
        x1={LL[0]} y1={LL[1]} x2={LG[0]} y2={LG[1]}
        stroke={acc} strokeWidth="2.2" />
      <line className={`cs-ldraw ${d(5)}`}
        x1={RL[0]} y1={RL[1]} x2={RG[0]} y2={RG[1]}
        stroke={acc} strokeWidth="2.2" />
      {/* Foundation pads + leg fill */}
      <g className={`cs-gfade ${d(5)}`}>
        <rect x="83"  y="203" width="16" height="6" fill="url(#cs-hatch)" stroke={acc} strokeWidth="0.7" opacity="0.80" />
        <rect x="137" y="203" width="16" height="6" fill="url(#cs-hatch)" stroke={acc} strokeWidth="0.7" opacity="0.80" />
        <path
          d={`M ${LG[0]} ${LG[1]} L ${LL[0]} ${LL[1]} L ${RL[0]} ${RL[1]} L ${RG[0]} ${RG[1]} Z`}
          fill="url(#cs-hatch)" opacity="0.08"
        />
      </g>

      {/* ── TOWER — upper columns (above deck) ── d=1.08s ── */}
      <line className={`cs-ldraw ${d(6)}`}
        x1={LL[0]} y1={LL[1]} x2={TL[0]} y2={TL[1]}
        stroke={acc} strokeWidth="2.5" />
      <line className={`cs-ldraw ${d(6)}`}
        x1={RL[0]} y1={RL[1]} x2={TR[0]} y2={TR[1]}
        stroke={acc} strokeWidth="2.5" />

      {/* ── TOWER — cross-bars, mast caps, height label ── d=1.26s ── */}
      <g className={`cs-gfade ${d(7)}`}>
        {/* Top crossbar spanning both mast tips */}
        <line x1={TL[0] - 3} y1={TL[1]} x2={TR[0] + 3} y2={TR[1]}
          stroke={acc} strokeWidth="1.0" opacity="0.85" />
        {/* Mid crossbar — interpolated at y≈118 on the diagonal columns */}
        <line x1="103" y1="118" x2="131" y2="118" stroke={acc} strokeWidth="0.75" opacity="0.65" />
        {/* Lower crossbar near deck at y≈147 */}
        <line x1="105" y1="147" x2="129" y2="147" stroke={acc} strokeWidth="0.60" opacity="0.50" />
        {/* Mast head caps */}
        <rect x={TL[0] - 5} y={TL[1] - 3} width="10" height="5"
          fill={aLt} stroke={acc} strokeWidth="0.8" opacity="0.90" />
        <rect x={TR[0] - 5} y={TR[1] - 3} width="10" height="5"
          fill={aLt} stroke={acc} strokeWidth="0.8" opacity="0.90" />
        {/* Pylon height annotation */}
        <text x="117" y="56" textAnchor="middle" fill={muted}
          style={{ fontFamily: mono, fontSize: '4.5px', letterSpacing: '0.12em' }}>
          PYLON H = 120 m
        </text>
      </g>

      {/* ── STAY CABLES — left fan + right fan, simultaneous staggered draw ──
           Delays d8–d13 used for both fans → both spread at same time from each tower */}
      {lCables.map(([x, y], i) => (
        <line key={`lc${i}`}
          className={`cs-ldraw ${d(8 + i)}`}
          x1={TL[0]} y1={TL[1]} x2={x} y2={y}
          stroke={acc}
          strokeWidth={i === 0 ? '0.9' : '0.5'} />
      ))}
      {rCables.map(([x, y], i) => (
        <line key={`rc${i}`}
          className={`cs-ldraw ${d(8 + i)}`}
          x1={TR[0]} y1={TR[1]} x2={x} y2={y}
          stroke={acc}
          strokeWidth={i === rCables.length - 1 ? '0.9' : '0.5'} />
      ))}

      {/* ── SECTION CUT B-B ── d=2.70s */}
      <g className={`cs-tfade ${d(15)}`}>
        <line x1="117" y1="148" x2="117" y2="236"
          stroke={acc} strokeWidth="0.5" strokeDasharray="5 3" opacity="0.5" />
        <circle cx="117" cy="146" r="5" stroke={acc} strokeWidth="0.6" fill="none" opacity="0.7" />
        <text x="117" y="148" textAnchor="middle" fill={acc}
          style={{ fontFamily: mono, fontSize: '5px' }}>B</text>
        <circle cx="117" cy="238" r="5" stroke={acc} strokeWidth="0.6" fill="none" opacity="0.7" />
        <text x="117" y="240" textAnchor="middle" fill={acc}
          style={{ fontFamily: mono, fontSize: '5px' }}>B</text>
      </g>

      {/* ── ELEVATION DIMENSIONS ── d=2.88s */}
      <g className={`cs-tfade ${d(16)}`}>
        {/* Main span */}
        <line x1="44"  y1="228" x2="192" y2="228" stroke={muted} strokeWidth="0.5" opacity="0.5" />
        <line x1="44"  y1="224" x2="44"  y2="232" stroke={muted} strokeWidth="0.5" opacity="0.5" />
        <line x1="192" y1="224" x2="192" y2="232" stroke={muted} strokeWidth="0.5" opacity="0.5" />
        <text x="118" y="238" textAnchor="middle" fill={muted}
          style={{ fontFamily: mono, fontSize: '5.5px', letterSpacing: '0.1em' }}>
          MAIN SPAN = 228 000
        </text>
        {/* Tower height — vertical */}
        <line x1="22" y1="65"  x2="22" y2="170" stroke={muted} strokeWidth="0.5" opacity="0.5" />
        <line x1="18" y1="65"  x2="26" y2="65"  stroke={muted} strokeWidth="0.5" opacity="0.5" />
        <line x1="18" y1="170" x2="26" y2="170" stroke={muted} strokeWidth="0.5" opacity="0.5" />
        <text x="15" y="120" textAnchor="middle" fill={muted}
          style={{ fontFamily: mono, fontSize: '5px', letterSpacing: '0.06em' }}
          transform="rotate(-90 15 120)">
          H = 120 000
        </text>
      </g>

      {/* ══════════════════════════════════════════════════════════
          PLAN VIEW — RIGHT HALF
          ══════════════════════════════════════════════════════════ */}

      {/* Road carriageway + edge beams + abutments ── d=3.06s */}
      <g className={`cs-gfade ${d(17)}`}>
        {/* Carriageway outline */}
        <rect x="256" y="80" width="288" height="48" stroke={acc} strokeWidth="0.8" opacity="0.8" fill="none" />
        <rect x="258" y="82" width="284" height="44" fill={aLt} opacity="0.10" />
        {/* Lane marking */}
        <line x1="258" y1="104" x2="542" y2="104"
          stroke={gold} strokeWidth="0.6" strokeDasharray="12 6" opacity="0.50" />
        {/* Edge beams (top + bottom) */}
        <rect x="256" y="74"  width="288" height="8" fill="url(#cs-hatch)" stroke={acc} strokeWidth="0.6" opacity="0.75" />
        <rect x="256" y="128" width="288" height="8" fill="url(#cs-hatch)" stroke={acc} strokeWidth="0.6" opacity="0.75" />
        {/* Left abutment plan */}
        <rect x="256" y="66" width="14" height="76" fill="url(#cs-hatch)" stroke={acc} strokeWidth="0.7" opacity="0.80" />
        {/* Right abutment plan */}
        <rect x="530" y="66" width="14" height="76" fill="url(#cs-hatch)" stroke={acc} strokeWidth="0.7" opacity="0.80" />
      </g>

      {/* Tower column footprints (straddle road on both sides) ── d=3.24s */}
      <g className={`cs-gfade ${d(18)}`}>
        <rect x="377" y="64"  width="10" height="14" fill="url(#cs-hatch)" stroke={acc} strokeWidth="0.7" opacity="0.85" />
        <rect x="377" y="132" width="10" height="14" fill="url(#cs-hatch)" stroke={acc} strokeWidth="0.7" opacity="0.85" />
        <rect x="399" y="64"  width="10" height="14" fill="url(#cs-hatch)" stroke={acc} strokeWidth="0.7" opacity="0.85" />
        <rect x="399" y="132" width="10" height="14" fill="url(#cs-hatch)" stroke={acc} strokeWidth="0.7" opacity="0.85" />
        {/* Leg boundary (dashed) */}
        <rect x="372" y="60" width="20" height="90"
          stroke={acc} strokeWidth="0.4" fill="none" opacity="0.28" strokeDasharray="3 2" />
        <rect x="394" y="60" width="20" height="90"
          stroke={acc} strokeWidth="0.4" fill="none" opacity="0.28" strokeDasharray="3 2" />
      </g>

      {/* Cable anchor dots + representative fan lines in plan ── d=3.42s */}
      <g className={`cs-gfade ${d(19)}`}>
        {/* Left-span anchor dots along deck edges */}
        {[270, 285, 300, 315, 330, 345, 360, 377].map(x => (
          <g key={x}>
            <circle cx={x} cy="80"  r="1.5" fill={acc} opacity="0.55" />
            <circle cx={x} cy="128" r="1.5" fill={acc} opacity="0.55" />
          </g>
        ))}
        {/* Right-span anchor dots */}
        {[409, 424, 439, 454, 469, 484, 499, 530].map(x => (
          <g key={x}>
            <circle cx={x} cy="80"  r="1.5" fill={acc} opacity="0.55" />
            <circle cx={x} cy="128" r="1.5" fill={acc} opacity="0.55" />
          </g>
        ))}
        {/* Representative cable lines (top edge only for legibility) */}
        {[270, 300, 330, 360].map((x, i) => (
          <line key={i} x1="382" y1="71" x2={x} y2="80"
            stroke={acc} strokeWidth="0.32" opacity="0.35" />
        ))}
        {[409, 439, 469, 530].map((x, i) => (
          <line key={i} x1="404" y1="71" x2={x} y2="80"
            stroke={acc} strokeWidth="0.32" opacity="0.35" />
        ))}
        {/* Road centreline */}
        <line x1="270" y1="104" x2="530" y2="104"
          stroke={gold} strokeWidth="0.5" strokeDasharray="8 4" opacity="0.40" />
      </g>

      {/* North arrow ── d=3.42s */}
      <g className={`cs-tfade ${d(19)}`} transform="translate(510 60)">
        <line x1="0" y1="12" x2="0" y2="-2" stroke={acc} strokeWidth="0.8" opacity="0.7" />
        <polygon points="0,-2 -4,6 4,6" fill={acc} opacity="0.8" />
        <text x="0" y="20" textAnchor="middle" fill={muted}
          style={{ fontFamily: mono, fontSize: '6px', letterSpacing: '0.15em' }}>N</text>
      </g>

      {/* Plan dimensions ── d=3.60s */}
      <g className={`cs-tfade ${d(20)}`}>
        <line x1="270" y1="148" x2="530" y2="148" stroke={muted} strokeWidth="0.5" opacity="0.5" />
        <line x1="270" y1="144" x2="270" y2="152" stroke={muted} strokeWidth="0.5" opacity="0.5" />
        <line x1="530" y1="144" x2="530" y2="152" stroke={muted} strokeWidth="0.5" opacity="0.5" />
        <text x="400" y="158" textAnchor="middle" fill={muted}
          style={{ fontFamily: mono, fontSize: '5.5px', letterSpacing: '0.1em' }}>L = 228 000</text>
        <line x1="548" y1="80"  x2="548" y2="128" stroke={muted} strokeWidth="0.5" opacity="0.5" />
        <line x1="544" y1="80"  x2="552" y2="80"  stroke={muted} strokeWidth="0.5" opacity="0.5" />
        <line x1="544" y1="128" x2="552" y2="128" stroke={muted} strokeWidth="0.5" opacity="0.5" />
        <text x="560" y="107" textAnchor="middle" fill={muted}
          style={{ fontFamily: mono, fontSize: '5px', letterSpacing: '0.06em' }}
          transform="rotate(90 560 107)">W = 28 500</text>
      </g>

      {/* ── SECTION B-B INSET (bottom right) ── d=3.60s */}
      <g className={`cs-tfade ${d(20)}`}>
        <rect x="420" y="170" width="128" height="70" stroke={muted} strokeWidth="0.4" opacity="0.4" />
        <text x="484" y="181" textAnchor="middle" fill={muted}
          style={{ fontFamily: mono, fontSize: '5.5px', letterSpacing: '0.18em' }}>SECTION B–B</text>
        {/* Deck slab cross-section */}
        <rect x="432" y="188" width="104" height="7" fill="url(#cs-hatch)" stroke={acc} strokeWidth="0.6" opacity="0.80" />
        <line x1="432" y1="188" x2="536" y2="188" stroke={gold} strokeWidth="0.7" opacity="0.65" />
        {/* Tower column cross-sections (outside the deck on each side) */}
        <rect x="428" y="172" width="6" height="16" fill={aLt} stroke={acc} strokeWidth="0.55" opacity="0.85" />
        <rect x="534" y="172" width="6" height="16" fill={aLt} stroke={acc} strokeWidth="0.55" opacity="0.85" />
        {/* I-beam cross-sections below deck */}
        {[444, 461, 478, 495, 512].map(x => (
          <g key={x}>
            <rect x={x - 4}   y="195"   width="8" height="2.5" fill={aLt} stroke={acc} strokeWidth="0.5" opacity="0.85" />
            <rect x={x - 1}   y="197.5" width="2" height="10"  fill="none"  stroke={acc} strokeWidth="0.5" opacity="0.65" />
            <rect x={x - 4.5} y="207.5" width="9" height="2.5" fill={aLt} stroke={acc} strokeWidth="0.5" opacity="0.85" />
          </g>
        ))}
        <text x="432" y="228" fill={muted} style={{ fontFamily: mono, fontSize: '4.5px', letterSpacing: '0.1em' }}>SCALE 1:100</text>
        <text x="432" y="234" fill={muted} style={{ fontFamily: mono, fontSize: '4.5px', letterSpacing: '0.1em' }}>DWG NO: STR-01-EL-001</text>
      </g>

      {/* ── TITLE BLOCK ── d=3.78s */}
      <g className={`cs-tfade ${d(21)}`}>
        <line x1="14" y1="299" x2="566" y2="299" stroke={acc} strokeWidth="0.5" opacity="0.4" />
        <rect x="14" y="299" width="552" height="45" stroke={muted} strokeWidth="0.3" opacity="0.2" />
        <line x1="200" y1="299" x2="200" y2="344" stroke={muted} strokeWidth="0.3" opacity="0.3" />
        <line x1="360" y1="299" x2="360" y2="344" stroke={muted} strokeWidth="0.3" opacity="0.3" />
        <line x1="460" y1="299" x2="460" y2="344" stroke={muted} strokeWidth="0.3" opacity="0.3" />
        <line x1="14"  y1="319" x2="566" y2="319" stroke={muted} strokeWidth="0.3" opacity="0.3" />
        <text x="22"  y="311" fill={muted} style={{ fontFamily: mono, fontSize: '5px',   letterSpacing: '0.10em' }}>PROJECT</text>
        <text x="22"  y="334" fill={sec}   style={{ fontFamily: mono, fontSize: '5.5px', letterSpacing: '0.08em' }}>CHARLES RIVER CROSSING — PHASE 2B</text>
        <text x="210" y="311" fill={muted} style={{ fontFamily: mono, fontSize: '5px',   letterSpacing: '0.10em' }}>DRAWING TITLE</text>
        <text x="210" y="334" fill={sec}   style={{ fontFamily: mono, fontSize: '5.5px', letterSpacing: '0.08em' }}>CABLE-STAYED BRIDGE: ELEVATION + PLAN</text>
        <text x="368" y="311" fill={muted} style={{ fontFamily: mono, fontSize: '5px',   letterSpacing: '0.10em' }}>DATE</text>
        <text x="368" y="334" fill={sec}   style={{ fontFamily: mono, fontSize: '5.5px', letterSpacing: '0.08em' }}>APR 2026</text>
        <text x="468" y="311" fill={muted} style={{ fontFamily: mono, fontSize: '5px',   letterSpacing: '0.10em' }}>REV</text>
        <text x="468" y="334" fill={acc}   style={{ fontFamily: mono, fontSize: '6.5px', letterSpacing: '0.08em' }}>A</text>
      </g>

      {/* ── CORNER REGISTRATION MARKS ── d=3.96s */}
      <g className={`cs-tfade ${d(22)}`}>
        {([[14, 14], [566, 14], [14, 344], [566, 344]] as [number, number][]).map(([cx, cy], i) => (
          <g key={i}>
            <line x1={cx - 7} y1={cy}     x2={cx + 7} y2={cy}     stroke={muted} strokeWidth="0.4" opacity="0.35" />
            <line x1={cx}     y1={cy - 7} x2={cx}     y2={cy + 7} stroke={muted} strokeWidth="0.4" opacity="0.35" />
          </g>
        ))}
      </g>

      {/* ── SCANNER LINE — sweeps top-to-bottom after main draw finishes ──
           Uses SVG <animate> for reliable cross-browser support.
           Translates the line from y=47 (top) → y=299 (bottom) = 252px travel. */}
      <line x1="14" y1="47" x2="566" y2="47"
        stroke={acc} strokeWidth="0.7" strokeDasharray="10 5" opacity="0">
        <animateTransform
          attributeName="transform"
          type="translate"
          from="0,0"
          to="0,252"
          dur="9s"
          begin="4.8s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0;0.40;0.32;0"
          keyTimes="0;0.05;0.90;1"
          dur="9s"
          begin="4.8s"
          repeatCount="indefinite"
        />
      </line>

      {/* ── CABLE GLOW PULSE — ethereal glow behind each stay cable, staggered ──
           Layered on top of the drawn cables as a soft highlight. */}
      {allCables.map(([x, y], i) => (
        <line
          key={`glow${i}`}
          x1={i < lCables.length ? TL[0] : TR[0]}
          y1={i < lCables.length ? TL[1] : TR[1]}
          x2={x}
          y2={y}
          stroke={acc}
          strokeWidth="4.0"
          opacity="0"
        >
          <animate
            attributeName="opacity"
            values="0;0.16;0"
            keyTimes="0;0.5;1"
            dur={`${2.6 + (i % 5) * 0.45}s`}
            begin={`${5.2 + i * 0.22}s`}
            repeatCount="indefinite"
          />
        </line>
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

      {/* Main hero — vertically and horizontally centred */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">

        {/* Schematic — aspect ratio matches viewBox 580:360 */}
        <div
          className="w-full max-w-[520px] mb-10"
          style={{ filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.08))' }}
        >
          <EngineeringSchematic className="w-full aspect-[580/360]" />
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
