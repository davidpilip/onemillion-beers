// home.jsx — Home screen with live counter, polling, breakdown, and CTA

function HomeScreen({ profile, onNavigate, onOpenLog, onOpenLogWithBeer, onTab, onWordmarkTap, successBanner, onDismissBanner, liveCount, theme = 'amber' }) {
  const handleWordmarkTap = useTapCounter({ target: 5, windowMs: 3000, onTrigger: onWordmarkTap || (() => {}) });
  const [count, setCount] = React.useState(0);
  const [memberCount, setMemberCount] = React.useState(0);
  const [todayLogged, setTodayLogged] = React.useState(0);
  const [recentLogs, setRecentLogs] = React.useState([]);
  const [hydrated, setHydrated] = React.useState(false);
  const [lastLogTs, setLastLogTs] = React.useState(null);
  const [missedMilestone, setMissedMilestone] = React.useState(null);
  const goal = 1000000;

  // Initial load + polling every 8s (per spec; tab-visible only)
  React.useEffect(() => {
    let alive = true;
    let timer;

    const load = async () => {
      const [c, m, daily, lastTs, hits, seen] = await Promise.all([
        storage_util.get('community:count', true),
        storage_util.get('community:members', true),
        storage_util.get('user:daily_count', false),
        storage_util.get('beers:last_log_timestamp', true),
        storage_util.get('beers:milestones_hit', true),
        storage_util.get('user:milestones_seen', false),
      ]);
      if (!alive) return;
      // Pull recent toasts from the new per-row schema (toast:* keys)
      const toastRows = await storage_util.listFull('toast:', true);
      const recent = toastRows.map(r => r.value).filter(Boolean)
        .sort((a, b) => Date.parse(b.posted_at || 0) - Date.parse(a.posted_at || 0))
        .slice(0, 3);
      setCount(c || 0);
      setMemberCount(m || 0);
      const today = uiHelpers.todayLocalISO();
      setTodayLogged(daily?.date === today ? daily.count : 0);
      setRecentLogs(recent);
      setLastLogTs(lastTs || null);

      // Check for missed milestone (hit within last 24h, not seen by user)
      const seenSet = new Set(seen || []);
      const recent24h = (hits || []).filter(h => Date.now() - h.hit_at < 86400000 && !seenSet.has(h.milestone));
      // Show the most recent missed milestone
      const newest = recent24h.sort((a, b) => b.hit_at - a.hit_at)[0];
      setMissedMilestone(newest || null);

      setHydrated(true);
    };

    load();
    const tick = () => { if (!document.hidden) load(); timer = setTimeout(tick, 8000); };
    timer = setTimeout(tick, 8000);
    const onVis = () => { if (!document.hidden) load(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { alive = false; clearTimeout(timer); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  const pct = Math.min(100, (count / goal) * 100);
  const isDormant = lastLogTs && (Date.now() - lastLogTs) > 12 * 3600 * 1000;

  const dismissBanner = async () => {
    if (!missedMilestone) return;
    const seen = (await storage_util.get('user:milestones_seen', false)) || [];
    if (!seen.includes(missedMilestone.milestone)) seen.push(missedMilestone.milestone);
    await storage_util.set('user:milestones_seen', seen, false);
    setMissedMilestone(null);
  };

  return (
    <div style={{ paddingBottom: 110, fontFamily: 'Geist, system-ui' }}>
      {/* Header */}
      <div style={{
        padding: '64px 20px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <BreathingWordmark onTap={handleWordmarkTap}>1M Beers</BreathingWordmark>
          <div style={{
            fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 20,
            color: '#F4ECDD', letterSpacing: '-0.02em', marginTop: 2,
          }}>Hey {profile?.handle || 'friend'} 🍻</div>
        </div>
        <button onClick={() => onNavigate('settings')} aria-label="Settings" style={{
          width: 40, height: 40, borderRadius: '50%', background: '#241B10',
          border: '1px solid rgba(244,236,221,0.08)', color: '#F4ECDD', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><Icon name="settings" size={18} /></button>
      </div>

      {/* Success banner from recent milestone */}
      {successBanner && (
        <SuccessBanner
          milestone={successBanner.milestone}
          count={liveCount || count}
          onDismiss={onDismissBanner}
        />
      )}

      {/* Missed milestone banner */}
      {missedMilestone && (
        <MilestoneBanner
          milestone={missedMilestone.milestone}
          hitAt={missedMilestone.hit_at}
          onDismiss={dismissBanner}
        />
      )}

      {/* Hero counter card */}
      <div style={{ padding: '0 20px', position: 'relative' }}>
        <DormancyTicker isDormant={isDormant} />
        <div style={{
          background: 'linear-gradient(155deg, #2E2415 0%, #241B10 100%)',
          border: '1px solid rgba(244,183,61,0.18)',
          borderRadius: 28, padding: 24, position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative glass */}
          <div style={{ position: 'absolute', right: -10, top: -10, opacity: 0.5 }}>
            <PintGlass size={70} fill={Math.min(0.95, pct / 100 + 0.05)} />
          </div>

          <Eyebrow style={{ color: isDormant ? '#7A6B52' : '#F4B73D' }}>
            {isDormant ? 'QUIET HOURS — KEEP IT GOING' : 'The world has poured'}
          </Eyebrow>
          {hydrated ? (
            <div style={{
              fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 56,
              color: '#F4ECDD', letterSpacing: '-0.04em', lineHeight: 1, marginTop: 10,
              fontVariantNumeric: 'tabular-nums',
            }}><CountUp value={count} /></div>
          ) : (
            <div style={{ marginTop: 10 }}><Skeleton w={220} h={56} r={12} /></div>
          )}
          <div style={{
            fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 600, fontSize: 18,
            color: '#F4ECDD', opacity: 0.85, marginTop: 4, letterSpacing: '-0.01em',
          }}>beers · together</div>

          {/* Progress */}
          <div style={{ marginTop: 22, position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 12, color: '#B8A584', marginBottom: 8, fontFamily: 'Geist, system-ui',
            }}>
              <span>{pct.toFixed(3)}% to 1M</span>
              <span>{uiHelpers.fmtNum(goal - count)} left</span>
            </div>
            <div style={{ height: 10, background: 'rgba(244,236,221,0.07)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${Math.max(2, pct)}%`,
                background: 'linear-gradient(90deg, #D97F2C, #F4B73D)',
                borderRadius: 999, transition: 'width 800ms cubic-bezier(0.4,0,0.2,1)',
              }} />
            </div>
          </div>

          {/* Stats row */}
          <div style={{
            marginTop: 18, display: 'flex', gap: 14,
            paddingTop: 16, borderTop: '1px solid rgba(244,236,221,0.08)',
          }}>
            <MiniStat label="Members" value={memberCount || 1} />
            <MiniStat label="Your logs today" value={`${todayLogged}/5`} />
            <MiniStat label="Member #" value={`#${profile?.member_number || '—'}`} mono />
          </div>
        </div>
      </div>

      {/* Primary CTA */}
      <div style={{ padding: '20px 20px 8px' }}>
        <button onClick={onOpenLog} style={{
          width: '100%', height: 76, borderRadius: 22, padding: '0 22px',
          background: '#F4B73D', color: '#1A140C', border: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontFamily: 'Bricolage Grotesque, system-ui',
          boxShadow: '0 12px 30px rgba(244,183,61,0.22)',
          transition: 'transform 150ms',
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.985)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em' }}>Log a beer</div>
            <div style={{ fontFamily: 'Geist, system-ui', fontSize: 12.5, fontWeight: 500, opacity: 0.7, marginTop: 2 }}>
              {todayLogged < 5 ? `${5 - todayLogged} left today` : 'cap hit — see you tomorrow'}
            </div>
          </div>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'rgba(26,20,12,0.16)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}><Icon name="plus" size={26} strokeWidth={2.5} /></div>
        </button>
      </div>

      {/* Beer of the Week */}
      <SectionHeader title="Featured" />
      <div style={{ padding: '0 20px 8px' }}>
        <BeerOfTheWeekCard onLog={(b) => onOpenLogWithBeer && onOpenLogWithBeer(b)} />
      </div>

      {/* Fresh toasts preview */}
      <SectionHeader
        title="Fresh toasts"
        subtitle={`from the world · ${memberCount.toLocaleString()} members`}
        action={
          <button onClick={() => onTab && onTab('toasts')} style={{
            background: 'none', border: 0, color: '#F4B73D', cursor: 'pointer',
            fontFamily: 'Geist, system-ui', fontWeight: 600, fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 2,
          }}>See all <Icon name="chevronRight" size={14} /></button>
        }
      />
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {recentLogs.length === 0 && hydrated && (
          <EmptyHint text="No toasts yet. Be the first to raise one." />
        )}
        {!hydrated && Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} w="100%" h={64} r={14} />
        ))}
        {recentLogs.map((log, i) => (
          <CompactToastRow key={i} log={log} onClick={() => onTab && onTab('toasts')} />
        ))}
      </div>

      {/* Breweries near you link */}
      <div style={{ padding: '14px 20px 0' }}>
        <button onClick={() => onNavigate && onNavigate('breweries')} style={{
          width: '100%', padding: '14px 16px', borderRadius: 16,
          background: '#241B10', border: '1px solid rgba(244,236,221,0.08)',
          color: '#F4ECDD', cursor: 'pointer', textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: 12,
          fontFamily: 'Geist, system-ui',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(244,183,61,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}><Icon name="pin" size={18} color="#F4B73D" /></div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 600, fontSize: 14,
              color: '#F4ECDD',
            }}>Breweries near you</div>
            <div style={{ fontSize: 11.5, color: '#B8A584', marginTop: 1 }}>Partner deals · local pours</div>
          </div>
          <Icon name="chevronRight" size={16} color="#7A6B52" />
        </button>
      </div>

      {/* Breakdown chips */}
      <SectionHeader title="What folks are drinking" />
      <BreakdownGrid />
    </div>
  );
}

function MiniStat({ label, value, mono }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{
        fontFamily: mono ? 'JetBrains Mono, monospace' : 'Bricolage Grotesque, system-ui',
        fontWeight: 700, fontSize: 17, color: '#F4ECDD',
        letterSpacing: mono ? 0 : '-0.02em',
      }}>{typeof value === 'number' ? uiHelpers.fmtNum(value) : value}</div>
      <div style={{ fontSize: 10.5, color: '#B8A584', marginTop: 2, fontFamily: 'Geist, system-ui' }}>{label}</div>
    </div>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ padding: '24px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <div>
        <div style={{
          fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 22,
          color: '#F4ECDD', letterSpacing: '-0.02em',
        }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 12.5, color: '#B8A584', marginTop: 2, fontFamily: 'Geist, system-ui' }}>{subtitle}</div>
        )}
      </div>
      {action}
    </div>
  );
}

// Compact row used in Home's Fresh toasts preview — tap navigates to Toasts tab
function CompactToastRow({ log, onClick }) {
  const member = log.member_no || log.member_number || '?';
  const snippet = (log.toast || log.toast_text || '').slice(0, 80);
  return (
    <button onClick={onClick} style={{
      width: '100%', background: '#241B10', borderRadius: 14, padding: 12,
      border: '1px solid rgba(244,236,221,0.07)', cursor: 'pointer',
      display: 'flex', gap: 10, alignItems: 'center', textAlign: 'left',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: `hsl(${(member * 47) % 360}, 45%, 32%)`,
        border: '1.5px solid rgba(244,236,221,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 9,
        color: '#F4ECDD',
      }}>M{member}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 1 }}>
          <span style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 13, color: '#F4ECDD', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.beer_name}</span>
          {log.rating > 0 && <StarRow value={log.rating} size={9} gap={1} />}
        </div>
        {snippet ? (
          <div style={{ fontSize: 11.5, color: '#B8A584', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'Geist, system-ui' }}>
            "{snippet}{(log.toast || log.toast_text || '').length > 80 ? '…' : ''}"
          </div>
        ) : (
          <div style={{ fontSize: 11, color: '#7A6B52', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em' }}>{timeAgo(log.ts || Date.parse(log.posted_at || 0))} AGO</div>
        )}
      </div>
      <Icon name="chevronRight" size={14} color="#7A6B52" />
    </button>
  );
}

function EmptyHint({ text }) {
  return (
    <div style={{
      padding: '24px 16px', background: '#241B10', borderRadius: 18,
      border: '1px dashed rgba(244,236,221,0.12)',
      textAlign: 'center', color: '#B8A584', fontSize: 13,
      fontFamily: 'Geist, system-ui',
    }}>{text}</div>
  );
}

function ToastCard({ log }) {
  // log: { beer_name, brewery, style, rating, toast, handle, member_no, ts, photo? }
  const when = log.ts ? timeAgo(log.ts) : 'just now';
  return (
    <div style={{
      background: '#241B10', borderRadius: 18, padding: 14,
      border: '1px solid rgba(244,236,221,0.07)',
      display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      {log.photo ? (
        <img src={log.photo} alt="" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{
          width: 48, height: 48, borderRadius: 12, flexShrink: 0,
          background: `linear-gradient(135deg, ${uiHelpers.beerTone(log.style)[0]}, ${uiHelpers.beerTone(log.style)[1]})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'inset 0 -8px 12px rgba(0,0,0,0.18)',
        }}><Icon name="beer" size={22} color="#F4ECDD" /></div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
          <div style={{
            fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 600, fontSize: 15,
            color: '#F4ECDD', letterSpacing: '-0.01em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{log.handle || 'someone'}</div>
          <div style={{ fontSize: 11, color: '#7A6B52', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>{when}</div>
        </div>
        <div style={{ fontSize: 12, color: '#B8A584', marginBottom: 6, fontFamily: 'Geist, system-ui' }}>
          on <span style={{ color: '#F4B73D', fontWeight: 600 }}>{log.beer_name}</span>
          {log.rating ? <> · <span style={{ verticalAlign: 'middle' }}>{Array.from({ length: log.rating }, () => '★').join('')}</span></> : null}
        </div>
        {log.toast && (
          <div style={{ fontSize: 13.5, color: '#F4ECDD', lineHeight: 1.45, fontFamily: 'Geist, system-ui' }}>
            "{log.toast}"
          </div>
        )}
      </div>
    </div>
  );
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24); return `${d}d`;
}

// ── Breakdown grid: computed live from logs:anonymized:* (no race) ──
function BreakdownGrid() {
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    let alive = true;
    let timer;
    const compute = async () => {
      // Bulk fetch — much faster than N round-trips
      const rows = await storage_util.listFull('logs:anonymized:', true);
      const logs = rows.map(r => r.value).filter(l => l && l.ts);
      const now = Date.now();
      const dayAgo = now - 86400000;
      // Aggregate
      const styles = {};
      const regions = {};
      let sumRating = 0, countRating = 0, last24h = 0;
      for (const l of logs) {
        if (!l.ts) continue;
        const sb = window.bucketStyle ? window.bucketStyle(l.style) : 'Other';
        styles[sb] = (styles[sb] || 0) + 1;
        const rb = window.bucketRegion ? window.bucketRegion(l.region) : 'Intl';
        regions[rb] = (regions[rb] || 0) + 1;
        if (l.rating > 0) { sumRating += l.rating; countRating++; }
        if (l.ts > dayAgo) last24h++;
      }
      if (!alive) return;
      setData({
        styles: Object.keys(styles).length ? styles : { 'IPA': 0, 'Lager': 0, 'Stout': 0, 'Pils': 0, 'Sour': 0 },
        regions: Object.keys(regions).length ? regions : { 'West': 0, 'NE': 0, 'South': 0, 'MW': 0, 'Intl': 0 },
        avg_rating: countRating ? sumRating / countRating : 0,
        last_24h: last24h,
        total: logs.length,
      });
    };
    compute();
    const poll = () => { if (!document.hidden) compute(); timer = setTimeout(poll, 12000); };
    timer = setTimeout(poll, 12000);
    return () => { alive = false; clearTimeout(timer); };
  }, []);

  if (!data) {
    return (
      <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} w="100%" h={130} r={18} />)}
      </div>
    );
  }

  const styleEntries = Object.entries(data.styles).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const regionEntries = Object.entries(data.regions).sort((a, b) => b[1] - a[1]);
  const styleMax = Math.max(1, ...styleEntries.map(e => e[1]));
  const regionTotal = Math.max(1, regionEntries.reduce((a, [, v]) => a + v, 0));

  return (
    <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <MiniCard title="By style" subtitle="all-time">
        {styleEntries.every(([, v]) => v === 0) ? (
          <EmptyMini>Log to start the chart</EmptyMini>
        ) : (
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 6, height: 60 }}>
            {styleEntries.map(([k, v], i) => (
              <div key={k} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 4, height: '100%' }}>
                <div style={{
                  width: '100%', height: `${Math.max(v / styleMax * 44, 4)}px`,
                  background: i === 0 ? '#F4B73D' : '#D97F2C',
                  opacity: i === 0 ? 1 : 0.55, borderRadius: 4,
                }} />
                <div style={{ fontSize: 8.5, color: '#B8A584', letterSpacing: -0.1, fontFamily: 'Geist, system-ui' }}>{k.slice(0, 5)}</div>
              </div>
            ))}
          </div>
        )}
      </MiniCard>
      <MiniCard title="By region" subtitle="this week">
        {regionEntries.every(([, v]) => v === 0) ? (
          <EmptyMini>—</EmptyMini>
        ) : (
          <RegionDonut entries={regionEntries} total={regionTotal} />
        )}
      </MiniCard>
      <MiniCard title="Avg rating" subtitle="community">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 60 }}>
          <div style={{
            fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 32,
            color: '#F4ECDD', letterSpacing: '-0.04em',
          }}>{(data.avg_rating || 0).toFixed(1)}</div>
          <Icon name="star" size={24} filled color="#F4B73D" />
        </div>
      </MiniCard>
      <MiniCard title="Last 24h" subtitle="beers poured">
        <div style={{ height: 60, display: 'flex', alignItems: 'center' }}>
          <div style={{
            fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 32,
            color: '#F4B73D', letterSpacing: '-0.04em',
          }}><CountUp value={data.last_24h || 0} /></div>
        </div>
      </MiniCard>
    </div>
  );
}

function MiniCard({ title, subtitle, children }) {
  return (
    <div style={{
      background: '#241B10', border: '1px solid rgba(244,236,221,0.07)',
      borderRadius: 18, padding: 14, display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div>
        <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 13.5, color: '#F4ECDD' }}>{title}</div>
        <div style={{ fontSize: 10, color: '#B8A584', marginTop: 1, fontFamily: 'Geist, system-ui' }}>{subtitle}</div>
      </div>
      {children}
    </div>
  );
}
function EmptyMini({ children }) {
  return <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7A6B52', fontSize: 11.5, fontFamily: 'Geist, system-ui', textAlign: 'center' }}>{children}</div>;
}

function RegionDonut({ entries, total }) {
  const colors = ['#F4B73D', '#D97F2C', '#FFF6E0', '#87C66B', '#7A6B52'];
  let acc = 0;
  const r = 22, c = 28;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx={c} cy={c} r={r} fill="none" stroke="#2E2415" strokeWidth="8" />
        {entries.map(([, v], i) => {
          const frac = v / total; if (!frac) return null;
          const len = frac * 2 * Math.PI * r;
          const start = (acc / total) * 2 * Math.PI * r;
          acc += v;
          return (
            <circle key={i} cx={c} cy={c} r={r} fill="none"
              stroke={colors[i % colors.length]} strokeWidth="8"
              strokeDasharray={`${len} ${2 * Math.PI * r - len}`}
              strokeDashoffset={-start}
              transform={`rotate(-90 ${c} ${c})`}
            />
          );
        })}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2.5, fontSize: 9.5, fontFamily: 'Geist, system-ui' }}>
        {entries.slice(0, 3).map(([k, v], i) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#B8A584' }}>
            <div style={{ width: 7, height: 7, borderRadius: 2, background: colors[i] }} />
            {k} {Math.round(v/total*100)}%
          </div>
        ))}
      </div>
    </div>
  );
}

window.HomeScreen = HomeScreen;
window.ToastCard = ToastCard;
window.timeAgo = timeAgo;
