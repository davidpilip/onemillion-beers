// ui.jsx — Shared UI primitives + helpers for 1M Beers

// ── Tailwind tokens (added in HTML <script> via tailwind.config) ──
// bg: #1A140C, card: #241B10, elev: #2E2415, cream #F4ECDD, tan #B8A584,
// brown #7A6B52, amber #F4B73D, amber-dark #D97F2C, success #87C66B, danger #E07A5F

// ── Helpers ──
const todayLocalISO = () => {
  const d = new Date(); const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
};
const fmtNum = (n) => (n || 0).toLocaleString();
const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0;
  return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
});

// Normalize name for fuzzy dedup
const normName = (s) => (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, ' ').trim();

// Compress an image File to a JPEG data URL, max 800×800, q=0.7
function compressImage(file, maxDim = 800, q = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const r = width > height ? maxDim / width : maxDim / height;
        width = Math.round(width * r); height = Math.round(height * r);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', q);
      URL.revokeObjectURL(url);
      resolve(dataUrl);
    };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

// ── Count-up tween (800ms, ease-in-out) ──
function CountUp({ value, duration = 800, className = '' }) {
  const [display, setDisplay] = React.useState(value);
  const prev = React.useRef(value);
  React.useEffect(() => {
    if (value === prev.current) return;
    const start = prev.current; const end = value; const t0 = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      setDisplay(Math.round(start + (end - start) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else prev.current = end;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className={className}>{fmtNum(display)}</span>;
}

// ── Pint glass SVG (used in onboarding clink + cap state) ──
function PintGlass({ size = 100, fill = 0.7, flip = false }) {
  // Glass shape: tapered top to bottom slightly, with foam head and amber body
  const id = React.useId();
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 100 120" style={{ transform: flip ? 'scaleX(-1)' : 'none' }}>
      <defs>
        <linearGradient id={`g-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#F4B73D" />
          <stop offset="1" stopColor="#C97A1F" />
        </linearGradient>
        <clipPath id={`c-${id}`}>
          <path d="M20 18 L80 18 L73 110 L27 110 Z" />
        </clipPath>
      </defs>
      {/* glass outline (clear) */}
      <path d="M20 18 L80 18 L73 110 L27 110 Z" fill="rgba(255,255,255,0.06)" stroke="#F4ECDD" strokeWidth="2.5" strokeLinejoin="round" />
      {/* liquid */}
      <g clipPath={`url(#c-${id})`}>
        <rect x="0" y={18 + (110 - 18) * (1 - fill)} width="100" height="120" fill={`url(#g-${id})`} />
        {/* bubbles */}
        <circle cx="35" cy="80" r="1.5" fill="rgba(255,255,255,0.5)" />
        <circle cx="55" cy="65" r="1" fill="rgba(255,255,255,0.6)" />
        <circle cx="48" cy="95" r="1.2" fill="rgba(255,255,255,0.4)" />
      </g>
      {/* foam head */}
      <path d="M20 18 Q25 8 35 12 Q45 4 55 12 Q65 8 80 18 Q75 28 65 22 Q55 30 45 22 Q35 28 20 18 Z" fill="#FFF6E0" stroke="#F4ECDD" strokeWidth="1.5" strokeLinejoin="round" />
      {/* handle */}
      <path d="M80 30 Q92 35 92 60 Q92 85 80 90" fill="none" stroke="#F4ECDD" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Buttons ──
const sizeMap = {
  lg: { h: 60, fs: 17, fw: 700, px: 24 },
  md: { h: 48, fs: 15, fw: 600, px: 20 },
  sm: { h: 36, fs: 13, fw: 600, px: 14 },
};

function Btn({ children, onClick, variant = 'primary', size = 'lg', disabled = false, full = true, type = 'button', style }) {
  const s = sizeMap[size];
  const base = {
    height: s.h, padding: `0 ${s.px}px`, fontSize: s.fs, fontWeight: s.fw,
    borderRadius: 9999, border: 0, cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'Geist, system-ui', letterSpacing: '-0.01em',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: full ? '100%' : 'auto', transition: 'transform 150ms, opacity 150ms, background 150ms',
    opacity: disabled ? 0.45 : 1,
  };
  const v = {
    primary: { background: '#F4B73D', color: '#1A140C' },
    secondary: { background: 'transparent', color: '#F4ECDD', border: '1.5px solid rgba(244,236,221,0.16)' },
    ghost: { background: '#2E2415', color: '#F4ECDD' },
    danger: { background: 'transparent', color: '#E07A5F', border: '1.5px solid rgba(224,122,95,0.3)' },
  }[variant];
  return (
    <button type={type} disabled={disabled} onClick={disabled ? undefined : onClick}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = 'scale(0.97)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      style={{ ...base, ...v, ...style }}>{children}</button>
  );
}

// ── Eyebrow label ──
function Eyebrow({ children, style }) {
  return (
    <div style={{
      fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 500,
      letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B8A584', ...style,
    }}>{children}</div>
  );
}

// ── Beer card (used in search lists, profile log) ──
function BeerCard({ beer, onClick, trailing }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', background: '#241B10', border: '1px solid rgba(244,236,221,0.08)',
      borderRadius: 18, padding: 14, display: 'flex', alignItems: 'center', gap: 12,
      cursor: onClick ? 'pointer' : 'default', textAlign: 'left',
      fontFamily: 'Geist, system-ui',
    }}>
      <BeerGlyph style={beer.style} size={44} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 600, fontSize: 17,
          color: '#F4ECDD', letterSpacing: '-0.01em', marginBottom: 2,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{beer.name}</div>
        <div style={{ fontSize: 12.5, color: '#B8A584', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {beer.brewery} · {beer.style}
        </div>
      </div>
      {trailing !== undefined ? trailing : (
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 500,
          padding: '4px 8px', borderRadius: 999, background: 'rgba(244,183,61,0.12)',
          color: '#F4B73D', flexShrink: 0,
        }}>{beer.abv ? `${beer.abv.toFixed(1)}%` : '—'}</div>
      )}
    </button>
  );
}

// Map beer style to a tone pair for the icon backdrop
function beerTone(style) {
  if (!style) return ['#7A4A1F', '#A86524'];
  const s = style.toLowerCase();
  if (s.includes('stout') || s.includes('porter')) return ['#3A2A18', '#1A140C'];
  if (s.includes('hazy') || s.includes('wheat') || s.includes('hefe') || s.includes('wit')) return ['#D9B98C', '#EFD7A9'];
  if (s.includes('pils') || s.includes('lager') || s.includes('helles') || s.includes('blonde') || s.includes('cream')) return ['#E0B764', '#F4D588'];
  if (s.includes('sour') || s.includes('gose') || s.includes('berliner') || s.includes('lambic')) return ['#C9606A', '#E08591'];
  if (s.includes('saison') || s.includes('farmhouse')) return ['#D9A656', '#E8C384'];
  if (s.includes('belgian') || s.includes('tripel') || s.includes('quad') || s.includes('dubbel')) return ['#A66428', '#D9842F'];
  if (s.includes('amber') || s.includes('red') || s.includes('bock')) return ['#A35422', '#C97A2E'];
  return ['#7A4A1F', '#A86524'];
}

// The liquid color of a beer, by style — drives the little glass glyph.
function beerLiquid(style) {
  const s = (style || '').toLowerCase();
  if (s.includes('stout') || s.includes('porter') || s.includes('schwarz')) return '#241610';
  if (s.includes('amber') || s.includes('red') || s.includes('bock') || s.includes('brown') || s.includes('dunkel')) return '#B4551F';
  if (s.includes('belgian') || s.includes('tripel') || s.includes('quad') || s.includes('dubbel')) return '#C87A2C';
  if (s.includes('sour') || s.includes('gose') || s.includes('berliner') || s.includes('lambic') || s.includes('fruit')) return '#E4726F';
  if (s.includes('hazy') || s.includes('wheat') || s.includes('hefe') || s.includes('wit') || s.includes('neipa')) return '#EBB43F';
  if (s.includes('pils') || s.includes('lager') || s.includes('helles') || s.includes('blonde') || s.includes('cream') || s.includes('kolsch') || s.includes('golden')) return '#F2C233';
  if (s.includes('ipa') || s.includes('pale')) return '#E89A28';
  if (s.includes('saison') || s.includes('farmhouse')) return '#E7B23E';
  return '#D08A34';
}

// A clean little beer glass filled with the beer's color + a foam head.
function BeerGlyph({ style, size = 44 }) {
  const liquid = beerLiquid(style);
  const glassPath = 'M5 7 L23 7 L20.5 27 A3 3 0 0 1 17.5 30 L10.5 30 A3 3 0 0 1 7.5 27 Z';
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.27), flexShrink: 0,
      background: '#1B140C', border: '1px solid rgba(244,236,221,0.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 28 32" fill="none">
        <path d={glassPath} fill={liquid} stroke="rgba(244,236,221,0.32)" strokeWidth="1.3" strokeLinejoin="round" />
        {/* glass highlight */}
        <path d="M9 10 L10.2 25" stroke="rgba(255,255,255,0.20)" strokeWidth="1.4" strokeLinecap="round" />
        {/* foam head */}
        <ellipse cx="14" cy="7.4" rx="9.6" ry="3.5" fill="#FBF3DE" />
        <ellipse cx="10.4" cy="6.2" rx="3.1" ry="2.6" fill="#FFFFFF" />
        <ellipse cx="17.6" cy="6.5" rx="3.6" ry="2.8" fill="#FDF7E6" />
      </svg>
    </div>
  );
}

// ── Rating stars (display + interactive) ──
function StarRow({ value, max = 5, onChange, size = 20, gap = 4 }) {
  const interactive = typeof onChange === 'function';
  return (
    <div style={{ display: 'flex', gap }}>
      {Array.from({ length: max }, (_, i) => i + 1).map(n => {
        const filled = n <= value;
        const color = filled ? '#F4B73D' : 'rgba(244,236,221,0.18)';
        if (!interactive) {
          // Display-only — use span to avoid nested-button DOM warning
          return (
            <span key={n} aria-hidden="true" style={{ color, display: 'inline-flex' }}>
              <Icon name="star" size={size} filled={filled} strokeWidth={1.6} />
            </span>
          );
        }
        return (
          <button key={n} onClick={() => onChange(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              color, transition: 'transform 150ms',
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.85)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Icon name="star" size={size} filled={filled} strokeWidth={1.6} />
          </button>
        );
      })}
    </div>
  );
}

// ── Toast (bottom popup notification) ──
function useToast() {
  const [toast, setToast] = React.useState(null);
  const show = React.useCallback((msg, dur = 2000) => {
    setToast(msg);
    setTimeout(() => setToast(null), dur);
  }, []);
  const node = toast ? (
    <div style={{
      position: 'absolute', bottom: 96, left: 16, right: 16, zIndex: 200,
      background: '#2E2415', border: '1px solid rgba(244,236,221,0.16)',
      borderRadius: 14, padding: '12px 16px', color: '#F4ECDD',
      fontFamily: 'Geist, system-ui', fontSize: 14, textAlign: 'center',
      boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
      animation: 'toast-in 250ms cubic-bezier(0.4,0,0.2,1)',
    }}>{toast}</div>
  ) : null;
  return [show, node];
}

// ── Skeleton ──
function Skeleton({ w, h = 16, r = 8, style }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'linear-gradient(90deg, #241B10 0%, #2E2415 50%, #241B10 100%)',
      backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease-in-out infinite',
      ...style,
    }} />
  );
}

window.uiHelpers = { todayLocalISO, fmtNum, uuid, normName, compressImage, beerTone };
Object.assign(window, { CountUp, PintGlass, Btn, Eyebrow, BeerCard, StarRow, useToast, Skeleton });
