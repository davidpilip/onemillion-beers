// admin.jsx — Bartender Mode admin panel
// Triggered by tapping the wordmark 5x within 3s on Home.

function AdminPanel({ profile, onClose, onForceMilestone, onLogReset }) {
  const [count, setCount] = React.useState(0);
  const [memberCount, setMemberCount] = React.useState(0);
  const [lastLog, setLastLog] = React.useState(null);
  const [override, setOverride] = React.useState('');
  const [confirmReset, setConfirmReset] = React.useState(false);
  const [section, setSection] = React.useState('state');
  const [sponsor, setSponsor] = React.useState(null);
  const [feed, setFeed] = React.useState([]);
  const [events, setEvents] = React.useState([]);
  const [dbStats, setDbStats] = React.useState({ seed: 0, user: 0, total: 0 });

  const refresh = React.useCallback(async () => {
    const [c, m, lt, sp, ev, db] = await Promise.all([
      storage_util.get('community:count', true),
      storage_util.get('community:members', true),
      storage_util.get('beers:last_log_timestamp', true),
      resolveBeerOfWeek(),
      EventLog.read(),
      storage_util.get('beers:database', true),
    ]);
    setCount(c || 0); setMemberCount(m || 0); setLastLog(lt);
    setSponsor(sp);
    setEvents(ev || []);
    const all = db || [];
    setDbStats({
      seed: all.filter(b => b.source === 'seed' || !b.source).length,
      user: all.filter(b => b.source === 'user').length,
      total: all.length,
    });
    // Today's feed
    const utc = new Date().toISOString().slice(0, 10);
    const today = (await storage_util.get(`toasts:feed:${utc}`, true)) || [];
    setFeed(today);
  }, []);
  React.useEffect(() => { refresh(); }, [refresh]);

  return (
    <div style={{
      height: '100%', background: '#0d0a05',
      display: 'flex', flexDirection: 'column',
      animation: 'slide-up 250ms cubic-bezier(0.4,0,0.2,1)',
    }}>
      {/* Header */}
      <div style={{
        padding: '52px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(244,236,221,0.08)',
      }}>
        <div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#E07A5F',
            letterSpacing: '0.12em',
          }}>ADMIN</div>
          <div style={{
            fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 20,
            color: '#F4ECDD', letterSpacing: '-0.02em', marginTop: 1,
          }}>Bartender Mode</div>
        </div>
        <button onClick={onClose} aria-label="Close admin" style={{
          width: 36, height: 36, borderRadius: '50%',
          background: '#1A140C', border: '1px solid rgba(244,236,221,0.1)',
          color: '#F4ECDD', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><Icon name="x" size={18} /></button>
      </div>

      {/* Section tabs */}
      <div style={{
        display: 'flex', gap: 0, overflowX: 'auto', borderBottom: '1px solid rgba(244,236,221,0.08)',
      }}>
        {[
          { id: 'state', label: 'State' },
          { id: 'milestones', label: 'Milestones' },
          { id: 'sponsor', label: 'Sponsor' },
          { id: 'feed', label: 'Feed' },
          { id: 'beers', label: 'Beers' },
          { id: 'data', label: 'Data' },
          { id: 'about', label: 'About' },
        ].map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{
            padding: '10px 14px', background: 'none', border: 0,
            borderBottom: `2px solid ${section === s.id ? '#F4B73D' : 'transparent'}`,
            color: section === s.id ? '#F4B73D' : '#7A6B52',
            cursor: 'pointer', whiteSpace: 'nowrap',
            fontFamily: 'JetBrains Mono, monospace', fontWeight: 500, fontSize: 11,
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>{s.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 14 }}>
        {section === 'state' && (
          <AdminStateSection
            count={count} memberCount={memberCount} lastLog={lastLog}
            override={override} setOverride={setOverride}
            confirmReset={confirmReset} setConfirmReset={setConfirmReset}
            onChange={refresh}
          />
        )}
        {section === 'milestones' && (
          <AdminMilestonesSection onForce={onForceMilestone} />
        )}
        {section === 'sponsor' && sponsor && (
          <AdminSponsorSection sponsor={sponsor} onChange={refresh} />
        )}
        {section === 'feed' && (
          <AdminFeedSection feed={feed} onChange={refresh} />
        )}
        {section === 'beers' && (
          <AdminBeersSection stats={dbStats} onChange={refresh} />
        )}
        {section === 'data' && (
          <AdminDataSection onLogReset={onLogReset} />
        )}
        {section === 'about' && (
          <AdminAboutSection events={events} />
        )}
      </div>
    </div>
  );
}

// ── Tiny shared admin styles ──
const adminCard = {
  background: '#1A140C', border: '1px solid rgba(244,236,221,0.08)',
  borderRadius: 12, padding: 12, marginBottom: 10,
  fontFamily: 'Geist, system-ui',
};
const adminLabel = {
  fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#7A6B52',
  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6,
};
const adminInput = {
  width: '100%', padding: '8px 10px', boxSizing: 'border-box',
  background: '#0d0a05', border: '1px solid rgba(244,236,221,0.1)',
  borderRadius: 8, color: '#F4ECDD', outline: 'none',
  fontFamily: 'JetBrains Mono, monospace', fontSize: 12,
};
const adminBtn = (variant = 'default') => ({
  padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
  fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600,
  letterSpacing: '0.04em', border: 0,
  background: variant === 'danger' ? '#E07A5F' : variant === 'primary' ? '#F4B73D' : '#2E2415',
  color: variant === 'default' ? '#F4ECDD' : '#1A140C',
});

// ── State section ──
function AdminStateSection({ count, memberCount, lastLog, override, setOverride, confirmReset, setConfirmReset, onChange }) {
  const setCount = async () => {
    const n = parseInt(override, 10);
    if (isNaN(n) || n < 0) return;
    await storage_util.set('community:count', n, true);
    setOverride('');
    onChange();
  };
  const resetCount = async () => {
    if (!confirmReset) { setConfirmReset(true); setTimeout(() => setConfirmReset(false), 4000); return; }
    await storage_util.set('community:count', 0, true);
    await storage_util.set('beers:milestones_hit', [], true);
    setConfirmReset(false);
    onChange();
  };

  return (
    <div>
      <div style={adminCard}>
        <div style={adminLabel}>Global counter</div>
        <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 28, color: '#F4B73D', letterSpacing: '-0.03em' }}>
          {count.toLocaleString()}
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
          <input value={override} onChange={(e) => setOverride(e.target.value)} placeholder="new value" style={adminInput} />
          <button onClick={setCount} style={adminBtn('primary')}>Set</button>
        </div>
        <button onClick={resetCount} style={{ ...adminBtn(confirmReset ? 'danger' : 'default'), marginTop: 8, width: '100%' }}>
          {confirmReset ? 'Tap again to RESET TO 0' : 'Reset counter to 0'}
        </button>
      </div>

      <div style={adminCard}>
        <div style={adminLabel}>Member count</div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, color: '#F4ECDD' }}>{memberCount.toLocaleString()}</div>
      </div>

      <div style={adminCard}>
        <div style={adminLabel}>Last log timestamp</div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#B8A584' }}>
          {lastLog ? dateUtils.formatLong(lastLog) : 'never'}
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#7A6B52', marginTop: 4 }}>
          {lastLog ? `${dateUtils.timeAgo(lastLog)} ago` : ''}
        </div>
      </div>

      <div style={adminCard}>
        <div style={adminLabel}>Storage mode</div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#F4B73D' }}>{storage_util.mode}</div>
      </div>
    </div>
  );
}

