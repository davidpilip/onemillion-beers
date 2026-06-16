// community.jsx — Beer of the Week, Milestone overlay/banner, Dormancy ticker, ParticleField

// ─────────────────────────────────────────────────────────────
// ISO week helper
// ─────────────────────────────────────────────────────────────
function isoWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo, key: `${d.getUTCFullYear()}-${String(weekNo).padStart(2, '0')}` };
}

const SPONSOR_ROTATION = [
  { beer_name: "Heineken Lager", brewery: "Heineken", style: "European Lager",
    sponsor_message: "The original green bottle. Crisp, clean, classic.",
    bar_partner: null },
  { beer_name: "Modelo Especial", brewery: "Grupo Modelo", style: "Mexican Lager",
    sponsor_message: "El modelo de la cerveza. Smooth on a hot day.",
    bar_partner: null },
  { beer_name: "Guinness Draught", brewery: "Guinness", style: "Irish Stout",
    sponsor_message: "Pour it patient. Two-part pour. Worth the wait.",
    bar_partner: null },
  { beer_name: "Pilsner Urquell", brewery: "Pilsner Urquell Brewery", style: "Czech Pilsner",
    sponsor_message: "The original pilsner. Since 1842. Still untouched.",
    bar_partner: "The Pour Society · Brooklyn" },
  { beer_name: "Stella Artois", brewery: "Stella Artois", style: "European Lager",
    sponsor_message: "From the chalice. Always.",
    bar_partner: null },
  { beer_name: "Pale Ale", brewery: "Sierra Nevada", style: "American Pale Ale",
    sponsor_message: "The pale ale that started craft. Pine, citrus, perfect.",
    bar_partner: "Hopworks Taproom · Portland" },
];

// ─────────────────────────────────────────────────────────────
// Beer of the Week — resolves current week's sponsor and renders card
// ─────────────────────────────────────────────────────────────
async function resolveBeerOfWeek() {
  const { week, key } = isoWeek();
  const storedKey = `beers:weekly_sponsor:${key}`;
  let sponsor = await storage_util.get(storedKey, true);
  if (!sponsor) {
    sponsor = SPONSOR_ROTATION[week % SPONSOR_ROTATION.length];
    await storage_util.set(storedKey, sponsor, true);
  }
  // Try to match to a beer in the database (so Log-It can pre-fill)
  const db = (await storage_util.get('beers:database', true)) || [];
  const match = db.find(b =>
    uiHelpers.normName(b.name) === uiHelpers.normName(sponsor.beer_name) &&
    uiHelpers.normName(b.brewery) === uiHelpers.normName(sponsor.brewery)
  );
  return { sponsor, beer: match || null, weekKey: key };
}

