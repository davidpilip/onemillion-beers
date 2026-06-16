// polish.jsx — Polish utilities: date formatting, event log, error toast, keyboard shortcuts,
// success banner after milestone, "?" cheat sheet, reduced-motion utilities.

// ── Date utilities ──
const dateUtils = {
  now: () => Date.now(),
  // Compact relative: "Just now", "2m", "1h", "Yesterday", "Mar 14"
  timeAgo(ts) {
    if (!ts) return '—';
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 10) return 'just now';
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
    const d = new Date(ts);
    const now = new Date();
    const sameYear = d.getFullYear() === now.getFullYear();
    const daysAgo = Math.floor(h / 24);
    if (daysAgo === 1) return 'Yesterday';
    if (daysAgo < 7) return `${daysAgo}d`;
    const month = d.toLocaleString('en-US', { month: 'short' });
    return sameYear ? `${month} ${d.getDate()}` : `${month} ${d.getDate()}, ${d.getFullYear()}`;
  },
  // Long: "Mar 14, 2026 · 7:42 PM"
  formatLong(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
  },
  // Date only: "Mar 14, 2026"
  formatDate(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },
};

// ── Event log (debug/audit) ──
const EventLog = {
  async record(event, metadata = {}) {
    try {
      const log = (await storage_util.get('user:event_log', false)) || [];
      log.unshift({ event, timestamp: Date.now(), metadata });
      await storage_util.set('user:event_log', log.slice(0, 200), false);
    } catch {}
  },
  async read() {
    return (await storage_util.get('user:event_log', false)) || [];
  },
  async clear() {
    await storage_util.set('user:event_log', [], false);
  },
};

// ── Error toast (slides up, 3s) ──
function ErrorToast({ message, onDismiss }) {
  React.useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div role="alert" aria-live="polite" style={{
      position: 'absolute', bottom: 110, left: 16, right: 16, zIndex: 300,
      background: '#241B10', border: '1px solid rgba(224,122,95,0.35)',
      borderRadius: 14, padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: 10,
      animation: 'toast-in 250ms cubic-bezier(0.4,0,0.2,1)',
      boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#E07A5F', flexShrink: 0 }} />
      <div style={{ fontFamily: 'Geist, system-ui', fontSize: 13, color: '#F4ECDD', flex: 1 }}>{message}</div>
      <button onClick={onDismiss} style={{ background: 'none', border: 0, color: '#7A6B52', cursor: 'pointer', padding: 4 }}>
        <Icon name="x" size={14} />
      </button>
    </div>
  );
}

// ── Success banner (persistent 24h after milestone) ──
function SuccessBanner({ count, milestone, onDismiss }) {
  return (
    <div style={{
      margin: '0 20px 14px',
      background: 'linear-gradient(135deg, rgba(135,198,107,0.16), rgba(244,183,61,0.12))',
      border: '1px solid rgba(135,198,107,0.3)',
      borderRadius: 14, padding: '10px 14px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', background: '#87C66B',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}><Icon name="check" size={14} strokeWidth={3} color="#1A140C" /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 13,
          color: '#F4ECDD', letterSpacing: '-0.01em',
        }}>We hit {milestone.toLocaleString()}. Keep pouring.</div>
        <div style={{ fontSize: 11, color: '#B8A584', fontFamily: 'JetBrains Mono, monospace', marginTop: 1, letterSpacing: '0.04em' }}>
          NOW AT {(count || 0).toLocaleString()}
        </div>
      </div>
      <button onClick={onDismiss} aria-label="Dismiss" style={{
        background: 'none', border: 0, color: '#7A6B52', cursor: 'pointer',
        width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}><Icon name="x" size={14} /></button>
    </div>
  );
}

// ── Cheat sheet modal (opened by "?" button) ──
function CheatSheet({ open, onClose }) {
  if (!open) return null;
  const shortcuts = [
    { key: 'H', label: 'Home' },
    { key: 'T', label: 'Toasts feed' },
    { key: 'L', label: 'Open log flow' },
    { key: 'S', label: 'Stats' },
    { key: 'U', label: 'Your profile' },
    { key: 'Esc', label: 'Close any overlay' },
    { key: '?', label: 'Show this cheat sheet' },
    { key: '5×', label: 'Tap "1M BEERS" to unlock admin' },
  ];
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="cheat-sheet-title" style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)',
      zIndex: 250, display: 'flex', alignItems: 'flex-end',
      animation: 'fade-in 250ms ease-out',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', background: '#241B10', borderRadius: '24px 24px 0 0',
        padding: '24px 24px 36px', borderTop: '1px solid rgba(244,236,221,0.12)',
        animation: 'slide-up 250ms cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{ width: 40, height: 4, background: 'rgba(244,236,221,0.2)', borderRadius: 2, margin: '0 auto 18px' }} />
        <div id="cheat-sheet-title" style={{
          fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 22,
          color: '#F4ECDD', letterSpacing: '-0.02em', marginBottom: 4,
        }}>Quick keys</div>
        <div style={{ fontSize: 12.5, color: '#B8A584', marginBottom: 18, fontFamily: 'Geist, system-ui' }}>
          For desktop testing.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {shortcuts.map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '8px 4px',
              borderBottom: i < shortcuts.length - 1 ? '1px solid rgba(244,236,221,0.05)' : 'none',
            }}>
              <kbd style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600,
                padding: '4px 10px', background: '#1A140C',
                border: '1px solid rgba(244,236,221,0.12)', borderRadius: 6,
                color: '#F4B73D', minWidth: 36, textAlign: 'center',
              }}>{s.key}</kbd>
              <div style={{ flex: 1, fontSize: 13, color: '#F4ECDD', fontFamily: 'Geist, system-ui' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 22 }}>
          <Btn onClick={onClose} variant="ghost">Got it</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Floating "?" button (bottom-right above nav) ──
