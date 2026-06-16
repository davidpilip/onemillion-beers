// app-shell.jsx — shared design tokens, components, icons, mock data

// ─────────────────────────────────────────────────────────────
// Theme tokens
// ─────────────────────────────────────────────────────────────
const THEMES = {
  amber: {
    name: 'Amber',
    bg: '#1A140C',
    surface: '#241B0F',
    surface2: '#2E2414',
    line: 'rgba(244,183,61,0.12)',
    text: '#F5EBD8',
    textDim: 'rgba(245,235,216,0.62)',
    textFaint: 'rgba(245,235,216,0.32)',
    accent: '#F4B73D',
    accent2: '#D97F2C',
    accentText: '#1A140C',
    foam: '#FFF1D6',
    danger: '#E26B5A',
    success: '#7FB069',
  },
  dark: {
    name: 'Midnight',
    bg: '#0E0F11',
    surface: '#17181B',
    surface2: '#1F2125',
    line: 'rgba(255,255,255,0.07)',
    text: '#F2F2F2',
    textDim: 'rgba(242,242,242,0.62)',
    textFaint: 'rgba(242,242,242,0.32)',
    accent: '#FFD24A',
    accent2: '#E89B3C',
    accentText: '#0E0F11',
    foam: '#FFF6DA',
    danger: '#E26B5A',
    success: '#7FB069',
  },
  cream: {
    name: 'Cream',
    bg: '#F4ECDD',
    surface: '#FFFFFF',
    surface2: '#FAF3E2',
    line: 'rgba(26,20,12,0.10)',
    text: '#1A140C',
    textDim: 'rgba(26,20,12,0.62)',
    textFaint: 'rgba(26,20,12,0.32)',
    accent: '#D97F2C',
    accent2: '#B85F1C',
    accentText: '#FFFFFF',
    foam: '#FFF6DA',
    danger: '#C0392B',
    success: '#2E7D4F',
  },
};