function BeerOfTheWeekCard({ onLog, compact = false }) {
  const [data, setData] = React.useState(null);
  const [alreadyLogged, setAlreadyLogged] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const d = await resolveBeerOfWeek();
      setData(d);
      // Did this user log it this week?
      const hist = (await storage_util.get('user:log_history', false)) || [];
      const weekStart = Date.now() - 7 * 86400000;
      const did = hist.some(h =>
        h.ts > weekStart &&
        uiHelpers.normName(h.beer_name) === uiHelpers.normName(d.sponsor.beer_name) &&
        uiHelpers.normName(h.brewery) === uiHelpers.normName(d.sponsor.brewery)
      );
      setAlreadyLogged(did);
    })();
  }, []);

  if (!data) return <Skeleton w="100%" h={compact ? 100 : 160} r={22} />;
  const { sponsor, beer } = data;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(244,183,61,0.14), rgba(217,127,44,0.08))',
      border: '1px solid rgba(244,183,61,0.32)',
      borderRadius: 22, padding: 18, position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative blur orb */}
      <div style={{
        position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(244,183,61,0.35), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, position: 'relative' }}>
        <Eyebrow style={{ color: '#F4B73D' }}>
          <Icon name="sparkles" size={11} style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} />
          Beer of the week
        </Eyebrow>
        {alreadyLogged && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 999, background: 'rgba(135,198,107,0.18)',
            border: '1px solid rgba(135,198,107,0.4)',
            fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#87C66B', letterSpacing: '0.04em',
          }}>
            <Icon name="check" size={11} strokeWidth={3} /> LOGGED
          </div>
        )}
      </div>

      <div style={{
        fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: compact ? 20 : 24,
        color: '#F4ECDD', letterSpacing: '-0.02em', marginBottom: 2, position: 'relative',
      }}>{sponsor.beer_name}</div>
      <div style={{ fontSize: 12.5, color: '#B8A584', marginBottom: 10, position: 'relative', fontFamily: 'Geist, system-ui' }}>
        {sponsor.brewery} · {sponsor.style}
      </div>
      {!compact && (
        <div style={{
          fontSize: 13.5, color: '#F4ECDD', opacity: 0.85, lineHeight: 1.5,
          fontStyle: 'italic', marginBottom: 14, position: 'relative', fontFamily: 'Geist, system-ui',
        }}>"{sponsor.sponsor_message}"</div>
      )}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', position: 'relative' }}>
        <Btn size="md" full={false} onClick={() => onLog(beer || {
          id: 'sponsor-' + uiHelpers.normName(sponsor.beer_name).replace(/\s+/g, '-'),
          name: sponsor.beer_name, brewery: sponsor.brewery, style: sponsor.style,
          abv: null, region: 'Sponsor', source: 'sponsor',
        })} style={{ minWidth: 100 }}>
          {alreadyLogged ? 'Log another' : 'Log it'} <Icon name="arrowRight" size={16} />
        </Btn>
        {sponsor.bar_partner && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '8px 12px', borderRadius: 999, background: 'rgba(244,236,221,0.07)',
            border: '1px solid rgba(244,236,221,0.1)', flex: 1, minWidth: 0,
          }}>
            <Icon name="pin" size={12} color="#F4B73D" />
            <span style={{ fontSize: 11, color: '#B8A584', fontFamily: 'Geist, system-ui', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {sponsor.bar_partner}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ParticleField — drifting beer-mug SVG particles
// ─────────────────────────────────────────────────────────────
function ParticleField({ count = 30, durationMs = 5000 }) {
  const particles = React.useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    leftPct: Math.random() * 100,
    drift: (Math.random() - 0.5) * 60, // -30 to +30vw drift
    delay: Math.random() * 1.2,
    duration: 3.2 + Math.random() * 2,
    size: 14 + Math.random() * 14,
    rotation: (Math.random() - 0.5) * 720,
    hue: ['#F4B73D', '#FFF6E0', '#FFD24A', '#D97F2C', '#F4ECDD'][i % 5],
  })), [count]);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <style>{`
        @keyframes float-up {
          0% { transform: translate3d(0, 110%, 0) rotate(0deg); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translate3d(var(--drift), -20%, 0) rotate(var(--rot)); opacity: 0; }
        }
      `}</style>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute', bottom: 0, left: `${p.leftPct}%`,
          width: p.size, height: p.size * 1.2,
          '--drift': `${p.drift}vw`, '--rot': `${p.rotation}deg`,
          animationName: 'float-up',
          animationDuration: `${p.duration}s`,
          animationDelay: `${p.delay}s`,
          animationTimingFunction: 'ease-out',
          animationIterationCount: 'infinite',
        }}>
          {/* Tiny beer mug SVG */}
          <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke={p.hue} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 7h11v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7z" fill={p.hue} fillOpacity="0.85" />
            <path d="M16 10h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
            <path d="M7 4c0-1 1-2 2-2s1 1 2 1 1-1 2-1 2 1 2 2" />
          </svg>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Milestone Overlay (live, theatrical)
