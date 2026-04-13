import { Link } from 'react-router-dom';

/**
 * Scenic illustration of the Leonard P. Zakim Bunker Hill Memorial Bridge
 * spanning the Charles River, Boston. Diamond-profile cable-stayed towers,
 * city skyline backdrop, rippling water, and a car driving across.
 */
function BostonBridgeScene({ className }: { className?: string }) {
  const acc   = 'var(--accent)';
  const muted = 'var(--text-muted)';
  const sec   = 'var(--text-secondary)';
  const bdr   = 'var(--border-default)';
  const gold  = 'var(--gold)';
  const aLt   = 'var(--accent-light)';
  const mono  = 'var(--font-mono)';

  const towerTop = 42;
  const deckY    = 178;
  const waterY   = 215;

  const T1 = 265;
  const T2 = 535;

  const towers = [T1, T2].map(cx => ({
    topL:  [cx - 12, towerTop]    as [number, number],
    topR:  [cx + 12, towerTop]    as [number, number],
    deckL: [cx - 6,  deckY]       as [number, number],
    deckR: [cx + 6,  deckY]       as [number, number],
    baseL: [cx - 16, waterY + 6]  as [number, number],
    baseR: [cx + 16, waterY + 6]  as [number, number],
  }));

  const t1Left  = [100, 125, 150, 175, 200, 225, 250];
  const t1Right = [290, 320, 350, 380];
  const t2Left  = [420, 450, 480, 510];
  const t2Right = [550, 575, 600, 625, 650, 675, 700];

  const d = (n: number) => `bb-d${n}`;

  const delays = Array.from({ length: 20 }, (_, i) =>
    `.bb-d${i}{animation-delay:${(i * 0.2).toFixed(1)}s}`,
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
        <linearGradient id="bb-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={acc}  stopOpacity="0.14" />
          <stop offset="55%"  stopColor={aLt}  stopOpacity="0.06" />
          <stop offset="100%" stopColor={gold}  stopOpacity="0.04" />
        </linearGradient>

        <linearGradient id="bb-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={acc} stopOpacity="0.10" />
          <stop offset="100%" stopColor={acc} stopOpacity="0.03" />
        </linearGradient>

        <pattern id="bb-ripple" width="80" height="10" patternUnits="userSpaceOnUse">
          <path d="M0,5 Q20,2 40,5 Q60,8 80,5" stroke={acc} strokeWidth="0.3" fill="none" opacity="0.22" />
        </pattern>

        <style>{`
          @keyframes bbFadeIn  { from{opacity:0}                            to{opacity:1} }
          @keyframes bbDraw    { from{stroke-dashoffset:1200;opacity:0}     to{stroke-dashoffset:0;opacity:1} }
          @keyframes bbSlideUp { from{opacity:0;transform:translateY(6px)}  to{opacity:1;transform:translateY(0)} }
          @keyframes bbRipple  { 0%,100%{transform:translateX(0)} 50%{transform:translateX(8px)} }
          @keyframes bbTwinkle { 0%,100%{opacity:0.15} 50%{opacity:0.7} }

          .bb-fade  { opacity:0; animation:bbFadeIn  0.8s ease both }
          .bb-draw  { stroke-dasharray:1200; stroke-dashoffset:1200; opacity:0; animation:bbDraw 1.2s ease both }
          .bb-slide { opacity:0; animation:bbSlideUp 0.7s ease both }
          .bb-ripple-move { animation:bbRipple 8s ease-in-out infinite }
          .bb-twinkle     { animation:bbTwinkle 3s ease-in-out infinite }

          ${delays}

          @media(prefers-reduced-motion:reduce){
            .bb-fade,.bb-draw,.bb-slide{animation:none!important;opacity:1}
            .bb-draw{stroke-dasharray:none;stroke-dashoffset:0}
          }
        `}</style>
      </defs>

      {/* ── SKY ── */}
      <rect width="800" height="400" fill="url(#bb-sky)" />

      {/* ── STARS ── */}
      <g className={`bb-fade ${d(0)}`}>
        {([[100,22],[195,50],[320,16],[445,36],[565,20],[660,48],[755,28],[52,55],[490,10],[720,58]] as [number,number][]).map(
          ([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={0.7 + (i % 3) * 0.35}
              fill={acc} className="bb-twinkle"
              style={{ animationDelay: `${i * 0.55}s` }} />
          ),
        )}
      </g>

      {/* ── MOON ── */}
      <g className={`bb-fade ${d(0)}`}>
        <circle cx="680" cy="48" r="18" fill={aLt} opacity="0.12" />
        <circle cx="680" cy="48" r="11" fill={gold} opacity="0.06" />
        <circle cx="682" cy="46" r="7"  fill={gold} opacity="0.10" />
      </g>

      {/* ── SKYLINE — CHARLESTOWN (left) ── */}
      <g className={`bb-slide ${d(1)}`}>
        <path d={[
          `M 0,${waterY}`,
          'L 0,192 10,192 10,186 20,186 20,190',
          '28,190 28,180 35,180 35,184',
          '44,184 44,174 50,174 50,170 54,170 54,176',
          '64,176 64,172 70,172 70,180',
          '82,180 82,184 96,184 96,176 102,176 102,180',
          '110,180 110,167 114,162 118,167 118,180',
          '130,180 130,186 155,186 155,192 205,192',
          `205,${waterY} Z`,
        ].join(' ')}
          fill={muted} opacity="0.10" />
      </g>

      {/* ── SKYLINE — DOWNTOWN BOSTON (right) ── */}
      <g className={`bb-slide ${d(1)}`}>
        <path d={[
          `M 595,${waterY}`,
          'L 595,194 608,194 608,182 614,182 614,176 620,176',
          '620,170 626,170 626,162 630,157 634,162 634,170',
          '640,170 640,160 644,160 644,152 650,152 650,146',
          '654,143 658,146 658,152 664,152 664,160',
          '670,160 670,142 674,137 678,137 678,140',
          '682,140 682,150 688,150 688,157',
          '696,157 696,150 702,150 702,140',
          '706,132 710,132 710,144 716,144 716,157',
          '724,157 724,164 732,164 732,170 740,170 740,174',
          '750,174 750,180 758,180 758,184 768,184 768,188',
          '778,188 778,192 800,192',
          `800,${waterY} Z`,
        ].join(' ')}
          fill={muted} opacity="0.10" />

        {([[630,160],[636,164],[644,156],[650,150],[658,150],
          [670,148],[674,140],[678,144],[682,152],[696,154],
          [706,136],[710,148],[724,160],[732,166],[740,172],
          [634,168],[648,158],[656,148],[666,156],[688,154],
          [702,146],[714,152],[734,168]] as [number,number][]).map(([x, y], i) => (
          <rect key={i} x={x} y={y} width="2" height="1.5"
            fill={gold} opacity={0.10 + (i % 4) * 0.03} />
        ))}
      </g>

      {/* ── WATER ── */}
      <g className={`bb-fade ${d(2)}`}>
        <rect x="0" y={waterY} width="800" height={400 - waterY} fill="url(#bb-water)" />
        <line x1="0" y1={waterY} x2="800" y2={waterY}
          stroke={acc} strokeWidth="0.5" opacity="0.18" />
      </g>

      {/* ── WATER RIPPLES ── */}
      <g className={`bb-fade bb-ripple-move ${d(3)}`}>
        <rect x="-10" y={waterY + 6} width="820" height={400 - waterY - 6}
          fill="url(#bb-ripple)" opacity="0.55" />
      </g>

      {/* ── SOFT GLOW ON WATER (under tower piers) ── */}
      <g className={`bb-fade ${d(8)}`}>
        {[T1, T2].map((cx, i) => (
          <ellipse key={i} cx={cx} cy={waterY + 15} rx="20" ry="6"
            fill={acc} opacity="0.03" />
        ))}
      </g>

      {/* ── BRIDGE PIERS (in water) ── */}
      <g className={`bb-slide ${d(4)}`}>
        {towers.map((_t, i) => {
          const cx = i === 0 ? T1 : T2;
          return (
            <rect key={i} x={cx - 10} y={deckY + 1}
              width="20" height={waterY - deckY + 10}
              fill={bdr} stroke={acc} strokeWidth="0.5" opacity="0.30" rx="1" />
          );
        })}
      </g>

      {/* ── APPROACH RAMPS ── */}
      <g className={`bb-fade ${d(3)}`}>
        <path d={`M 0,${deckY + 16} L 80,${deckY} 80,${deckY + 6} 0,${deckY + 22} Z`}
          fill={bdr} opacity="0.22" />
        <line x1="0" y1={deckY + 16} x2="80" y2={deckY}
          stroke={acc} strokeWidth="1" opacity="0.45" />

        <path d={`M 720,${deckY} L 800,${deckY + 16} 800,${deckY + 22} 720,${deckY + 6} Z`}
          fill={bdr} opacity="0.22" />
        <line x1="720" y1={deckY} x2="800" y2={deckY + 16}
          stroke={acc} strokeWidth="1" opacity="0.45" />
      </g>

      {/* ── BRIDGE DECK ── */}
      <g className={`bb-fade ${d(4)}`}>
        <rect x="80" y={deckY} width="640" height="6"
          fill={bdr} stroke={acc} strokeWidth="0.5" opacity="0.40" rx="0.5" />
        <line x1="80" y1={deckY + 0.5} x2="720" y2={deckY + 0.5}
          stroke={gold} strokeWidth="1.2" opacity="0.45" />
        {Array.from({ length: 32 }, (_, i) => 80 + i * 20).filter(x => x < 710).map(x => (
          <line key={x} x1={x} y1={deckY + 3} x2={x + 12} y2={deckY + 3}
            stroke={gold} strokeWidth="0.4" opacity="0.28" />
        ))}
        <line x1="80" y1={deckY - 1.5} x2="720" y2={deckY - 1.5}
          stroke={acc} strokeWidth="0.3" opacity="0.20" />
        <line x1="80" y1={deckY + 7.5} x2="720" y2={deckY + 7.5}
          stroke={acc} strokeWidth="0.3" opacity="0.20" />
      </g>

      {/* ── LAMPPOSTS ── */}
      <g className={`bb-fade ${d(5)}`}>
        {[120, 180, 240, 330, 400, 470, 560, 620, 680].map(x => (
          <g key={x}>
            <line x1={x} y1={deckY - 1} x2={x} y2={deckY - 10}
              stroke={acc} strokeWidth="0.35" opacity="0.25" />
            <circle cx={x} cy={deckY - 11} r="1"
              fill={gold} opacity="0.20" />
          </g>
        ))}
      </g>

      {/* ── TOWER LEGS BELOW DECK (A-frame into piers) ── */}
      {towers.map((t, ti) => (
        <g key={`legs-${ti}`}>
          <line className={`bb-draw ${d(5)}`}
            x1={t.deckL[0]} y1={deckY} x2={t.baseL[0]} y2={t.baseL[1]}
            stroke={acc} strokeWidth="2.2" />
          <line className={`bb-draw ${d(5)}`}
            x1={t.deckR[0]} y1={deckY} x2={t.baseR[0]} y2={t.baseR[1]}
            stroke={acc} strokeWidth="2.2" />
        </g>
      ))}

      {/* ── TOWER COLUMNS ABOVE DECK ── */}
      {towers.map((t, ti) => (
        <g key={`cols-${ti}`}>
          <line className={`bb-draw ${d(6)}`}
            x1={t.deckL[0]} y1={deckY} x2={t.topL[0]} y2={towerTop}
            stroke={acc} strokeWidth="2.6" />
          <line className={`bb-draw ${d(6)}`}
            x1={t.deckR[0]} y1={deckY} x2={t.topR[0]} y2={towerTop}
            stroke={acc} strokeWidth="2.6" />
        </g>
      ))}

      {/* ── TOWER CROSSBARS + CAPS ── */}
      <g className={`bb-fade ${d(7)}`}>
        {towers.map((t, ti) => {
          const cx = ti === 0 ? T1 : T2;
          return (
            <g key={ti}>
              <line x1={t.topL[0] - 2} y1={towerTop} x2={t.topR[0] + 2} y2={towerTop}
                stroke={acc} strokeWidth="1.2" opacity="0.85" />
              <line x1={cx - 9} y1={110} x2={cx + 9} y2={110}
                stroke={acc} strokeWidth="0.65" opacity="0.45" />
              <line x1={cx - 7} y1={145} x2={cx + 7} y2={145}
                stroke={acc} strokeWidth="0.5" opacity="0.35" />
              <rect x={t.topL[0] - 3} y={towerTop - 3} width="6" height="4"
                fill={aLt} stroke={acc} strokeWidth="0.6" opacity="0.80" rx="0.5" />
              <rect x={t.topR[0] - 3} y={towerTop - 3} width="6" height="4"
                fill={aLt} stroke={acc} strokeWidth="0.6" opacity="0.80" rx="0.5" />
              <circle cx={cx} cy={towerTop - 4} r="1.2" fill={gold} opacity="0.5">
                <animate attributeName="opacity"
                  values="0.25;0.75;0.25" dur="2s" repeatCount="indefinite" />
              </circle>
            </g>
          );
        })}
      </g>

      {/* ── STAY CABLES — Tower 1 left fan ── */}
      {t1Left.map((x, i) => (
        <line key={`t1l${i}`} className={`bb-draw ${d(8 + Math.floor(i / 2))}`}
          x1={towers[0].topL[0]} y1={towerTop + 3} x2={x} y2={deckY}
          stroke={acc} strokeWidth={i === 0 ? '0.65' : '0.32'} />
      ))}

      {/* ── STAY CABLES — Tower 1 right fan ── */}
      {t1Right.map((x, i) => (
        <line key={`t1r${i}`} className={`bb-draw ${d(8 + Math.floor(i / 2))}`}
          x1={towers[0].topR[0]} y1={towerTop + 3} x2={x} y2={deckY}
          stroke={acc} strokeWidth="0.32" />
      ))}

      {/* ── STAY CABLES — Tower 2 left fan ── */}
      {t2Left.map((x, i) => (
        <line key={`t2l${i}`} className={`bb-draw ${d(8 + Math.floor(i / 2))}`}
          x1={towers[1].topL[0]} y1={towerTop + 3} x2={x} y2={deckY}
          stroke={acc} strokeWidth="0.32" />
      ))}

      {/* ── STAY CABLES — Tower 2 right fan ── */}
      {t2Right.map((x, i) => (
        <line key={`t2r${i}`} className={`bb-draw ${d(8 + Math.floor(i / 2))}`}
          x1={towers[1].topR[0]} y1={towerTop + 3} x2={x} y2={deckY}
          stroke={acc} strokeWidth={i === t2Right.length - 1 ? '0.65' : '0.32'} />
      ))}

      {/* ── CABLE GLOW PULSES ── */}
      {[...t1Left, ...t2Right].map((x, i) => {
        const isLeft = i < t1Left.length;
        const anchor = isLeft ? towers[0].topL : towers[1].topR;
        return (
          <line key={`glow${i}`}
            x1={anchor[0]} y1={towerTop + 3} x2={x} y2={deckY}
            stroke={acc} strokeWidth="3" opacity="0">
            <animate attributeName="opacity"
              values="0;0.08;0"
              dur={`${2.4 + (i % 4) * 0.35}s`}
              begin={`${5.0 + i * 0.22}s`}
              repeatCount="indefinite" />
          </line>
        );
      })}

      {/* ── ANIMATED CAR (left → right) ── */}
      <g opacity="0">
        <animate attributeName="opacity"
          to="1" dur="0.001s" begin="3.5s" fill="freeze" />
        <animateMotion
          dur="9s"
          repeatCount="indefinite"
          begin="3.5s"
          calcMode="linear"
          path="M -40,194 L 80,178 L 720,178 L 840,194"
        />

        {/* headlight beam (pointing right) */}
        <polygon points="13,-6 13,-4 48,-8 48,-2"
          fill={gold} opacity="0.03" />
        {/* body */}
        <rect x="-12" y="-8" width="24" height="5" rx="1.5"
          fill={gold} opacity="0.70" />
        {/* cabin — shifted left so hood extends to the right (front) */}
        <path d="M-10,-8 L-7,-12.5 L3,-12.5 L6,-8"
          fill={gold} opacity="0.55" stroke={acc} strokeWidth="0.3" />
        {/* windshield (right slope) */}
        <line x1="3" y1="-12" x2="6" y2="-8"
          stroke={acc} strokeWidth="0.4" opacity="0.45" />
        {/* rear window (left slope) */}
        <line x1="-7" y1="-12" x2="-10" y2="-8"
          stroke={acc} strokeWidth="0.3" opacity="0.35" />
        {/* wheels */}
        <circle cx="-7" cy="-2.5" r="2" fill={sec} />
        <circle cx="7"  cy="-2.5" r="2" fill={sec} />
        <circle cx="-7" cy="-2.5" r="0.8" fill={muted} opacity="0.4" />
        <circle cx="7"  cy="-2.5" r="0.8" fill={muted} opacity="0.4" />
        {/* headlight (right/front) */}
        <rect x="11.5" y="-7.2" width="1.5" height="2" rx="0.5"
          fill={gold} opacity="0.85" />
        {/* taillight (left/rear) */}
        <rect x="-13" y="-7" width="1.5" height="1.5" rx="0.5"
          fill={acc} opacity="0.40" />
      </g>

      {/* ── SECOND CAR (right → left, facing left) ── */}
      <g opacity="0">
        <animate attributeName="opacity"
          to="1" dur="0.001s" begin="7s" fill="freeze" />
        <animateMotion
          dur="10s"
          repeatCount="indefinite"
          begin="7s"
          calcMode="linear"
          path="M 840,194 L 720,178 L 80,178 L -40,194"
        />

        {/* headlight beam (pointing left) */}
        <polygon points="-13,-6 -13,-4 -48,-8 -48,-2"
          fill={acc} opacity="0.02" />
        {/* body */}
        <rect x="-10" y="-7.5" width="20" height="4.5" rx="1.2"
          fill={acc} opacity="0.50" />
        {/* cabin — shifted right so hood extends to the left (front) */}
        <path d="M-5,-7.5 L-2,-11 L6,-11 L9,-7.5"
          fill={acc} opacity="0.40" stroke={acc} strokeWidth="0.25" />
        {/* windshield (left slope) */}
        <line x1="-2" y1="-10.5" x2="-5" y2="-7.5"
          stroke={acc} strokeWidth="0.3" opacity="0.4" />
        {/* rear window (right slope) */}
        <line x1="6" y1="-10.5" x2="9" y2="-7.5"
          stroke={acc} strokeWidth="0.25" opacity="0.3" />
        {/* wheels */}
        <circle cx="-6" cy="-2.5" r="1.8" fill={sec} />
        <circle cx="6"  cy="-2.5" r="1.8" fill={sec} />
        {/* headlight (left/front) */}
        <rect x="-11.5" y="-6.5" width="1.2" height="1.5" rx="0.4"
          fill={gold} opacity="0.70" />
        {/* taillight (right/rear) */}
        <rect x="10" y="-6.5" width="1.2" height="1.3" rx="0.4"
          fill={acc} opacity="0.35" />
      </g>

      {/* ── BRIDGE LABEL ── */}
      <g className={`bb-fade ${d(14)}`}>
        <text x="400" y={waterY + 50} textAnchor="middle" fill={muted}
          style={{ fontFamily: mono, fontSize: '5.5px', letterSpacing: '0.22em',
                   textTransform: 'uppercase' as const }}>
          Leonard P. Zakim Bunker Hill Memorial Bridge
        </text>
        <text x="400" y={waterY + 63} textAnchor="middle" fill={acc}
          style={{ fontFamily: mono, fontSize: '4.5px', letterSpacing: '0.14em' }}>
          BOSTON, MASSACHUSETTS
        </text>
      </g>

      {/* ── WATER-LINE SHIMMER ── */}
      <line x1="0" y1={waterY} x2="800" y2={waterY}
        stroke={gold} strokeWidth="0.6" opacity="0">
        <animate attributeName="opacity"
          values="0;0.08;0" dur="4s" begin="2s" repeatCount="indefinite" />
        <animateTransform attributeName="transform"
          type="translate" from="0,0" to="0,0.5"
          dur="4s" begin="2s" repeatCount="indefinite" />
      </line>

      {/* ── SUBTLE BORDER ── */}
      <rect x="5" y="5" width="790" height="390"
        stroke={muted} strokeWidth="0.35" opacity="0.12" rx="2"
        className={`bb-fade ${d(0)}`} />
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

        {/* Bridge scene — wider panoramic aspect ratio */}
        <div
          className="w-full max-w-[640px] mb-10"
          style={{ filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.08))' }}
        >
          <BostonBridgeScene className="w-full aspect-[2/1]" />
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
