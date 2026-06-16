// toasts-feed.jsx — Public toasts feed with Cheers (upvote) system
//
// Reads from: toasts:feed:YYYY-MM-DD (shared, last 3 days), user:cheered_toasts (personal)
// Writes to:  user:cheered_toasts (toggle), toasts:cheers:{toast_id} (shared counter), feed entry's cheers_count (denorm)

function ToastsFeed({ profile, onOpenLog }) {
  const [tab, setTab] = React.useState('recent'); // recent | top_today | nearby
  const [toasts, setToasts] = React.useState(null); // null = loading
  const [cached, setCached] = React.useState([]);
  const [cheeredSet, setCheeredSet] = React.useState(new Set());
  const [refreshing, setRefreshing] = React.useState(false);

  // ── Load cached immediately, then fresh ──
  const load = React.useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      // Bulk fetch all toast:* rows in one query
      const rows = await storage_util.listFull('toast:', true);
      // Merge with legacy array-style entries
      const days = [0, 1, 2].map(offset => {
        const d = new Date(); d.setUTCDate(d.getUTCDate() - offset);
        return d.toISOString().slice(0, 10);
      });
      const arrays = await Promise.all(days.map(d => storage_util.get(`toasts:feed:${d}`, true).catch(() => null)));
      const legacy = arrays.flatMap(a => a || []);
      const seen = new Set(); const out = [];
      for (const t of [...rows.map(r => r.value), ...legacy]) {
        if (!t || !t.id || seen.has(t.id)) continue;
        out.push(t); seen.add(t.id);
      }
      out.sort((a, b) => Date.parse(b.posted_at || 0) - Date.parse(a.posted_at || 0));
      setToasts(out);
      await storage_util.set('user:cached_feed', out.slice(0, 60), false);
      const cheered = (await storage_util.get('user:cheered_toasts', false)) || [];
      setCheeredSet(new Set(cheered));
    } catch (e) { console.warn('[feed] load failed', e); }
    if (showRefresh) setTimeout(() => setRefreshing(false), 250);
  }, []);

  React.useEffect(() => {
    (async () => {
      const c = (await storage_util.get('user:cached_feed', false)) || [];
      setCached(c);
      load();
    })();
  }, [load]);

  // ── Poll every 10s while open ──
  React.useEffect(() => {
    const id = setInterval(() => { if (!document.hidden) load(); }, 10000);
    return () => clearInterval(id);
  }, [load]);

  // ── Cheers toggle ──
  const toggleCheers = async (toast) => {
    const cheered = (await storage_util.get('user:cheered_toasts', false)) || [];
    const has = cheered.includes(toast.id);
    const next = has ? cheered.filter(x => x !== toast.id) : [...cheered, toast.id];
    await storage_util.set('user:cheered_toasts', next, false);
    setCheeredSet(new Set(next));

    // optimistic local update
    setToasts(curr => (curr || []).map(t => t.id === toast.id
      ? { ...t, cheers_count: Math.max(0, (t.cheers_count || 0) + (has ? -1 : 1)) }
      : t
    ));

    // shared denorm — best-effort, increments the per-toast counter row
    const counterKey = `toasts:cheers:${toast.id}`;
    storage_util.incrementSharedCounter(counterKey, has ? -1 : 1);

    // Update the per-row toast (new schema) — eliminates array race
    const toastRow = await storage_util.get(`toast:${toast.id}`, true);
    if (toastRow) {
      await storage_util.set(`toast:${toast.id}`, {
        ...toastRow,
        cheers_count: Math.max(0, (toastRow.cheers_count || 0) + (has ? -1 : 1)),
      }, true);
    }
  };

  // ── Filter / sort ──
  const source = toasts !== null ? toasts : cached;
  const today = new Date().toISOString().slice(0, 10);
  const todayMs = Date.parse(today);
  const filtered = React.useMemo(() => {
    if (!source) return [];
    let arr = [...source];
    if (tab === 'top_today') {
      arr = arr
        .filter(t => Date.parse(t.posted_at.slice(0, 10)) === todayMs)
        .sort((a, b) => {
          const diff = (b.cheers_count || 0) - (a.cheers_count || 0);
          if (diff !== 0) return diff;
          return Date.parse(b.posted_at) - Date.parse(a.posted_at);
        });
    } else {
      // recent + nearby both sort by posted_at desc
      arr.sort((a, b) => Date.parse(b.posted_at) - Date.parse(a.posted_at));
    }
    return arr;
  }, [source, tab, todayMs]);

  const isEmpty = toasts !== null && toasts.length === 0 && cached.length === 0;
  const isLoadingFirstTime = toasts === null && cached.length === 0;

  return (
    <div style={{ paddingBottom: 110, position: 'relative' }}>
      {/* Top bar */}
      <div style={{ padding: '64px 20px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Eyebrow>Public feed</Eyebrow>
            <div style={{
              fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 30,
              color: '#F4ECDD', letterSpacing: '-0.03em', marginTop: 2,
            }}>Toasts</div>
          </div>
          <button onClick={() => load(true)} style={{
            width: 40, height: 40, borderRadius: '50%', background: '#241B10',
            border: '1px solid rgba(244,236,221,0.08)', color: '#F4ECDD', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 250ms',
            transform: refreshing ? 'rotate(360deg)' : 'rotate(0)',
          }}><Icon name="rotate" size={18} /></button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginTop: 16, padding: 4, background: '#241B10', borderRadius: 14, border: '1px solid rgba(244,236,221,0.07)' }}>
          {[
            { id: 'recent', label: 'Most recent' },
            { id: 'top_today', label: 'Top today' },
            { id: 'nearby', label: 'Nearby' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '10px 8px', borderRadius: 10,
              background: tab === t.id ? '#F4B73D' : 'transparent',
              color: tab === t.id ? '#1A140C' : '#B8A584',
              border: 0, cursor: 'pointer',
              fontFamily: 'Geist, system-ui', fontWeight: 600, fontSize: 12,
              transition: 'all 200ms',
            }}>{t.label}</button>
          ))}
        </div>

        {tab === 'nearby' && (
          <div style={{
            marginTop: 10, padding: '8px 12px', background: 'rgba(244,183,61,0.08)',
            border: '1px solid rgba(244,183,61,0.2)', borderRadius: 10,
            fontSize: 11.5, color: '#F4B73D', fontFamily: 'Geist, system-ui',
          }}>Nearby filter coming soon · showing recent for now</div>
        )}
      </div>

      {/* Refresh indicator */}
      {refreshing && (
        <div style={{
          padding: '6px 20px',
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#F4B73D',
          letterSpacing: '0.12em', textAlign: 'center',
        }}>POURING FRESH TOASTS…</div>
      )}

      {/* Feed */}
      <div style={{ padding: '6px 20px' }}>
        {isLoadingFirstTime && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} w="100%" h={140} r={20} />)}
          </div>
        )}

        {isEmpty && (
          <EmptyToastsState onOpenLog={onOpenLog} />
        )}

        {!isLoadingFirstTime && !isEmpty && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((t, i) => (
              <PublicToastCard
                key={t.id}
                toast={t}
                rank={tab === 'top_today' && i < 3 ? i + 1 : null}
                cheered={cheeredSet.has(t.id)}
                onCheers={() => toggleCheers(t)}
                isMine={t.member_number === profile.member_number}
              />
            ))}
            {filtered.length === 0 && tab === 'top_today' && (
              <div style={{
                padding: 28, background: '#241B10', borderRadius: 18,
                border: '1px dashed rgba(244,236,221,0.12)',
                textAlign: 'center', color: '#B8A584', fontSize: 13, fontFamily: 'Geist, system-ui',
              }}>Quiet day so far. Make some noise.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Empty state ──
function EmptyToastsState({ onOpenLog }) {
  return (
    <div style={{
      padding: '36px 20px', background: '#241B10', borderRadius: 22,
      border: '1px dashed rgba(244,236,221,0.12)',
      textAlign: 'center',
    }}>
      <svg width="80" height="80" viewBox="0 0 80 80" style={{ margin: '0 auto 16px', display: 'block' }}>
        {/* Tipped glass illustration */}
        <g transform="rotate(35, 40, 50)">
          <path d="M22 22 L58 22 L52 70 L28 70 Z" fill="rgba(244,236,221,0.04)" stroke="#7A6B52" strokeWidth="2" strokeLinejoin="round" />
          <path d="M22 22 Q28 14 36 18 Q44 12 50 18 Q56 14 58 22" fill="rgba(255,246,224,0.1)" stroke="#7A6B52" strokeWidth="1.5" />
        </g>
        {/* puddle */}
        <ellipse cx="50" cy="74" rx="14" ry="3" fill="rgba(244,183,61,0.25)" />
      </svg>
      <div style={{
        fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 22,
        color: '#F4ECDD', letterSpacing: '-0.02em', marginBottom: 6,
      }}>Be the first to toast</div>
      <div style={{ fontSize: 13, color: '#B8A584', marginBottom: 18, lineHeight: 1.5, fontFamily: 'Geist, system-ui' }}>
        Pour the first one. The community is waiting.
      </div>
      <div style={{ maxWidth: 240, margin: '0 auto' }}>
        <Btn onClick={onOpenLog}>Log a beer</Btn>
      </div>
    </div>
  );
}

// ── Member avatar (initials = M{num}) ──
function MemberAvatar({ memberNumber, size = 40 }) {
  // deterministic hue per member
  const hue = ((memberNumber || 0) * 47) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `hsl(${hue}, 45%, 32%)`,
      border: '1.5px solid rgba(244,236,221,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
      fontSize: size * 0.32, color: '#F4ECDD', letterSpacing: '0.02em',
    }}>M{memberNumber || '?'}</div>
  );
}

