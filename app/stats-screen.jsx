// stats-screen.jsx — Real community aggregates pulled from logs:anonymized:{*}
//
// Caches computed aggregates to user:cached_stats for 5 minutes.
// Pure aggregate function: computeAggregates(logs, weekFilter)

function computeAggregates(logs, weekFilter = false) {
  const now = Date.now();
  const weekAgo = now - 7 * 86400000;
  const filtered = weekFilter ? logs.filter(l => l.ts >= weekAgo) : logs;

  // Top styles
  const styles = {};
  const beers = {};
  const breweries = new Set();
  const regions = {};
  const ratings = [0, 0, 0, 0, 0]; // index 0 = 1-star, ...
  let ratingSum = 0; let ratingCount = 0;

  for (const l of filtered) {
    if (l.style) styles[l.style] = (styles[l.style] || 0) + 1;
    const beerKey = `${l.beer_name}::${l.brewery}`;
    if (l.beer_name) beers[beerKey] = (beers[beerKey] || 0) + 1;
    if (l.brewery) breweries.add(l.brewery);
    const r = bucketRegion(l.region);
    regions[r] = (regions[r] || 0) + 1;
    if (l.rating >= 1 && l.rating <= 5) {
      ratings[l.rating - 1]++;
      ratingSum += l.rating; ratingCount++;
    }
  }

  const topStyles = Object.entries(styles).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const topBeers = Object.entries(beers).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => {
    const [name, brewery] = k.split('::'); return { name, brewery, count: v };
  });
  const regionEntries = Object.entries(regions).sort((a, b) => b[1] - a[1]);

  // Unique beer count
  const uniqueBeers = Object.keys(beers).length;

  return {
    total: filtered.length,
    topStyles, topBeers, regions: regionEntries,
    ratings, avgRating: ratingCount ? ratingSum / ratingCount : 0,
    uniqueBeers, breweries: breweries.size,
    regionCount: regionEntries.length,
  };
}

