/**
 * Illustrated people used across banners and the hero. Pure SVG: no network, never broken.
 * Each <Person> is drawn in a 200×260 box; position it with x/y/scale inside a parent <svg>.
 */

const SKIN = { light: '#f1c7a5', medium: '#d9a37e', tan: '#c68863', deep: '#8d5a3b' };

function Hair({ style, color }) {
  if (style === 'long')
    return <path d="M58 88 C50 32 150 32 142 88 L150 160 C130 146 70 146 50 160Z" fill={color} />;
  if (style === 'bun') return <circle cx="100" cy="38" r="18" fill={color} />;
  return null;
}

function Fringe({ style, color }) {
  if (style === 'bald') return null;
  if (style === 'short')
    return <path d="M64 84 C58 38 142 36 136 84 C132 62 118 52 100 52 C82 52 68 62 64 84Z" fill={color} />;
  return <path d="M64 80 C66 42 134 40 136 80 C124 60 104 56 92 58 C80 60 70 68 64 80Z" fill={color} />;
}

export function Person({
  x = 0,
  y = 0,
  scale = 1,
  skin = 'tan',
  hair = '#1f1a17',
  hairStyle = 'short',
  top = '#14806a',
  coat = false,
  stethoscope = false,
  holding = null,
  glasses = false,
  beard = false,
  glove = '#8b5cf6',
}) {
  const s = SKIN[skin] || skin;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <Hair style={hairStyle} color={hair} />
      {/* torso */}
      <path d="M26 262 C26 178 58 136 100 132 C142 136 174 178 174 262Z" fill={coat ? '#ffffff' : top} stroke={coat ? '#e2e8f0' : 'none'} strokeWidth="2" />
      {coat && (
        <>
          <path d="M84 134 L100 186 L116 134Z" fill={top} />
          <path d="M84 134 L96 200 L72 150Z M116 134 L104 200 L128 150Z" fill="#f1f5f9" />
          <rect x="122" y="196" width="26" height="6" rx="3" fill="#cbd5e1" />
        </>
      )}
      {!coat && <path d="M86 134 L100 160 L114 134Z" fill={s} />}
      {/* neck + head */}
      <rect x="88" y="104" width="24" height="34" rx="10" fill={s} />
      <ellipse cx="100" cy="84" rx="36" ry="40" fill={s} />
      <ellipse cx="64" cy="88" rx="6" ry="9" fill={s} />
      <ellipse cx="136" cy="88" rx="6" ry="9" fill={s} />
      <Fringe style={hairStyle} color={hair} />
      {beard && <path d="M66 92 C68 130 132 130 134 92 C124 116 76 116 66 92Z" fill={hair} />}
      {/* face */}
      <path d="M80 74 Q87 70 94 74 M106 74 Q113 70 120 74" stroke="#2b2420" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="87" cy="84" r="3.2" fill="#2b2420" />
      <circle cx="113" cy="84" r="3.2" fill="#2b2420" />
      <circle cx="80" cy="97" r="6" fill="#f87171" opacity=".18" />
      <circle cx="120" cy="97" r="6" fill="#f87171" opacity=".18" />
      <path d="M90 101 Q100 110 110 101" stroke="#7c2d12" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      {glasses && (
        <g stroke="#1f2937" strokeWidth="2.2" fill="none">
          <circle cx="87" cy="84" r="9.5" />
          <circle cx="113" cy="84" r="9.5" />
          <path d="M96.5 84 H103.5" />
        </g>
      )}
      {stethoscope && (
        <g>
          <path d="M80 136 C76 178 90 200 100 204 C110 200 124 178 120 136" stroke="#334155" strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="100" cy="210" r="7" fill="#94a3b8" stroke="#334155" strokeWidth="3" />
        </g>
      )}
      {/* arm + prop */}
      {holding === 'tube' && (
        <g>
          <path d="M160 196 C150 214 136 214 128 200" stroke={coat ? '#ffffff' : top} strokeWidth="22" strokeLinecap="round" fill="none" />
          <g transform="rotate(-14 136 168)">
            <rect x="128" y="138" width="16" height="52" rx="8" fill="#fff" stroke="#13443c" strokeWidth="3" />
            <rect x="131" y="160" width="10" height="27" rx="5" fill="#f95d35" />
            <rect x="125" y="132" width="22" height="9" rx="3" fill="#13443c" />
          </g>
          <circle cx="128" cy="196" r="11" fill={glove} />
        </g>
      )}
      {holding === 'phone' && (
        <g>
          <path d="M42 200 C52 222 70 222 78 206" stroke={top} strokeWidth="22" strokeLinecap="round" fill="none" />
          <rect x="64" y="148" width="34" height="58" rx="7" fill="#0f1f1c" />
          <rect x="68" y="155" width="26" height="40" rx="3" fill="#d6f5ec" />
          <path d="M72 168 h18 M72 175 h12 M72 182 h15" stroke="#14806a" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="78" cy="204" r="11" fill={s} />
        </g>
      )}
      {holding === 'clipboard' && (
        <g>
          <path d="M160 200 C150 220 132 222 122 210" stroke={coat ? '#ffffff' : top} strokeWidth="22" strokeLinecap="round" fill="none" />
          <rect x="104" y="150" width="54" height="70" rx="7" fill="#fff" stroke="#13443c" strokeWidth="3" />
          <rect x="120" y="144" width="22" height="10" rx="3" fill="#13443c" />
          <path d="M114 170 h34 M114 182 h26 M114 194 h30" stroke="#76d6bd" strokeWidth="4" strokeLinecap="round" />
          <path d="M114 206 l5 5 l10 -10" stroke="#f95d35" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="122" cy="210" r="11" fill={s} />
        </g>
      )}
    </g>
  );
}