function HelpButton({ onClick }) {
  return (
    <button onClick={onClick} aria-label="Show keyboard shortcuts" style={{
      position: 'absolute', right: 16, bottom: 110, zIndex: 25,
      width: 36, height: 36, borderRadius: '50%',
      background: 'rgba(36,27,16,0.85)', backdropFilter: 'blur(8px)',
      border: '1px solid rgba(244,236,221,0.12)', color: '#B8A584', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 16,
      transition: 'all 200ms',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.color = '#F4B73D'; e.currentTarget.style.borderColor = 'rgba(244,183,61,0.4)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.color = '#B8A584'; e.currentTarget.style.borderColor = 'rgba(244,236,221,0.12)'; }}
    >?</button>
  );
}

// ── Offline indicator dot ──
function OfflineDot() {
  const [offline, setOffline] = React.useState(false);
  React.useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  if (!offline) return null;
  return (
    <div style={{
      position: 'absolute', top: 56, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
      padding: '4px 10px', borderRadius: 999, background: 'rgba(224,122,95,0.18)',
      border: '1px solid rgba(224,122,95,0.4)',
      fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#E07A5F',
      letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6,
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#E07A5F' }} />
      OFFLINE · WRITES QUEUED
    </div>
  );
}

// ── Reduced motion detection ──
const prefersReducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  catch { return false; }
};

// ── Wordmark with breathing animation ──
function BreathingWordmark({ children, onTap }) {
  const reduce = prefersReducedMotion();
  return (
    <button onClick={onTap} aria-label="1M Beers" style={{
      background: 'none', border: 0, padding: 0, cursor: 'pointer',
      fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 500,
      letterSpacing: reduce ? '0.12em' : '0.12em',
      textTransform: 'uppercase', color: '#B8A584',
      animation: reduce ? 'none' : 'wordmark-breathe 8s ease-in-out infinite',
    }}>
      <style>{`
        @keyframes wordmark-breathe { 0%,100% { letter-spacing: 0.12em; } 50% { letter-spacing: 0.14em; } }
      `}</style>
      {children}
    </button>
  );
}

// ── Page transition fade wrapper ──
function PageFade({ keyName, children }) {
  const reduce = prefersReducedMotion();
  if (reduce) return children;
  return (
    <div key={keyName} style={{ animation: 'page-fade 150ms ease-out' }}>
      <style>{`@keyframes page-fade { from { opacity: 0; } to { opacity: 1; } }`}</style>
      {children}
    </div>
  );
}

// ── useTapCounter — debounced multi-tap detection (for wordmark admin unlock) ──
function useTapCounter({ target = 5, windowMs = 3000, onTrigger }) {
  const countRef = React.useRef(0);
  const timerRef = React.useRef(null);
  return React.useCallback(() => {
    countRef.current += 1;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { countRef.current = 0; }, windowMs);
    if (countRef.current >= target) {
      countRef.current = 0;
      clearTimeout(timerRef.current);
      onTrigger();
    }
  }, [target, windowMs, onTrigger]);
}

window.dateUtils = dateUtils;
window.EventLog = EventLog;
window.ErrorToast = ErrorToast;
window.SuccessBanner = SuccessBanner;
window.CheatSheet = CheatSheet;
window.HelpButton = HelpButton;
window.OfflineDot = OfflineDot;
window.prefersReducedMotion = prefersReducedMotion;
window.BreathingWordmark = BreathingWordmark;
window.PageFade = PageFade;
window.useTapCounter = useTapCounter;