// ── Public Toast Card ──
function PublicToastCard({ toast, rank, cheered, onCheers, isMine }) {
  const when = timeAgo(Date.parse(toast.posted_at));
  return (
    <div style={{
      background: '#241B10', borderRadius: 20, padding: 14,
      border: rank === 1 ? '1.5px solid rgba(244,183,61,0.5)' : '1px solid rgba(244,236,221,0.07)',
      position: 'relative',
    }}>
      {rank && (
        <div style={{
          position: 'absolute', top: -10, left: 14,
          display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
          background: rank === 1 ? '#F4B73D' : rank === 2 ? '#D97F2C' : '#7A6B52',
          borderRadius: 999, color: '#1A140C',
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700,
          letterSpacing: '0.06em',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          <Icon name="trophy" size={11} strokeWidth={2.4} /> #{rank}
        </div>
      )}

      {/* Header row */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
        <MemberAvatar memberNumber={toast.member_number} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 600, fontSize: 14,
            color: '#F4ECDD', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            Member #{toast.member_number}
            {isMine && (
              <span style={{
                fontSize: 9, padding: '2px 6px', borderRadius: 4,
                background: 'rgba(244,183,61,0.15)', color: '#F4B73D',
                fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em',
              }}>YOU</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: '#7A6B52', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em', marginTop: 1 }}>
            {when.toUpperCase()} AGO
          </div>
        </div>
        <button style={{
          background: 'none', border: 0, color: '#7A6B52', cursor: 'pointer',
          padding: 4,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
          </svg>
        </button>
      </div>

      {/* Photo */}
      {toast.photo_data && (
        <img src={toast.photo_data} alt="" style={{
          width: '100%', maxHeight: 240, objectFit: 'cover',
          borderRadius: 14, marginBottom: 12, display: 'block',
        }} />
      )}

      {/* Beer info row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <StarRow value={toast.rating || 0} size={13} gap={1} />
      </div>
      <div style={{
        fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 18,
        color: '#F4ECDD', letterSpacing: '-0.02em', marginBottom: 2,
      }}>{toast.beer_name}</div>
      <div style={{ fontSize: 12, color: '#B8A584', marginBottom: toast.toast_text ? 10 : 12, fontFamily: 'Geist, system-ui' }}>
        {toast.brewery} · {toast.style}
        {toast.venue_name && (
          <> · <span style={{ color: '#F4B73D' }}><Icon name="pin" size={11} style={{ display: 'inline', verticalAlign: -1 }} /> {toast.venue_name}</span></>
        )}
      </div>

      {/* Toast text */}
      {toast.toast_text && (
        <div style={{
          fontFamily: 'Geist, system-ui', fontSize: 14, color: '#F4ECDD',
          lineHeight: 1.5, marginBottom: 12,
        }}>"{toast.toast_text}"</div>
      )}

      {/* Actions */}
      <div style={{
        display: 'flex', gap: 6, paddingTop: 10,
        borderTop: '1px solid rgba(244,236,221,0.06)',
      }}>
        <CheersButton count={toast.cheers_count || 0} cheered={cheered} onClick={onCheers} />
        <ActionBtn icon="bell" label="Reply" onClick={() => alert('Replies coming in v2')} />
        <ActionBtn icon="arrowUp" label="Share" onClick={() => {
          navigator.clipboard?.writeText(`1mbeers://toast/${toast.id}`);
        }} />
      </div>
    </div>
  );
}

// ── Generic action button ──
function ActionBtn({ icon, label, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '8px 10px', background: 'transparent',
      border: 0, color: '#B8A584', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
      fontFamily: 'Geist, system-ui', fontWeight: 600, fontSize: 12, borderRadius: 10,
      transition: 'background 150ms',
    }}
    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(244,236,221,0.04)'}
    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <Icon name={icon} size={14} /> {label}
    </button>
  );
}

// ── Cheers Button — tilts, pours, +1 particle ──
function CheersButton({ count, cheered, onClick }) {
  const [animState, setAnimState] = React.useState(null); // 'cheers' | 'uncheers' | null
  const [particles, setParticles] = React.useState([]);

  const handle = () => {
    const wasC = cheered;
    if (!wasC) { try { SoundManager.play('ting'); haptic(8); } catch {} }
    setAnimState(wasC ? 'uncheers' : 'cheers');
    setTimeout(() => setAnimState(null), 600);
    const pid = Math.random();
    setParticles(p => [...p, { id: pid, text: wasC ? '−1' : '+1', up: !wasC }]);
    setTimeout(() => setParticles(p => p.filter(x => x.id !== pid)), 700);
    onClick();
  };

  return (
    <button onClick={handle} style={{
      flex: 1, padding: '8px 10px',
      background: cheered ? 'rgba(244,183,61,0.14)' : 'transparent',
      border: `1px solid ${cheered ? 'rgba(244,183,61,0.4)' : 'rgba(244,236,221,0.1)'}`,
      borderRadius: 10, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      color: cheered ? '#F4B73D' : '#B8A584',
      fontFamily: 'Geist, system-ui', fontWeight: 600, fontSize: 12,
      transition: 'all 200ms', position: 'relative',
    }}>
      <style>{`
        @keyframes cheers-pour { 0% { transform: rotate(0) scale(1); } 35% { transform: rotate(15deg) scale(1.25); } 70% { transform: rotate(-5deg) scale(1.1); } 100% { transform: rotate(0) scale(1); } }
        @keyframes uncheers-tip { 0% { transform: rotate(0) scale(1); } 40% { transform: rotate(-12deg) scale(0.88); } 100% { transform: rotate(0) scale(1); } }
        @keyframes particle-up { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-26px); opacity: 0; } }
        @keyframes particle-down { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(14px); opacity: 0; } }
      `}</style>
      <div style={{
        animation: animState === 'cheers' ? 'cheers-pour 0.5s cubic-bezier(0.34,1.56,0.64,1)'
                 : animState === 'uncheers' ? 'uncheers-tip 0.4s ease-in-out' : 'none',
        display: 'flex', alignItems: 'center',
      }}>
        <Icon name="beer" size={15} filled={cheered} color={cheered ? '#F4B73D' : 'currentColor'} strokeWidth={cheered ? 0 : 2} />
      </div>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{count > 0 ? count : 'Cheers'}</span>
      {/* Particles */}
      {particles.map(p => (
        <span key={p.id} style={{
          position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 11,
          color: '#F4B73D', pointerEvents: 'none',
          animation: `${p.up ? 'particle-up' : 'particle-down'} 0.6s ease-out forwards`,
        }}>{p.text}</span>
      ))}
    </button>
  );
}

window.ToastsFeed = ToastsFeed;
window.PublicToastCard = PublicToastCard;
window.CheersButton = CheersButton;
window.MemberAvatar = MemberAvatar;