function StatsScreen({ profile, onOpenLog, onOpenHistory }) {
  const [data, setData] = React.useState(null); // { week, allTime, count, ts }
  const [tab, setTab] = React.useState('week'); // week | all_time
  const [hydrating, setHydrating] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      // 1. Check cache (30s freshness — stats need to feel near-live)
      const cached = await storage_util.get('user:cached_stats', false);
      if (cached && (Date.now() - cached.ts) < 30 * 1000) {
        setData(cached);
      }
      setHydrating(true);
      // 2. Bulk fetch all logs:anonymized:* rows in one query
      const rows = await storage_util.listFull('logs:anonymized:', true);
      const logs = rows.map(r => r.value).filter(l => l && l.ts);
      const count = (await storage_util.get('community:count', true)) || 0;
      const computed = {
        ts: Date.now(),
        count,
        week: computeAggregates(logs, true),
        allTime: computeAggregates(logs, false),
        logs,
      };
      setData(computed);
      await storage_util.set('user:cached_stats', computed, false);
    } catch (e) {
      console.warn('[stats] load failed', e);
      // Provide a non-crashing fallback so the page still renders
      if (!data) setData({
        ts: Date.now(), count: 0, logs: [],
        week: computeAggregates([], true),
        allTime: computeAggregates([], false),
      });
    } finally {
      setHydrating(false);
    }
  }, []); // eslint-disable-line

  // Poll fresh data every 15s
  React.useEffect(() => {
    const id = setInterval(() => { if (!document.hidden) load(); }, 15000);
    return () => clearInterval(id);
  }, [load]);

  React.useEffect(() => { load(); }, [load]);

  if (!data) {
    return (
      <div style={{ paddingBottom: 110 }}>
        <div style={{ padding: '64px 20px 18px' }}>
          <Eyebrow>The numbers</Eyebrow>
          <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 30, color: '#F4ECDD', letterSpacing: '-0.03em', marginTop: 2 }}>Stats</div>
        </div>
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} w="100%" h={140} r={20} />)}
        </div>
      </div>
    );
  }

  const view = tab === 'week' ? data.week : data.allTime;
  const goal = 1000000;
  const pct = (data.count / goal) * 100;

  // Milestone timeline
  const milestones = [100000, 250000, 500000, 750000, 1000000];
  const nextMilestone = milestones.find(m => m > data.count) || 1000000;
  const remainToNext = Math.max(0, nextMilestone - data.count);

  return (
    <div style={{ paddingBottom: 110 }}>
      {/* Header */}
      <div style={{ padding: '64px 20px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Eyebrow>The numbers</Eyebrow>
            <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 30, color: '#F4ECDD', letterSpacing: '-0.03em', marginTop: 2 }}>Stats</div>
          </div>
          <button onClick={load} style={{
            width: 40, height: 40, borderRadius: '50%', background: '#241B10',
            border: '1px solid rgba(244,236,221,0.08)', color: '#F4ECDD', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 250ms',
          }}><Icon name="rotate" size={18} /></button>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Global counter mini repeat */}
        <div style={{
          background: '#241B10', border: '1px solid rgba(244,236,221,0.07)',
          borderRadius: 22, padding: 18, marginBottom: 14,
        }}>
          <Eyebrow style={{ color: '#F4B73D' }}>The big number</Eyebrow>
          <div style={{
            fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 42,
            color: '#F4ECDD', letterSpacing: '-0.04em', marginTop: 6,
            fontVariantNumeric: 'tabular-nums',
          }}><CountUp value={data.count} /></div>
          <div style={{ fontSize: 13, color: '#B8A584', marginTop: 2, fontFamily: 'Geist, system-ui' }}>
            of {goal.toLocaleString()} · {pct.toFixed(3)}%
          </div>

          {/* Milestone timeline */}
          <div style={{ marginTop: 18 }}>
            <MilestoneTimeline current={data.count} milestones={milestones} />
            <div style={{
              marginTop: 12, fontSize: 12, color: '#B8A584',
              fontFamily: 'Geist, system-ui', textAlign: 'center',
            }}>
              <b style={{ color: '#F4ECDD' }}>{remainToNext.toLocaleString()}</b> more to <b style={{ color: '#F4B73D' }}>{nextMilestone.toLocaleString()}</b>
            </div>
          </div>
        </div>

        {/* Beer of the Week */}
        <div style={{ marginBottom: 14 }}>
          <BeerOfTheWeekCard onLog={onOpenLog} compact />
        </div>

        {/* Tab toggle */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, padding: 4, background: '#241B10', borderRadius: 14, border: '1px solid rgba(244,236,221,0.07)' }}>
          {[
            { id: 'week', label: 'This week' },
            { id: 'all_time', label: 'All time' },
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

        {view.total === 0 ? (
          <EmptyStatsState weekOnly={tab === 'week'} onOpenLog={onOpenLog} />
        ) : (
          <>
            {/* Big stat */}
            <BigStatCard
              big={view.uniqueBeers}
              bigLabel="unique beers"
              subtext={`Across ${view.breweries} breweries in ${view.regionCount} regions · ${view.total} total logs`}
            />

            {/* Top styles */}
            <StatBlock title="Top styles" insight={topStyleInsight(view.topStyles)}>
              <BarList entries={view.topStyles} onClick={(label) => setDrillStyle(label)} />
            </StatBlock>

            {/* Top beers */}
            <StatBlock title="Top beers" insight={`${view.topBeers[0]?.name || '—'} leads the pack`}>
              <BeerLeaderList beers={view.topBeers} logs={data.logs} />
            </StatBlock>

            {/* Region donut */}
            <StatBlock title="By region">
              <RegionDonutBig entries={view.regions} onClick={(label) => setDrillRegion(label)} />
            </StatBlock>

            {/* Rating distribution */}
            <StatBlock title="Ratings" insight={`Community average: ${view.avgRating.toFixed(1)} stars`}>
              <RatingDistribution ratings={view.ratings} />
            </StatBlock>
          </>
        )}

        {/* Milestones history link */}
        <button onClick={() => onOpenHistory && onOpenHistory()} style={{
          width: '100%', marginTop: 4, padding: '14px 16px', borderRadius: 16,
          background: '#241B10', border: '1px solid rgba(244,236,221,0.08)',
          color: '#F4ECDD', cursor: 'pointer', textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'Geist, system-ui',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(244,183,61,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}><Icon name="trophy" size={18} color="#F4B73D" /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 600, fontSize: 14, color: '#F4ECDD' }}>Milestones history</div>
            <div style={{ fontSize: 11.5, color: '#B8A584', marginTop: 1 }}>Where we've been, together</div>
          </div>
          <Icon name="chevronRight" size={16} color="#7A6B52" />
        </button>
      </div>

      {/* Drill-down modals */}
      {drillStyle && data.logs && (
        <DrillDownModal
          title={`${drillStyle} logs`}
          subtitle={`${(tab === 'week' ? data.logs.filter(l => l.ts > Date.now()-7*86400000) : data.logs).filter(l => window.bucketStyle(l.style) === drillStyle).length} total · all members`}
          logs={(tab === 'week' ? data.logs.filter(l => l.ts > Date.now()-7*86400000) : data.logs).filter(l => window.bucketStyle(l.style) === drillStyle)}
          onClose={() => setDrillStyle(null)}
        />
      )}
      {drillRegion && data.logs && (
        <DrillDownModal
          title={`${drillRegion} region`}
          subtitle={`${(tab === 'week' ? data.logs.filter(l => l.ts > Date.now()-7*86400000) : data.logs).filter(l => window.bucketRegion(l.region) === drillRegion).length} total · all members`}
          logs={(tab === 'week' ? data.logs.filter(l => l.ts > Date.now()-7*86400000) : data.logs).filter(l => window.bucketRegion(l.region) === drillRegion)}
          onClose={() => setDrillRegion(null)}
        />
      )}
    </div>
  );
}

