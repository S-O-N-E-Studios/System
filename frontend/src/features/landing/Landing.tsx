import { Link } from 'react-router-dom';

/**
 * Panoramic construction site with tower cranes, a building rising, excavator,
 * rolling hills, and an African sunset — representing engineering delivery.
 */
function ConstructionScene({ className }: { className?: string }) {
  const acc  = 'var(--accent)';
  const muted = 'var(--text-muted)';
  const sec  = 'var(--text-secondary)';
  const bdr  = 'var(--border-default)';
  const gold = 'var(--gold)';
  const aLt  = 'var(--accent-light)';
  const mono = 'var(--font-mono)';

  const groundY = 280;
  const horizonY = 260;

  const d = (n: number) => `cs-d${n}`;
  const delays = Array.from({ length: 20 }, (_, i) =>
    `.cs-d${i}{animation-delay:${(i * 0.18).toFixed(2)}s}`,
  ).join('\n');

  return (
    <svg
      className={className}
      viewBox="0 0 800 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="cs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={acc}  stopOpacity="0.18" />
          <stop offset="40%"  stopColor={gold} stopOpacity="0.12" />
          <stop offset="70%"  stopColor={aLt}  stopOpacity="0.06" />
          <stop offset="100%" stopColor={gold} stopOpacity="0.03" />
        </linearGradient>

        <linearGradient id="cs-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={acc}  stopOpacity="0.06" />
          <stop offset="100%" stopColor={acc}  stopOpacity="0.02" />
        </linearGradient>

        <linearGradient id="cs-sunset" x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0%"   stopColor={gold} stopOpacity="0.15" />
          <stop offset="100%" stopColor={acc}  stopOpacity="0.04" />
        </linearGradient>

        <style>{`
          @keyframes csFadeIn  { from{opacity:0}                           to{opacity:1} }
          @keyframes csDraw    { from{stroke-dashoffset:800;opacity:0}    to{stroke-dashoffset:0;opacity:1} }
          @keyframes csSlideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
          @keyframes csPulse   { 0%,100%{opacity:0.3} 50%{opacity:0.8} }
          @keyframes csSwing   { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(2deg)} }

          @keyframes csSunGlow   { 0%,100%{r:30;opacity:0.06} 50%{r:36;opacity:0.10} }
          @keyframes csDrumSpin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
          @keyframes csCloudDrift{ from{transform:translateX(0)} to{transform:translateX(820px)} }
          @keyframes csExcavate  { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-4deg)} }
          @keyframes csDustRise  { 0%{opacity:0.4;transform:translateY(0) scale(1)} 100%{opacity:0;transform:translateY(-18px) scale(1.6)} }
          @keyframes csFlicker   { 0%,40%,100%{opacity:0.04} 45%,55%{opacity:0.18} }
          @keyframes csSpark     { 0%,80%,100%{opacity:0} 85%{opacity:0.7} 90%{opacity:0} 95%{opacity:0.5} }

          .cs-fade  { opacity:0; animation:csFadeIn  0.8s ease both }
          .cs-draw  { stroke-dasharray:800; stroke-dashoffset:800; opacity:0; animation:csDraw 1.4s ease both }
          .cs-slide { opacity:0; animation:csSlideUp 0.7s ease both }
          .cs-pulse { animation:csPulse 3s ease-in-out infinite }
          .cs-swing { transform-origin:50% 0%; animation:csSwing 4s ease-in-out infinite }

          .cs-sun-glow  { animation:csSunGlow 6s ease-in-out infinite }
          .cs-drum-spin { animation:csDrumSpin 5s linear infinite }
          .cs-cloud     { animation:csCloudDrift 50s linear infinite }
          .cs-cloud-2   { animation:csCloudDrift 70s linear infinite }
          .cs-excavate  { animation:csExcavate 3.5s ease-in-out infinite }
          .cs-dust      { animation:csDustRise 2.5s ease-out infinite }
          .cs-flicker   { animation:csFlicker 4s ease-in-out infinite }
          .cs-spark     { animation:csSpark 3s ease infinite }

          ${delays}

          @media(prefers-reduced-motion:reduce){
            .cs-fade,.cs-draw,.cs-slide{animation:none!important;opacity:1}
            .cs-draw{stroke-dasharray:none;stroke-dashoffset:0}
            .cs-sun-glow,.cs-drum-spin,.cs-cloud,.cs-cloud-2,.cs-excavate,.cs-dust,.cs-flicker,.cs-spark,.cs-pulse,.cs-swing{animation:none!important}
          }
        `}</style>
      </defs>

      {/* ── SKY + SUNSET GLOW ── */}
      <rect width="800" height="400" fill="url(#cs-sky)" />
      <ellipse cx="650" cy="80" rx="180" ry="100" fill="url(#cs-sunset)" className={`cs-fade ${d(0)}`} />

      {/* ── SUN (large, low on horizon, pulsing glow) ── */}
      <g className={`cs-fade ${d(0)}`}>
        <circle cx="650" cy="95" r="30" fill={gold} opacity="0.06" className="cs-sun-glow" />
        <circle cx="650" cy="95" r="18" fill={gold} opacity="0.12" />
        <circle cx="650" cy="95" r="10" fill={gold} opacity="0.18" />
      </g>

      {/* ── DRIFTING CLOUDS ── */}
      <g className={`cs-fade ${d(1)}`} opacity="0.08">
        <g className="cs-cloud" style={{ animationDelay: '-5s' }}>
          <ellipse cx="-60" cy="55" rx="40" ry="8" fill={bdr} />
          <ellipse cx="-45" cy="50" rx="25" ry="6" fill={bdr} />
        </g>
        <g className="cs-cloud-2" style={{ animationDelay: '-25s' }}>
          <ellipse cx="-120" cy="90" rx="35" ry="7" fill={bdr} />
          <ellipse cx="-105" cy="85" rx="22" ry="5" fill={bdr} />
        </g>
        <g className="cs-cloud" style={{ animationDelay: '-30s' }}>
          <ellipse cx="-200" cy="40" rx="30" ry="6" fill={bdr} />
        </g>
      </g>

      {/* ── ROLLING HILLS ── */}
      <g className={`cs-slide ${d(1)}`}>
        <path d={`M 0,${horizonY} Q 100,220 200,${horizonY - 15} Q 320,240 440,${horizonY - 5} Q 560,225 680,${horizonY - 20} Q 750,245 800,${horizonY} V 400 H 0 Z`}
          fill={muted} opacity="0.06" />
        <path d={`M 0,${horizonY + 8} Q 150,${horizonY - 5} 300,${horizonY + 10} Q 450,${horizonY - 2} 600,${horizonY + 12} Q 700,${horizonY + 2} 800,${horizonY + 10} V 400 H 0 Z`}
          fill={muted} opacity="0.04" />
      </g>

      {/* ── GROUND PLANE ── */}
      <g className={`cs-fade ${d(2)}`}>
        <rect x="0" y={groundY} width="800" height={400 - groundY} fill="url(#cs-ground)" />
        <line x1="0" y1={groundY} x2="800" y2={groundY} stroke={acc} strokeWidth="0.5" opacity="0.12" />
      </g>

      {/* ── DISTANT COMPLETED BUILDINGS (background skyline) ── */}
      <g className={`cs-slide ${d(2)}`}>
        {[[80, 190, 30, 70], [130, 200, 22, 60], [620, 195, 28, 65], [680, 205, 20, 55], [720, 210, 24, 50]] .map(([x, y, w, h], i) => (
          <g key={`bldg-${i}`}>
            <rect x={x} y={y} width={w} height={h} fill={bdr} opacity="0.12" />
            {Array.from({ length: Math.floor(h / 8) }, (_, j) =>
              Array.from({ length: Math.floor(w / 7) }, (_, k) => (
                <rect key={`w${j}-${k}`} x={x + 2 + k * 7} y={y + 3 + j * 8} width="3" height="3"
                  fill={gold} opacity={0.06 + (j + k) % 3 * 0.02} />
              ))
            )}
          </g>
        ))}
      </g>

      {/* ── TOWER CRANE 1 (main, left-center) ── */}
      <g className={`cs-draw ${d(3)}`}>
        <line x1="280" y1={groundY} x2="280" y2="48" stroke={acc} strokeWidth="2.5" />
        <line x1="276" y1={groundY} x2="276" y2="55" stroke={acc} strokeWidth="0.8" opacity="0.5" />
        <line x1="284" y1={groundY} x2="284" y2="55" stroke={acc} strokeWidth="0.8" opacity="0.5" />
        {[90, 130, 170, 210, 250].map(y => (
          <g key={y}>
            <line x1="276" y1={y} x2="284" y2={y} stroke={acc} strokeWidth="0.4" opacity="0.35" />
            <line x1="276" y1={y} x2="284" y2={y - 8} stroke={acc} strokeWidth="0.3" opacity="0.2" />
          </g>
        ))}
      </g>
      {/* Crane jib */}
      <g className={`cs-fade ${d(5)}`}>
        <line x1="200" y1="50" x2="380" y2="50" stroke={acc} strokeWidth="1.5" />
        <line x1="280" y1="40" x2="200" y2="50" stroke={acc} strokeWidth="0.6" opacity="0.6" />
        <line x1="280" y1="40" x2="380" y2="50" stroke={acc} strokeWidth="0.6" opacity="0.6" />
        <line x1="280" y1="40" x2="340" y2="50" stroke={acc} strokeWidth="0.4" opacity="0.4" />
        <rect x="277" y="36" width="6" height="6" fill={aLt} stroke={acc} strokeWidth="0.5" opacity="0.7" />
        {/* Counter-jib weight */}
        <rect x="200" y="46" width="10" height="8" fill={bdr} opacity="0.25" />
        {/* Hook cable + block (swinging) */}
        <g className="cs-swing" style={{ transformOrigin: '340px 50px' }}>
          <line x1="340" y1="50" x2="340" y2="120" stroke={acc} strokeWidth="0.5" opacity="0.4" />
          <rect x="336" y="118" width="8" height="5" fill={acc} opacity="0.35" />
        </g>
        {/* Crane light */}
        <circle cx="280" cy="38" r="1.5" fill={gold} opacity="0.5" className="cs-pulse" />
      </g>

      {/* ── TOWER CRANE 2 (shorter, right) ── */}
      <g className={`cs-draw ${d(4)}`}>
        <line x1="520" y1={groundY} x2="520" y2="80" stroke={acc} strokeWidth="2" />
        <line x1="517" y1={groundY} x2="517" y2="85" stroke={acc} strokeWidth="0.6" opacity="0.4" />
        <line x1="523" y1={groundY} x2="523" y2="85" stroke={acc} strokeWidth="0.6" opacity="0.4" />
        {[120, 160, 200, 240].map(y => (
          <line key={y} x1="517" y1={y} x2="523" y2={y} stroke={acc} strokeWidth="0.35" opacity="0.3" />
        ))}
      </g>
      <g className={`cs-fade ${d(6)}`}>
        <line x1="460" y1="82" x2="580" y2="82" stroke={acc} strokeWidth="1.2" />
        <line x1="520" y1="74" x2="460" y2="82" stroke={acc} strokeWidth="0.5" opacity="0.5" />
        <line x1="520" y1="74" x2="580" y2="82" stroke={acc} strokeWidth="0.5" opacity="0.5" />
        <rect x="517" y="70" width="6" height="6" fill={aLt} stroke={acc} strokeWidth="0.4" opacity="0.6" />
        <g className="cs-swing" style={{ transformOrigin: '555px 82px' }}>
          <line x1="555" y1="82" x2="555" y2="140" stroke={acc} strokeWidth="0.4" opacity="0.35" />
          <rect x="551" y="138" width="8" height="4" fill={acc} opacity="0.3" />
        </g>
        <circle cx="520" cy="72" r="1.2" fill={gold} opacity="0.4" className="cs-pulse" style={{ animationDelay: '1.5s' }} />
      </g>

      {/* ── BUILDING UNDER CONSTRUCTION (center) ── */}
      <g className={`cs-slide ${d(4)}`}>
        {/* Main structure */}
        <rect x="300" y="130" width="80" height={groundY - 130} fill={bdr} opacity="0.18" stroke={acc} strokeWidth="0.5" />
        {/* Floors */}
        {[145, 165, 185, 205, 225, 245, 265].map(y => (
          <line key={y} x1="300" y1={y} x2="380" y2={y} stroke={acc} strokeWidth="0.6" opacity="0.25" />
        ))}
        {/* Window grid */}
        {[145, 165, 185, 205, 225].map(y =>
          [308, 322, 336, 350, 364].map(x => (
            <rect key={`${x}-${y}`} x={x} y={y + 3} width="6" height="10" fill={gold} opacity="0.05" stroke={acc} strokeWidth="0.2" />
          ))
        )}
        {/* Scaffolding on right side */}
        <g opacity="0.30">
          <line x1="380" y1="130" x2="380" y2={groundY} stroke={acc} strokeWidth="0.8" />
          <line x1="395" y1="145" x2="395" y2={groundY} stroke={acc} strokeWidth="0.8" />
          {[145, 165, 185, 205, 225, 245, 265].map(y => (
            <g key={y}>
              <line x1="380" y1={y} x2="395" y2={y} stroke={acc} strokeWidth="0.5" />
              <line x1="380" y1={y} x2="395" y2={y + 20} stroke={acc} strokeWidth="0.25" />
            </g>
          ))}
        </g>
        {/* Top unfinished floors (exposed rebar) */}
        <rect x="300" y="125" width="80" height="8" fill={bdr} opacity="0.10" stroke={acc} strokeWidth="0.3" strokeDasharray="2,2" />
        {[310, 330, 350, 370].map(x => (
          <line key={x} x1={x} y1="125" x2={x} y2="118" stroke={acc} strokeWidth="0.4" opacity="0.3" />
        ))}
      </g>

      {/* ── SMALLER BUILDING (left of main) ── */}
      <g className={`cs-slide ${d(5)}`}>
        <rect x="210" y="190" width="55" height={groundY - 190} fill={bdr} opacity="0.14" stroke={acc} strokeWidth="0.4" />
        {[205, 220, 235, 250, 265].map(y => (
          <line key={y} x1="210" y1={y} x2="265" y2={y} stroke={acc} strokeWidth="0.4" opacity="0.2" />
        ))}
        {[205, 220, 235, 250].map(y =>
          [216, 228, 240, 252].map(x => (
            <rect key={`s${x}-${y}`} x={x} y={y + 2} width="5" height="9" fill={gold} opacity="0.04" />
          ))
        )}
      </g>

      {/* ── EXCAVATOR (foreground left, animated arm) ── */}
      <g className={`cs-slide ${d(7)}`}>
        {/* Tracks */}
        <rect x="80" y={groundY - 4} width="42" height="8" rx="3" fill={muted} opacity="0.25" />
        <rect x="82" y={groundY - 2} width="38" height="4" rx="2" fill={bdr} opacity="0.15" />
        {/* Cab */}
        <rect x="88" y={groundY - 18} width="28" height="14" fill={acc} opacity="0.30" />
        <rect x="105" y={groundY - 16} width="8" height="7" fill={gold} opacity="0.08" />
        {/* Boom + arm (pivots at cab joint) */}
        <g className="cs-excavate" style={{ transformOrigin: '116px 264px' }}>
          <line x1="116" y1={groundY - 16} x2="160" y2={groundY - 50} stroke={acc} strokeWidth="1.8" opacity="0.5" />
          <line x1="160" y1={groundY - 50} x2="175" y2={groundY - 30} stroke={acc} strokeWidth="1.2" opacity="0.4" />
          {/* Bucket */}
          <path d="M170,250 L180,250 L182,260 L168,260 Z" fill={acc} opacity="0.35" />
          {/* Hydraulic cylinder */}
          <line x1="100" y1={groundY - 14} x2="135" y2={groundY - 38} stroke={gold} strokeWidth="0.6" opacity="0.3" />
        </g>
        {/* Dust from digging */}
        <circle cx="175" cy={groundY - 2} r="3" fill={bdr} opacity="0.15" className="cs-dust" style={{ animationDelay: '0s' }} />
        <circle cx="182" cy={groundY - 4} r="2" fill={bdr} opacity="0.10" className="cs-dust" style={{ animationDelay: '0.8s' }} />
        <circle cx="168" cy={groundY}     r="2.5" fill={bdr} opacity="0.12" className="cs-dust" style={{ animationDelay: '1.6s' }} />
      </g>

      {/* ── CONCRETE MIXER TRUCK (right foreground, spinning drum) ── */}
      <g className={`cs-slide ${d(8)}`}>
        {/* Truck body */}
        <rect x="560" y={groundY - 14} width="48" height="14" fill={acc} opacity="0.22" />
        {/* Cab */}
        <rect x="608" y={groundY - 16} width="18" height="16" fill={acc} opacity="0.28" />
        <rect x="614" y={groundY - 14} width="8" height="7" fill={gold} opacity="0.07" />
        {/* Drum (static shell) */}
        <ellipse cx="584" cy={groundY - 16} rx="20" ry="11" fill={bdr} opacity="0.15" stroke={acc} strokeWidth="0.6" />
        {/* Drum spiral stripes (spinning) */}
        <g className="cs-drum-spin" style={{ transformOrigin: '584px 264px' }}>
          <line x1="570" y1={groundY - 20} x2="598" y2={groundY - 12} stroke={acc} strokeWidth="0.4" opacity="0.25" />
          <line x1="570" y1={groundY - 14} x2="598" y2={groundY - 22} stroke={acc} strokeWidth="0.4" opacity="0.25" />
          <line x1="574" y1={groundY - 22} x2="594" y2={groundY - 10} stroke={acc} strokeWidth="0.3" opacity="0.15" />
        </g>
        {/* Wheels */}
        <circle cx="572" cy={groundY} r="4" fill={sec} opacity="0.4" />
        <circle cx="600" cy={groundY} r="4" fill={sec} opacity="0.4" />
        <circle cx="618" cy={groundY} r="4" fill={sec} opacity="0.4" />
      </g>

      {/* ── CONSTRUCTION FENCE (foreground) ── */}
      <g className={`cs-fade ${d(6)}`}>
        {Array.from({ length: 20 }, (_, i) => 20 + i * 38).map(x => (
          <line key={x} x1={x} y1={groundY + 2} x2={x} y2={groundY + 16} stroke={acc} strokeWidth="0.4" opacity="0.12" />
        ))}
        <line x1="20" y1={groundY + 6} x2="780" y2={groundY + 6} stroke={acc} strokeWidth="0.3" opacity="0.10" />
        <line x1="20" y1={groundY + 12} x2="780" y2={groundY + 12} stroke={acc} strokeWidth="0.3" opacity="0.10" />
      </g>

      {/* ── MATERIAL STACKS (foreground detail) ── */}
      <g className={`cs-slide ${d(9)}`}>
        {/* Steel beams */}
        {[430, 432, 434].map(y => (
          <rect key={y} x="420" y={y + groundY - 440} width="30" height="1.5" fill={acc} opacity="0.2" />
        ))}
        {/* Pipe stack */}
        {[[470, groundY - 6], [474, groundY - 6], [472, groundY - 10]] .map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill={bdr} opacity="0.12" stroke={acc} strokeWidth="0.3" />
        ))}
      </g>

      {/* ── WELDING SPARKS on building ── */}
      <g className={`cs-fade ${d(10)}`}>
        <circle cx="350" cy="145" r="2" fill={gold} className="cs-spark" style={{ animationDelay: '0s' }} />
        <circle cx="352" cy="143" r="1" fill={gold} className="cs-spark" style={{ animationDelay: '0.3s' }} />
        <circle cx="348" cy="147" r="1.2" fill={gold} className="cs-spark" style={{ animationDelay: '0.7s' }} />
        <circle cx="354" cy="146" r="0.8" fill={gold} className="cs-spark" style={{ animationDelay: '1.1s' }} />
      </g>

      {/* ── FLICKERING WINDOWS (distant buildings come alive) ── */}
      <g className={`cs-fade ${d(3)}`}>
        {[
          [84, 205, 0], [84, 213, 1.2], [88, 221, 2.5],
          [134, 213, 0.6], [134, 221, 1.8], [138, 229, 3.2],
          [624, 208, 0.4], [628, 216, 1.5], [624, 224, 2.8],
          [684, 218, 0.9], [688, 226, 2.1], [684, 234, 3.5],
        ].map(([x, y, delay], i) => (
          <rect key={`fl-${i}`} x={x} y={y} width="3" height="3"
            fill={gold} opacity="0.04"
            className="cs-flicker"
            style={{ animationDelay: `${delay}s`, animationDuration: `${3 + (i % 3)}s` }} />
        ))}
      </g>

      {/* ── SAFETY CONES ── */}
      <g className={`cs-fade ${d(10)}`}>
        {[155, 410, 540].map(x => (
          <g key={x}>
            <polygon points={`${x},${groundY} ${x-2.5},${groundY} ${x-1.2},${groundY - 6} ${x + 1.2},${groundY - 6}`}
              fill={acc} opacity="0.35" />
            <line x1={x - 1} y1={groundY - 3} x2={x + 1} y2={groundY - 3} stroke={gold} strokeWidth="0.6" opacity="0.4" />
          </g>
        ))}
      </g>

      {/* ── SCENE LABEL ── */}
      <g className={`cs-fade ${d(14)}`}>
        <text x="400" y={groundY + 40} textAnchor="middle" fill={muted}
          style={{ fontFamily: mono, fontSize: '5px', letterSpacing: '0.22em',
                   textTransform: 'uppercase' as const }}>
          Engineering Project Management Platform
        </text>
        <text x="400" y={groundY + 52} textAnchor="middle" fill={acc}
          style={{ fontFamily: mono, fontSize: '4px', letterSpacing: '0.16em' }}>
          PLANNING · DESIGN · CONSTRUCTION · DELIVERY
        </text>
      </g>

      {/* ── SUBTLE BORDER ── */}
      <rect x="5" y="5" width="790" height="390"
        stroke={muted} strokeWidth="0.35" opacity="0.12" rx="2"
        className={`cs-fade ${d(0)}`} />
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
          v7.0 · MVP
        </span>
      </div>

      {/* Main hero — vertically and horizontally centred */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">

        {/* Bridge scene — wider panoramic aspect ratio */}
        <div
          className="w-full max-w-[640px] mb-10"
          style={{ filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.08))' }}
        >
          <ConstructionScene className="w-full aspect-[2/1]" />
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
            'Multi-Tenant SaaS',
            '11-Stage Lifecycle',
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

      <footer className="relative z-10 shrink-0 py-4 text-center">
        <p
          className="text-[var(--text-muted)] opacity-60"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.14em' }}
        >
          © {new Date().getFullYear()} PROJECT 360 · ENGINEERING · DELIVERY · CONTROL
        </p>
      </footer>
    </div>
  );
}