// ─────────────────────────────────────────────────────────────
// Icons (custom, chunky)
// ─────────────────────────────────────────────────────────────
const Icon = ({ name, size = 22, color = 'currentColor', stroke = 2 }) => {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'home': return <svg {...p}><path d="M3 11l9-8 9 8v10a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1V11z"/></svg>;
    case 'log': return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>;
    case 'toast': return <svg {...p}><path d="M7 3h7l3 4v3a3 3 0 01-3 3h-1v8H8v-8H7a3 3 0 01-3-3V7l3-4z"/><path d="M14 3v4h3"/></svg>;
    case 'stats': return <svg {...p}><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>;
    case 'profile': return <svg {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>;
    case 'settings': return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h.01a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.01a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;
    case 'check': return <svg {...p}><path d="M5 12l5 5L20 7"/></svg>;
    case 'chevron': return <svg {...p}><path d="M9 6l6 6-6 6"/></svg>;
    case 'chevron-l': return <svg {...p}><path d="M15 6l-6 6 6 6"/></svg>;
    case 'chevron-d': return <svg {...p}><path d="M6 9l6 6 6-6"/></svg>;
    case 'x': return <svg {...p}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case 'plus': return <svg {...p}><path d="M12 5v14M5 12h14"/></svg>;
    case 'minus': return <svg {...p}><path d="M5 12h14"/></svg>;
    case 'star': return <svg {...p} fill={color}><path d="M12 2l3 7 7 .8-5.4 4.7L18 22l-6-3.5L6 22l1.4-7.5L2 9.8 9 9z"/></svg>;
    case 'star-o': return <svg {...p}><path d="M12 2l3 7 7 .8-5.4 4.7L18 22l-6-3.5L6 22l1.4-7.5L2 9.8 9 9z"/></svg>;
    case 'thumb': return <svg {...p}><path d="M7 10v11H4a1 1 0 01-1-1v-9a1 1 0 011-1h3zm0 0l5-8a2 2 0 012 2v4h5a2 2 0 012 2.4l-1.5 7A2 2 0 0116.5 19H7"/></svg>;
    case 'fire': return <svg {...p}><path d="M12 2c1 4 5 5 5 10a5 5 0 11-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 0-6 1-9z"/></svg>;
    case 'globe': return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg>;
    case 'map': return <svg {...p}><path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/></svg>;
    case 'bell': return <svg {...p}><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M10 21a2 2 0 004 0"/></svg>;
    case 'phone': return <svg {...p}><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012 4.2 2 2 0 014 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.6a2 2 0 01-.5 2.1L7.9 9.7a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.5c.8.3 1.7.5 2.6.6a2 2 0 011.7 2z"/></svg>;
    case 'arrow-r': return <svg {...p}><path d="M5 12h14M13 5l7 7-7 7"/></svg>;
    case 'arrow-up': return <svg {...p}><path d="M12 19V5M5 12l7-7 7 7"/></svg>;
    case 'spark': return <svg {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>;
    case 'beer': return <svg {...p}><path d="M5 6h11v13a2 2 0 01-2 2H7a2 2 0 01-2-2V6zM16 9h2a2 2 0 012 2v4a2 2 0 01-2 2h-2M5 6c0-2 2-3 4-3s2 1 4 1 3-1 3 2"/></svg>;
    case 'pin': return <svg {...p}><path d="M12 22s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>;
    case 'shield': return <svg {...p}><path d="M12 2l8 3v7c0 5-4 9-8 10-4-1-8-5-8-10V5l8-3z"/></svg>;
    case 'heart': return <svg {...p}><path d="M12 21s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.5-7 10-7 10z"/></svg>;
    case 'lock': return <svg {...p}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>;
    case 'trophy': return <svg {...p}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM7 6H4a3 3 0 003 4M17 6h3a3 3 0 01-3 4"/></svg>;
    default: return null;
  }
};

// ─────────────────────────────────────────────────────────────
// Striped placeholder
// ─────────────────────────────────────────────────────────────
const PhotoBox = ({ label, w = '100%', h = 100, radius = 14, theme, tone = 'amber', style }) => {
  const tones = {
    amber: ['#7A4A1F', '#A86524'],
    copper: ['#8C3E1B', '#B85820'],
    foam: ['#C9A062', '#E8C384'],
    dark: ['#2A1F12', '#3A2C1A'],
    cream: ['#D9B98C', '#EFD7A9'],
  }[tone] || ['#7A4A1F', '#A86524'];
  return (
    <div style={{
      width: w, height: h, borderRadius: radius, position: 'relative', overflow: 'hidden',
      background: `repeating-linear-gradient(135deg, ${tones[0]} 0 8px, ${tones[1]} 8px 16px)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', ...style,
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.18)' }} />
      {label && (
        <div style={{
          position: 'relative', zIndex: 1, fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase',
          color: 'rgba(255,240,210,0.85)', textAlign: 'center', padding: '0 6px',
        }}>{label}</div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Avatar (initials, no copyrighted faces)
// ─────────────────────────────────────────────────────────────
const Avatar = ({ name, size = 36, theme }) => {
  const palette = ['#F4B73D', '#D97F2C', '#7FB069', '#E26B5A', '#9B6BCC', '#4FA3C7'];
  const hash = [...(name || 'X')].reduce((a, c) => a + c.charCodeAt(0), 0);
  const bg = palette[hash % palette.length];
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700,
      fontSize: size * 0.42, color: '#1A140C', flexShrink: 0,
    }}>{initials}</div>
  );
};

// ─────────────────────────────────────────────────────────────
// Bottom nav
// ─────────────────────────────────────────────────────────────
const BottomNav = ({ active, setScreen, theme }) => {
  const items = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'toasts', label: 'Toasts', icon: 'toast' },
    { id: 'log', label: 'Log', icon: 'plus', center: true },
    { id: 'stats', label: 'Stats', icon: 'stats' },
    { id: 'profile', label: 'You', icon: 'profile' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30,
      background: theme.bg,
      borderTop: `1px solid ${theme.line}`,
      padding: '10px 8px 28px',
      display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end',
    }}>
      {items.map(it => {
        const isActive = active === it.id;
        if (it.center) {
          return (
            <button key={it.id} onClick={() => setScreen('log')} style={{
              width: 56, height: 56, borderRadius: '50%',
              background: theme.accent, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginTop: -22, boxShadow: `0 8px 24px ${theme.accent}40`,
              color: theme.accentText,
            }}>
              <Icon name="plus" size={28} stroke={2.6} color={theme.accentText} />
            </button>
          );
        }
        return (
          <button key={it.id} onClick={() => setScreen(it.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: '4px 12px',
            color: isActive ? theme.accent : theme.textDim,
            fontFamily: 'Geist, system-ui', fontSize: 10.5, fontWeight: 600,
            letterSpacing: 0.2,
          }}>
            <Icon name={it.icon} size={22} stroke={isActive ? 2.4 : 2} />
            {it.label}
          </button>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Top bar
// ─────────────────────────────────────────────────────────────
const TopBar = ({ title, theme, onBack, onClose, right, big = false }) => (
  <div style={{
    paddingTop: 56, paddingBottom: big ? 4 : 14, paddingLeft: 20, paddingRight: 20,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: theme.bg, position: 'relative', zIndex: 5,
  }}>
    <div style={{ width: 40 }}>
      {onBack && (
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, color: theme.text, cursor: 'pointer' }}>
          <Icon name="chevron-l" size={26} />
        </button>
      )}
      {onClose && (
        <button onClick={onClose} style={{ background: 'none', border: 'none', padding: 0, color: theme.text, cursor: 'pointer' }}>
          <Icon name="x" size={26} />
        </button>
      )}
    </div>
    <div style={{
      fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700,
      fontSize: big ? 15 : 17, letterSpacing: big ? 1.2 : 0,
      textTransform: big ? 'uppercase' : 'none',
      color: theme.text, flex: 1, textAlign: 'center',
    }}>{title}</div>
    <div style={{ width: 40, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Pill / Chunky button
// ─────────────────────────────────────────────────────────────
const Btn = ({ children, theme, variant = 'primary', onClick, full = true, size = 'lg', style }) => {
  const sizes = { lg: { h: 60, fs: 17, pad: '0 24px' }, md: { h: 48, fs: 15, pad: '0 20px' }, sm: { h: 36, fs: 13, pad: '0 14px' } };
  const s = sizes[size];
  const variants = {
    primary: { bg: theme.accent, color: theme.accentText, border: 'none' },
    secondary: { bg: 'transparent', color: theme.text, border: `1.5px solid ${theme.text}` },
    ghost: { bg: theme.surface, color: theme.text, border: 'none' },
  };
  const v = variants[variant];
  return (
    <button onClick={onClick} style={{
      width: full ? '100%' : 'auto', height: s.h, padding: s.pad,
      background: v.bg, color: v.color, border: v.border,
      borderRadius: 999, cursor: 'pointer',
      fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700,
      fontSize: s.fs, letterSpacing: -0.2,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      transition: 'transform 0.12s', ...style,
    }}
    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >{children}</button>
  );
};

// ─────────────────────────────────────────────────────────────
// Pill (label/chip)
// ─────────────────────────────────────────────────────────────
const Pill = ({ children, theme, active = false, onClick, style }) => (
  <button onClick={onClick} style={{
    height: 34, padding: '0 14px', borderRadius: 999,
    background: active ? theme.accent : 'transparent',
    border: active ? 'none' : `1px solid ${theme.line}`,
    color: active ? theme.accentText : theme.text,
    fontFamily: 'Geist, system-ui', fontWeight: 600, fontSize: 13,
    cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6,
    ...style,
  }}>{children}</button>
);

// ─────────────────────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────────────────────
const BEERS = [
  { id: 'b1', name: 'Hopfully Yours', brewery: 'Foam Co.', style: 'Hazy IPA', abv: 6.8, tone: 'amber' },
  { id: 'b2', name: 'Slow Pour', brewery: 'Pour Decisions', style: 'Pilsner', abv: 4.9, tone: 'foam' },
  { id: 'b3', name: 'Lager Than Life', brewery: 'Tinroof Brewing', style: 'Helles Lager', abv: 5.0, tone: 'foam' },
  { id: 'b4', name: 'Midnight Yeast', brewery: 'Cellar Door', style: 'Imperial Stout', abv: 9.4, tone: 'dark' },
  { id: 'b5', name: 'Saison du Soleil', brewery: 'Wildwood Farm', style: 'Saison', abv: 6.1, tone: 'amber' },
  { id: 'b6', name: 'Foam Sweet Foam', brewery: 'Foam Co.', style: 'Wheat Ale', abv: 5.2, tone: 'foam' },
  { id: 'b7', name: 'Bitter End', brewery: 'Tinroof Brewing', style: 'English Bitter', abv: 4.4, tone: 'copper' },
  { id: 'b8', name: 'Sour Hour', brewery: 'Wildwood Farm', style: 'Berliner Weisse', abv: 3.8, tone: 'amber' },
];

const TOASTS = [
  { user: 'Maya R.', beer: 'Hopfully Yours', text: "tastes like Sunday afternoon. extremely soft, juicy, slightly disrespectful in the best way.", upvotes: 24, time: '4m', rating: 4 },
  { user: 'Devon K.', beer: 'Midnight Yeast', text: 'demolished one of these after my run. recovery beer? recovery beer.', upvotes: 18, time: '12m', rating: 5 },
  { user: 'Priya S.', beer: 'Slow Pour', text: 'pilsner with personality. crisp, clean, would clink again.', upvotes: 31, time: '18m', rating: 5 },
  { user: 'Theo B.', beer: 'Lager Than Life', text: "first beer of the trip. the airport is forgiven.", upvotes: 9, time: '34m', rating: 4 },
  { user: 'Jules W.', beer: 'Saison du Soleil', text: 'farmhouse vibes on a tuesday. peppery and weird, love that for me.', upvotes: 12, time: '1h', rating: 4 },
  { user: 'Cam L.', beer: 'Foam Sweet Foam', text: 'wheat beer truthers, where you at.', upvotes: 7, time: '2h', rating: 3 },
];

const BREWERIES = [
  { name: 'Foam Co.', city: 'Oakland, CA', miles: 1.2, beers: 12, tone: 'amber' },
  { name: 'Pour Decisions', city: 'San Francisco, CA', miles: 2.8, beers: 8, tone: 'foam' },
  { name: 'Tinroof Brewing', city: 'Berkeley, CA', miles: 4.1, beers: 14, tone: 'copper' },
  { name: 'Wildwood Farm', city: 'Petaluma, CA', miles: 28, beers: 6, tone: 'amber' },
  { name: 'Cellar Door', city: 'Alameda, CA', miles: 5.6, beers: 9, tone: 'dark' },
];

Object.assign(window, { THEMES, Icon, PhotoBox, Avatar, BottomNav, TopBar, Btn, Pill, BEERS, TOASTS, BREWERIES });