// ── Empty state ──
function EmptyStatsState({ weekOnly, onOpenLog }) {
  return (
    <div style={{
      padding: '36px 20px', background: '#241B10', borderRadius: 22,
      border: '1px dashed rgba(244,236,221,0.12)',
      textAlign: 'center',
    }}>
      <Icon name="chart" size={48} color="#7A6B52" style={{ marginBottom: 14 }} />
      <div style={{
        fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 20,
        color: '#F4ECDD', letterSpacing: '-0.02em', marginBottom: 6,
      }}>{weekOnly ? 'Quiet week so far.' : 'Not enough data yet.'}</div>
      <div style={{ fontSize: 13, color: '#B8A584', marginBottom: 18, lineHeight: 1.5, fontFamily: 'Geist, system-ui' }}>
        {weekOnly ? 'Make some noise.' : 'Log a beer to start the party.'}
      </div>
      <div style={{ maxWidth: 200, margin: '0 auto' }}>
        <Btn onClick={onOpenLog} size="md">Log a beer</Btn>
      </div>
    </div>
  );
}

// ── Milestone timeline (horizontal) ──
function MilestoneTimeline({ current, milestones }) {
  const max = milestones[milestones.length - 1];
  const pct = Math.min(100, (current / max) * 100);
  return (
    <div style={{ position: 'relative', height: 50, marginTop: 8 }}>
      {/* Track */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 16, height: 4,
        background: 'rgba(244,236,221,0.08)', borderRadius: 999,
      }} />
      {/* Filled part */}
      <div style={{
        position: 'absolute', left: 0, top: 16, height: 4, width: `${pct}%`,
        background: 'linear-gradient(90deg, #D97F2C, #F4B73D)', borderRadius: 999,
      }} />
      {/* Checkpoints */}
      {milestones.map(m => {
        const x = (m / max) * 100;
        const hit = current >= m;
        return (
          <div key={m} style={{
            position: 'absolute', left: `${x}%`, transform: 'translateX(-50%)', top: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: hit ? '#F4B73D' : '#241B10',
              border: `2px solid ${hit ? '#F4B73D' : '#7A6B52'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: hit ? '0 0 0 4px rgba(244,183,61,0.18)' : 'none',
            }}>
              {hit && <Icon name="check" size={11} strokeWidth={3} color="#1A140C" />}
            </div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: hit ? '#F4B73D' : '#7A6B52',
              letterSpacing: '0.04em',
            }}>{shortNum(m)}</div>
          </div>
        );
      })}
      {/* Current flag */}
      <div style={{
        position: 'absolute', left: `${pct}%`, transform: 'translateX(-50%)', top: -6,
      }}>
        <svg width="14" height="20" viewBox="0 0 14 20">
          <path d="M2 2 L12 2 L9 6 L12 10 L2 10 Z" fill="#F4B73D" />
          <line x1="2" y1="2" x2="2" y2="20" stroke="#F4B73D" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

function shortNum(n) {
  if (n >= 1000000) return (n / 1000000) + 'M';
  if (n >= 1000) return (n / 1000) + 'K';
  return String(n);
}

// ── Stat block scaffold ──
function StatBlock({ title, insight, children }) {
  return (
    <div style={{
      background: '#241B10', border: '1px solid rgba(244,236,221,0.07)',
      borderRadius: 22, padding: 18, marginBottom: 14,
    }}>
      <div style={{
        fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 16,
        color: '#F4ECDD', letterSpacing: '-0.02em', marginBottom: 14,
      }}>{title}</div>
      {children}
      {insight && (
        <div style={{
          marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(244,236,221,0.06)',
          fontSize: 11.5, color: '#F4B73D', fontFamily: 'Geist, system-ui', fontStyle: 'italic',
        }}>{insight}</div>
      )}
    </div>
  );
}

// ── Big stat ──
function BigStatCard({ big, bigLabel, subtext }) {
  return (
    <div style={{
      background: '#241B10', border: '1px solid rgba(244,236,221,0.07)',
      borderRadius: 22, padding: 18, marginBottom: 14,
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{
        fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 56,
        color: '#F4B73D', letterSpacing: '-0.04em', lineHeight: 1,
      }}><CountUp value={big} /></div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 600, fontSize: 14,
          color: '#F4ECDD', letterSpacing: '-0.01em',
        }}>{bigLabel}</div>
        <div style={{ fontSize: 11.5, color: '#B8A584', marginTop: 4, lineHeight: 1.4, fontFamily: 'Geist, system-ui' }}>
          {subtext}
        </div>
      </div>
    </div>
  );
}

// ── Bar list (top styles) — clickable ──
function BarList({ entries, onClick }) {
  const max = Math.max(1, ...entries.map(e => e[1]));
  const colors = ['#F4B73D', '#D97F2C', '#F4ECDD', '#87C66B', '#7A6B52', '#E07A5F'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {entries.map(([k, v], i) => (
        <button key={k} onClick={() => onClick && onClick(k)} style={{
          background: 'none', border: 0, padding: 0, cursor: onClick ? 'pointer' : 'default', textAlign: 'left',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 12, color: '#F4ECDD', marginBottom: 4, fontFamily: 'Geist, system-ui',
            fontWeight: 600,
          }}>
            <span>{k}</span>
            <span style={{ color: '#B8A584', fontFamily: 'JetBrains Mono, monospace', fontWeight: 500 }}>{v}{onClick ? ' →' : ''}</span>
          </div>
          <div style={{ height: 8, background: 'rgba(244,236,221,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${(v / max) * 100}%`,
              background: colors[i % colors.length],
              borderRadius: 4, transition: 'width 800ms cubic-bezier(0.4,0,0.2,1)',
            }} />
          </div>
        </button>
      ))}
    </div>
  );
}