// ── Milestone trigger section ──
function AdminMilestonesSection({ onForce }) {
  const list = [100000, 250000, 500000, 750000, 1000000];
  return (
    <div>
      <div style={{ ...adminCard, background: 'rgba(244,183,61,0.04)' }}>
        <div style={adminLabel}>Force overlay (local only)</div>
        <div style={{ fontSize: 11, color: '#B8A584', marginBottom: 10, lineHeight: 1.5 }}>
          Fires the milestone overlay for testing. Does not modify shared storage.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {list.map(m => (
            <button key={m} onClick={() => onForce(m)} style={adminBtn('primary')}>
              {shortNum(m)} overlay
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sponsor override section ──
function AdminSponsorSection({ sponsor, onChange }) {
  const [form, setForm] = React.useState({
    beer_name: sponsor.sponsor.beer_name,
    brewery: sponsor.sponsor.brewery,
    style: sponsor.sponsor.style,
    sponsor_message: sponsor.sponsor.sponsor_message,
    bar_partner: sponsor.sponsor.bar_partner || '',
  });
  const save = async () => {
    await storage_util.set(`beers:weekly_sponsor:${sponsor.weekKey}`, {
      ...form, bar_partner: form.bar_partner.trim() || null,
    }, true);
    onChange();
  };
  const revert = async () => {
    // Delete by setting to null then refresh — fallback storage uses LS which means setting null
    await storage_util.set(`beers:weekly_sponsor:${sponsor.weekKey}`, null, true);
    onChange();
  };
  return (
    <div>
      <div style={adminCard}>
        <div style={adminLabel}>Current week</div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#F4B73D' }}>{sponsor.weekKey}</div>
      </div>
      {['beer_name', 'brewery', 'style', 'sponsor_message', 'bar_partner'].map(k => (
        <div key={k} style={adminCard}>
          <div style={adminLabel}>{k.replace(/_/g, ' ')}</div>
          <input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} style={adminInput} />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        <button onClick={save} style={{ ...adminBtn('primary'), flex: 1 }}>Save override</button>
        <button onClick={revert} style={adminBtn('default')}>Revert</button>
      </div>
    </div>
  );
}

// ── Feed management ──
function AdminFeedSection({ feed, onChange }) {
  const del = async (id) => {
    const utc = new Date().toISOString().slice(0, 10);
    const key = `toasts:feed:${utc}`;
    const next = feed.filter(t => t.id !== id);
    await storage_util.set(key, next, true);
    onChange();
  };
  const clearAll = async () => {
    const utc = new Date().toISOString().slice(0, 10);
    await storage_util.set(`toasts:feed:${utc}`, [], true);
    onChange();
  };
  return (
    <div>
      <div style={{ ...adminCard, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={adminLabel}>Today's feed</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#F4ECDD' }}>{feed.length} toasts</div>
        </div>
        <button onClick={clearAll} style={adminBtn('danger')} disabled={feed.length === 0}>Clear all</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {feed.length === 0 && (
          <div style={{ ...adminCard, textAlign: 'center', color: '#7A6B52', fontSize: 11 }}>No toasts today.</div>
        )}
        {feed.map(t => (
          <div key={t.id} style={{
            ...adminCard, padding: 10, display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 0,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#7A6B52', letterSpacing: '0.04em' }}>
                M#{t.member_number} · {t.cheers_count || 0} cheers
              </div>
              <div style={{
                fontFamily: 'Geist, system-ui', fontSize: 12, color: '#F4ECDD', marginTop: 2,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{t.beer_name}</div>
            </div>
            <button onClick={() => del(t.id)} style={adminBtn('danger')}>Del</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Beers section ──
function AdminBeersSection({ stats, onChange }) {
  const [userBeers, setUserBeers] = React.useState([]);
  React.useEffect(() => {
    (async () => {
      const db = (await storage_util.get('beers:database', true)) || [];
      setUserBeers(db.filter(b => b.source === 'user'));
    })();
  }, []);
  const reseed = async () => {
    const existing = (await storage_util.get('beers:database', true)) || [];
    const keys = new Set(existing.map(b => b.id));
    const adds = (window.BEER_SEEDS || []).filter(b => !keys.has(b.id));
    if (adds.length) await storage_util.set('beers:database', [...existing, ...adds], true);
    onChange();
  };
  return (
    <div>
      <div style={{ ...adminCard, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <Stat label="Seed" value={stats.seed} />
        <Stat label="User" value={stats.user} />
        <Stat label="Total" value={stats.total} />
      </div>
      <button onClick={reseed} style={{ ...adminBtn('primary'), width: '100%', marginBottom: 12 }}>Re-seed missing entries</button>
      <div style={adminLabel}>User-added ({userBeers.length})</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {userBeers.length === 0 && (
          <div style={{ ...adminCard, textAlign: 'center', color: '#7A6B52', fontSize: 11 }}>None yet.</div>
        )}
        {userBeers.map(b => (
          <div key={b.id} style={{ ...adminCard, padding: 10, marginBottom: 0 }}>
            <div style={{ fontFamily: 'Geist, system-ui', fontSize: 12, color: '#F4ECDD' }}>{b.name}</div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#7A6B52' }}>
              by {b.brewery} · added by M#{b.added_by_member}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div style={adminLabel}>{label}</div>
      <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 20, color: '#F4B73D' }}>{value}</div>
    </div>
  );
}

// ── Data export ──
function AdminDataSection({ onLogReset }) {
  const [confirm, setConfirm] = React.useState(false);
  const exportMine = async () => {
    const [p, h, d, ce, ml, ev] = await Promise.all([
      storage_util.get('user:profile', false),
      storage_util.get('user:log_history', false),
      storage_util.get('user:daily_count', false),
      storage_util.get('user:cheered_toasts', false),
      storage_util.get('user:milestones_seen', false),
      EventLog.read(),
    ]);
    download(`1m-beers-personal-${Date.now()}.json`, { profile: p, history: h, daily: d, cheered_toasts: ce, milestones_seen: ml, events: ev });
  };
  const exportCommunity = async () => {
    const [c, m, mh, stats, sponsor] = await Promise.all([
      storage_util.get('community:count', true),
      storage_util.get('community:members', true),
      storage_util.get('beers:milestones_hit', true),
      storage_util.get('community:stats', true),
      resolveBeerOfWeek(),
    ]);
    download(`1m-beers-community-${Date.now()}.json`, {
      count: c, members: m, milestones_hit: mh, stats, sponsor,
    });
  };
  const reset = async () => {
    if (!confirm) { setConfirm(true); setTimeout(() => setConfirm(false), 4000); return; }
    // Clear all user:* via known keys
    for (const k of ['user:profile', 'user:log_history', 'user:daily_count', 'user:cheered_toasts', 'user:milestones_seen', 'user:cached_feed', 'user:cached_stats', 'user:event_log', 'user:admin_unlocked', 'user:cheered_milestones', 'user:dismissed_success_banner']) {
      await storage_util.set(k, null, false);
    }
    onLogReset();
  };
  return (
    <div>
      <div style={adminCard}>
        <div style={adminLabel}>Export</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button onClick={exportMine} style={adminBtn('primary')}>Export my data (JSON)</button>
          <button onClick={exportCommunity} style={adminBtn('default')}>Export community stats</button>
        </div>
      </div>
      <div style={{ ...adminCard, borderColor: 'rgba(224,122,95,0.3)' }}>
        <div style={{ ...adminLabel, color: '#E07A5F' }}>Reset</div>
        <div style={{ fontSize: 11, color: '#B8A584', marginBottom: 10, lineHeight: 1.5 }}>
          Wipes your personal keys and returns to onboarding. Community counter is unaffected.
        </div>
        <button onClick={reset} style={{ ...adminBtn(confirm ? 'danger' : 'default'), width: '100%' }}>
          {confirm ? 'Tap again to CONFIRM' : 'Reset my app'}
        </button>
      </div>
    </div>
  );
}

function download(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── About + event log ──
function AdminAboutSection({ events }) {
  const playClink = () => SoundManager.play('clink');
  return (
    <div>
      <div style={adminCard}>
        <div style={adminLabel}>Build</div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#F4ECDD' }}>1M Beers · v3.0 · Step 3</div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#7A6B52', marginTop: 2 }}>{new Date().toISOString()}</div>
      </div>
      <button onClick={playClink} style={{ ...adminBtn('primary'), width: '100%', marginBottom: 12 }}>🍻 Click me</button>
      <div style={adminLabel}>Event log ({events.length})</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 280, overflow: 'auto' }}>
        {events.length === 0 && (
          <div style={{ ...adminCard, textAlign: 'center', color: '#7A6B52', fontSize: 11, marginBottom: 0 }}>No events yet.</div>
        )}
        {events.slice(0, 50).map((e, i) => (
          <div key={i} style={{
            ...adminCard, padding: 8, marginBottom: 0,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
          }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#F4B73D', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {e.event}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#7A6B52', flexShrink: 0 }}>
              {dateUtils.timeAgo(e.timestamp)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function shortNum(n) {
  if (n >= 1000000) return (n / 1000000) + 'M';
  if (n >= 1000) return (n / 1000) + 'K';
  return String(n);
}

window.AdminPanel = AdminPanel;