/* ---------- Scenes ---------- */

export function PhlebotomistScene({ className = '' }) {
  return (
    <svg viewBox="0 0 420 400" className={className} role="img" aria-label="A smiling phlebotomist holding a blood sample tube next to a patient">
      <defs>
        <linearGradient id="ps-bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#d6f5ec" />
          <stop offset="1" stopColor="#ffe6db" />
        </linearGradient>
      </defs>
      <path d="M40 220 C20 110 120 30 230 40 C350 52 410 150 390 250 C370 350 260 390 160 370 C80 352 52 290 40 220Z" fill="url(#ps-bg)" />
      <circle cx="350" cy="80" r="26" fill="#f95d35" opacity=".9" />
      <path d="M336 80 h28 M350 66 v28" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
      <path d="M40 300 h60 l14 -26 l18 50 l14 -24 h40" stroke="#1f9e82" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".6" />
      <Person x={210} y={120} scale={1.05} skin="medium" hairStyle="long" hair="#2a1d18" top="#f95d35" holding="phone" />
      <Person x={40} y={70} scale={1.3} skin="tan" hairStyle="bun" hair="#1f1a17" top="#14806a" holding="tube" />
    </svg>
  );
}

export function DoctorScene({ className = '' }) {
  return (
    <svg viewBox="0 0 360 360" className={className} role="img" aria-label="A doctor in a white coat holding a test report">
      <circle cx="180" cy="190" r="160" fill="#ffffff" opacity=".14" />
      <circle cx="180" cy="190" r="118" fill="#ffffff" opacity=".12" />
      <Person x={50} y={70} scale={1.12} skin="tan" hairStyle="short" hair="#2b2420" top="#1e3a8a" coat stethoscope holding="clipboard" glasses beard />
    </svg>
  );
}

export function FamilyScene({ className = '' }) {
  return (
    <svg viewBox="0 0 420 340" className={className} role="img" aria-label="A happy family of three">
      <ellipse cx="210" cy="300" rx="190" ry="40" fill="#ffffff" opacity=".18" />
      <Person x={10} y={60} scale={1} skin="medium" hairStyle="short" hair="#1f1a17" top="#145247" beard />
      <Person x={210} y={60} scale={1} skin="light" hairStyle="long" hair="#3b2416" top="#be185d" />
      <Person x={140} y={150} scale={0.72} skin="medium" hairStyle="short" hair="#1f1a17" top="#f59e0b" />
    </svg>
  );
}

export function SeniorScene({ className = '' }) {
  return (
    <svg viewBox="0 0 360 340" className={className} role="img" aria-label="A senior patient smiling while checking reports on a phone">
      <circle cx="180" cy="180" r="150" fill="#ffffff" opacity=".16" />
      <Person x={60} y={60} scale={1.1} skin="tan" hairStyle="bald" hair="#e5e7eb" top="#7c3aed" holding="phone" glasses />
      <path d="M64 120 C70 84 150 70 172 98" stroke="#e5e7eb" strokeWidth="10" fill="none" strokeLinecap="round" transform="translate(60 0)" />
    </svg>
  );
}

export function HomeVisitScene({ className = '' }) {
  return (
    <svg viewBox="0 0 380 360" className={className} role="img" aria-label="A phlebotomist arriving at a home with a sample kit">
      <circle cx="200" cy="190" r="160" fill="#ffffff" opacity=".12" />
      <g transform="translate(20 120)" opacity=".9">
        <path d="M10 90 L90 20 L170 90 V220 H10Z" fill="#ffffff" opacity=".22" />
        <path d="M0 96 L90 16 L180 96" stroke="#ffffff" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".7" />
        <rect x="70" y="140" width="40" height="80" rx="6" fill="#ffffff" opacity=".35" />
      </g>
      <Person x={150} y={70} scale={1.1} skin="deep" hairStyle="short" hair="#111827" top="#0ea5e9" holding="tube" glove="#22c55e" />
      <g transform="translate(250 268)">
        <rect width="70" height="52" rx="10" fill="#f95d35" />
        <rect x="22" y="-10" width="26" height="14" rx="5" fill="none" stroke="#f95d35" strokeWidth="5" />
        <path d="M35 14 v24 M23 26 h24" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
      </g>
    </svg>
  );
}