// ─────────────────────────────────────────────────────────────
function MilestoneOverlay({ milestone, youCrossed, memberNumber, onClose }) {
  const [showContinue, setShowContinue] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setShowContinue(true), 3500);
    return () => clearTimeout(t);
  }, []);
  const isMillion = milestone >= 1000000;

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 200,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 30, textAlign: 'center', overflow: 'hidden',
      animation: 'fade-in 400ms ease-out',
    }}>
      {/* Animated radial gradient bg */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 50% 40%, #D97F2C, #1A140C 70%)',
        animation: 'mile-rotate 18s linear infinite',
      }} />
      <style>{`
        @keyframes mile-rotate { from { filter: hue-rotate(0deg); } to { filter: hue-rotate(360deg); } }
        @keyframes mile-pulse { 0%,100% { text-shadow: 0 0 20px rgba(244,183,61,0.4); } 50% { text-shadow: 0 0 50px rgba(244,183,61,0.85); } }
        @keyframes flash { 0% { background: rgba(255,246,224,0.7); } 100% { background: transparent; } }
      `}</style>
      {/* Flash */}
      <div style={{ position: 'absolute', inset: 0, animation: 'flash 1s ease-out', pointerEvents: 'none' }} />
      <ParticleField count={isMillion ? 60 : 30} />

      <div style={{ position: 'relative', zIndex: 5 }}>
        <Eyebrow style={{ color: '#FFF6E0', opacity: 0.85, marginBottom: 12 }}>
          {isMillion ? 'WE DID IT.' : 'WE JUST HIT'}
        </Eyebrow>
        <div style={{
          fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 800,
          fontSize: isMillion ? 92 : 78, color: '#FFF6E0',
          letterSpacing: '-0.04em', lineHeight: 0.95,
          animation: 'mile-pulse 1.8s ease-in-out infinite',
        }}>{milestone.toLocaleString()}</div>
        <div style={{
          fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 22,
          color: '#F4ECDD', letterSpacing: '-0.02em', marginTop: 10, marginBottom: 14,
        }}>{isMillion ? 'beers, together.' : 'a toast from all of us.'}</div>

        {youCrossed && (
          <div style={{
            marginTop: 8, padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(26,20,12,0.4)', border: '1px solid rgba(244,236,221,0.3)',
            borderRadius: 999, backdropFilter: 'blur(8px)',
          }}>
            <Icon name="trophy" size={14} color="#FFF6E0" />
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#FFF6E0',
              letterSpacing: '0.06em',
            }}>YOU CROSSED IT · MEMBER #{memberNumber}</span>
          </div>
        )}
      </div>

      <div style={{
        position: 'absolute', bottom: 36, left: 30, right: 30, zIndex: 5,
        opacity: showContinue ? 1 : 0, transition: 'opacity 500ms',
      }}>
        <Btn onClick={onClose} variant="ghost" style={{ background: '#F4ECDD', color: '#1A140C' }}>
          {isMillion ? 'Cheers to you all' : 'Continue'} <Icon name="arrowRight" size={20} />
        </Btn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Milestone Banner — "you missed it" within 24h
// ─────────────────────────────────────────────────────────────
function MilestoneBanner({ milestone, hitAt, onDismiss }) {
  const ago = timeAgo(hitAt);
  return (
    <div style={{
      margin: '0 20px 16px', padding: '12px 14px',
      background: 'linear-gradient(135deg, #F4B73D, #D97F2C)',
      borderRadius: 14, color: '#1A140C',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{ fontSize: 24, lineHeight: 1 }}>🍻</div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 14,
          letterSpacing: '-0.01em',
        }}>We hit {milestone.toLocaleString()} {ago} ago</div>
        <div style={{ fontSize: 11.5, opacity: 0.78, fontFamily: 'Geist, system-ui', marginTop: 1 }}>
          You missed the live moment — but here's to it.
        </div>
      </div>
      <button onClick={onDismiss} style={{
        background: 'rgba(26,20,12,0.15)', border: 0, color: '#1A140C', cursor: 'pointer',
        width: 28, height: 28, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Icon name="x" size={14} strokeWidth={2.5} /></button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Dormancy Ticker — floating +1 particles when last log > 12h ago
// ─────────────────────────────────────────────────────────────
function DormancyTicker({ isDormant }) {
  const [pings, setPings] = React.useState([]);
  React.useEffect(() => {
    if (!isDormant) return;
    let id;
    const schedule = () => {
      const delay = 8000 + Math.random() * 7000;
      id = setTimeout(() => {
        const pid = Math.random();
        setPings(p => [...p, { id: pid, x: -20 + Math.random() * 40 }]);
        setTimeout(() => setPings(p => p.filter(x => x.id !== pid)), 2000);
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(id);
  }, [isDormant]);

  if (!isDormant) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <style>{`
        @keyframes ping-rise { 0% { transform: translate3d(var(--x), 0, 0); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate3d(var(--x), -80px, 0); opacity: 0; } }
      `}</style>
      {pings.map(p => (
        <div key={p.id} style={{
          position: 'absolute', top: 56, right: 30,
          '--x': `${p.x}px`,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600,
          color: '#F4B73D',
          animationName: 'ping-rise',
          animationDuration: '2s',
          animationTimingFunction: 'ease-out',
          animationFillMode: 'forwards',
        }}>+1</div>
      ))}
    </div>
  );
}

window.resolveBeerOfWeek = resolveBeerOfWeek;
window.BeerOfTheWeekCard = BeerOfTheWeekCard;
window.MilestoneOverlay = MilestoneOverlay;
window.MilestoneBanner = MilestoneBanner;
window.DormancyTicker = DormancyTicker;
window.ParticleField = ParticleField;
window.isoWeek = isoWeek;