function topStyleInsight(top) {
  if (!top.length) return '';
  const [name, count] = top[0];
  return `${name}s lead the pack with ${count}`;
}

// ── Beer leader list — clickable ──
function BeerLeaderList({ beers, logs }) {
  const [drilled, setDrilled] = React.useState(null);
  const matching = drilled ? (logs || []).filter(l => l.beer_name === drilled.name && l.brewery === drilled.brewery) : [];
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {beers.map((b, i) => (
          <button key={i} onClick={() => setDrilled(b)} style={{
            background: 'none', border: 0, padding: '8px 10px', cursor: 'pointer', textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: 10, borderRadius: 12,
            backgroundColor: i === 0 ? 'rgba(244,183,61,0.08)' : 'transparent',
            borderStyle: 'solid', borderWidth: 1,
            borderColor: i === 0 ? 'rgba(244,183,61,0.3)' : 'rgba(244,236,221,0.05)',
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: i === 0 ? '#F4B73D' : '#2E2415',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 10,
              color: i === 0 ? '#1A140C' : '#B8A584', flexShrink: 0,
            }}>{i + 1}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 600, fontSize: 13,
                color: '#F4ECDD',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{b.name}</div>
              <div style={{ fontSize: 10.5, color: '#B8A584', fontFamily: 'Geist, system-ui' }}>{b.brewery}</div>
            </div>
            <div style={{
              padding: '4px 8px', background: '#1A140C', borderRadius: 999,
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#F4B73D',
              fontWeight: 600, letterSpacing: '0.02em',
            }}>{b.count} log{b.count !== 1 ? 's' : ''}</div>
          </button>
        ))}
      </div>
      {drilled && (
        <DrillDownModal
          title={drilled.name}
          subtitle={`${drilled.brewery} · ${matching.length} log${matching.length !== 1 ? 's' : ''}`}
          logs={matching}
          onClose={() => setDrilled(null)}
        />
      )}
    </>
  );
}

// ── Region donut (bigger) — clickable legend ──
function RegionDonutBig({ entries, onClick }) {
  const total = Math.max(1, entries.reduce((a, [, v]) => a + v, 0));
  const colors = ['#F4B73D', '#D97F2C', '#FFF6E0', '#87C66B', '#E07A5F', '#9B6BCC', '#4FA3C7', '#7A6B52'];
  let acc = 0;
  const r = 42, c = 56;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg width="112" height="112" viewBox="0 0 112 112" style={{ flexShrink: 0 }}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="#1A140C" strokeWidth="14" />
        {entries.map(([, v], i) => {
          const frac = v / total; if (!frac) return null;
          const len = frac * 2 * Math.PI * r;
          const start = (acc / total) * 2 * Math.PI * r;
          acc += v;
          return (
            <circle key={i} cx={c} cy={c} r={r} fill="none"
              stroke={colors[i % colors.length]} strokeWidth="14"
              strokeDasharray={`${len} ${2 * Math.PI * r - len}`}
              strokeDashoffset={-start}
              transform={`rotate(-90 ${c} ${c})`}
              style={{ transition: 'stroke-dasharray 800ms' }}
            />
          );
        })}
        <text x={c} y={c + 4} textAnchor="middle" fontFamily="Bricolage Grotesque" fontWeight="700" fontSize="18" fill="#F4ECDD" letterSpacing="-0.04em">{total}</text>
      </svg>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {entries.map(([k, v], i) => (
          <button key={k} onClick={() => onClick && onClick(k)} style={{
            background: 'none', border: 0, padding: 0, cursor: onClick ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, textAlign: 'left',
          }}>
            <div style={{ width: 9, height: 9, borderRadius: 2, background: colors[i % colors.length], flexShrink: 0 }} />
            <span style={{ color: '#F4ECDD', flex: 1, fontFamily: 'Geist, system-ui', fontWeight: 500 }}>{k}{onClick ? ' →' : ''}</span>
            <span style={{ color: '#B8A584', fontFamily: 'JetBrains Mono, monospace' }}>{Math.round(v/total*100)}%</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Drill-down modal — shows the actual logs that make up a stat ──
function DrillDownModal({ title, subtitle, logs, onClose }) {
  const sorted = [...logs].sort((a, b) => b.ts - a.ts);
  return (
    <div role="dialog" aria-modal="true" onClick={onClose} style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      zIndex: 250, display: 'flex', alignItems: 'flex-end',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', maxHeight: '85%', background: '#241B10',
        borderRadius: '24px 24px 0 0', borderTop: '1px solid rgba(244,236,221,0.12)',
        animation: 'slide-up 250ms cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ width: 40, height: 4, background: 'rgba(244,236,221,0.2)', borderRadius: 2, margin: '14px auto 12px' }} />
        <div style={{ padding: '0 22px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 22,
              color: '#F4ECDD', letterSpacing: '-0.02em',
            }}>{title}</div>
            <div style={{ fontSize: 12, color: '#B8A584', fontFamily: 'Geist, system-ui', marginTop: 2 }}>{subtitle}</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{
            width: 32, height: 32, borderRadius: '50%', background: '#1A140C',
            border: '1px solid rgba(244,236,221,0.1)', color: '#F4ECDD', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 28px' }}>
          {sorted.length === 0 ? (
            <div style={{
              padding: 24, textAlign: 'center', color: '#7A6B52', fontSize: 13,
              fontFamily: 'Geist, system-ui',
            }}>Nothing here yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sorted.map((l, i) => (
                <div key={l.id || i} style={{
                  background: '#1A140C', border: '1px solid rgba(244,236,221,0.07)',
                  borderRadius: 14, padding: 12,
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: `linear-gradient(135deg, ${uiHelpers.beerTone(l.style)[0]}, ${uiHelpers.beerTone(l.style)[1]})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><Icon name="beer" size={18} color="#F4ECDD" /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 600, fontSize: 14,
                      color: '#F4ECDD',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{l.beer_name || 'Unknown'}</div>
                    <div style={{ fontSize: 11, color: '#B8A584', fontFamily: 'Geist, system-ui' }}>
                      {l.brewery || '—'} · {l.style || '—'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <StarRow value={l.rating || 0} size={10} gap={1} />
                    <div style={{ fontSize: 10, color: '#7A6B52', marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>
                      {window.dateUtils ? window.dateUtils.timeAgo(l.ts) : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Rating distribution ──
function RatingDistribution({ ratings }) {
  const max = Math.max(1, ...ratings);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[5, 4, 3, 2, 1].map(stars => {
        const v = ratings[stars - 1];
        return (
          <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 64, display: 'flex', alignItems: 'center', gap: 2 }}>
              <StarRow value={stars} size={10} gap={1} />
            </div>
            <div style={{ flex: 1, height: 10, background: 'rgba(244,236,221,0.06)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${(v / max) * 100}%`,
                background: stars === 5 ? '#F4B73D' : stars >= 3 ? '#D97F2C' : '#7A6B52',
                borderRadius: 4, transition: 'width 600ms',
              }} />
            </div>
            <div style={{
              width: 36, textAlign: 'right',
              fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#B8A584',
            }}>{v}</div>
          </div>
        );
      })}
    </div>
  );
}

window.StatsScreen = StatsScreen;
window.computeAggregates = computeAggregates;
window.MilestoneTimeline = MilestoneTimeline;
