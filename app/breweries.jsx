// breweries.jsx — Partner breweries list + Milestone history page

const BREWERY_PARTNERS = [
  { name: "Russian River Brewing", city: "Santa Rosa, CA", distance: "12 mi", featured_beer: "Pliny the Elder", offers: "Buy 2 pints, get a glass" },
  { name: "Bell's Brewery", city: "Kalamazoo, MI", distance: "2.4 mi", featured_beer: "Two Hearted Ale", offers: "10% off if you log a Bell's" },
  { name: "Tree House Brewing", city: "Charlton, MA", distance: "5.8 mi", featured_beer: "Julius", offers: "First pour free with check-in" },
  { name: "Sierra Nevada", city: "Chico, CA", distance: "18 mi", featured_beer: "Pale Ale", offers: "Tasting flight discount" },
  { name: "Stone Brewing", city: "Escondido, CA", distance: "8.2 mi", featured_beer: "Stone IPA", offers: "Members log to redeem" },
  { name: "Dogfish Head", city: "Milton, DE", distance: "Far", featured_beer: "60 Minute IPA", offers: "Sign up for the brewery newsletter" },
];

function BreweriesScreen({ onBack, onOpenLog }) {
  const [selected, setSelected] = React.useState(null);
  const [showSoon, setShowSoon] = React.useState(false);

  return (
    <div style={{ paddingBottom: 110, height: '100%', overflow: 'auto', background: '#1A140C' }}>
      <div style={{ padding: '56px 20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={onBack} aria-label="Back" style={{
          background: 'none', border: 'none', color: '#F4ECDD', cursor: 'pointer', padding: 0,
        }}><Icon name="chevronLeft" size={24} /></button>
        <div>
          <Eyebrow>Local discovery</Eyebrow>
          <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 26, color: '#F4ECDD', letterSpacing: '-0.03em', marginTop: 2 }}>Breweries</div>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Beer of the Week hero */}
        <BeerOfTheWeekCard onLog={(b) => onOpenLog && onOpenLog(b)} />

        {/* Claim a token CTA */}
        <button onClick={() => setShowSoon(true)} style={{
          width: '100%', marginTop: 14, padding: '14px 16px', borderRadius: 16,
          background: 'rgba(244,183,61,0.1)', border: '1px solid rgba(244,183,61,0.3)',
          color: '#F4B73D', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontFamily: 'Geist, system-ui', fontWeight: 600, fontSize: 14,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="sparkles" size={16} /> Claim a token
          </span>
          <Icon name="chevronRight" size={16} />
        </button>

        {/* Friendly intro */}
        <div style={{
          marginTop: 18, padding: 14, background: '#241B10', borderRadius: 16,
          border: '1px dashed rgba(244,236,221,0.1)',
          fontSize: 12.5, color: '#B8A584', lineHeight: 1.5, fontFamily: 'Geist, system-ui',
        }}>
          Tagging bars when you log unlocks deals at these spots.
          Your tags help bring partners on board.
        </div>

        <Eyebrow style={{ marginTop: 22, marginBottom: 10 }}>Partner breweries</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {BREWERY_PARTNERS.map((b, i) => (
            <BreweryRow key={i} brewery={b} onClick={() => setSelected(b)} />
          ))}
        </div>
      </div>

      {selected && (
        <BreweryDetailModal brewery={selected} onClose={() => setSelected(null)} onLog={(b) => { setSelected(null); onOpenLog && onOpenLog(b); }} />
      )}

      {showSoon && (
        <ComingSoonModal onClose={() => setShowSoon(false)} />
      )}
    </div>
  );
}

function BreweryRow({ brewery, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', background: '#241B10', border: '1px solid rgba(244,236,221,0.07)',
      borderRadius: 18, padding: 14, cursor: 'pointer', textAlign: 'left',
      display: 'flex', gap: 12, alignItems: 'center',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
        background: 'linear-gradient(135deg, #7A4A1F, #A86524)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'inset 0 -8px 12px rgba(0,0,0,0.2)',
      }}><Icon name="beer" size={22} color="#F4ECDD" /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 15,
          color: '#F4ECDD', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{brewery.name}</div>
        <div style={{ fontSize: 11.5, color: '#B8A584', marginTop: 1, fontFamily: 'Geist, system-ui', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="pin" size={11} /> {brewery.city} · {brewery.distance}
        </div>
        <div style={{
          marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 8px', borderRadius: 999,
          background: 'rgba(244,183,61,0.12)', border: '1px solid rgba(244,183,61,0.3)',
          fontSize: 10, color: '#F4B73D', fontFamily: 'Geist, system-ui', fontWeight: 600,
          whiteSpace: 'nowrap', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          <Icon name="sparkles" size={10} /> {brewery.offers}
        </div>
      </div>
      <Icon name="chevronRight" size={16} color="#7A6B52" />
    </button>
  );
}

function BreweryDetailModal({ brewery, onClose, onLog }) {
  return (
    <div role="dialog" aria-modal="true" style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      zIndex: 200, display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', background: '#241B10', borderRadius: '24px 24px 0 0',
        padding: '24px 24px 32px', borderTop: '1px solid rgba(244,236,221,0.12)',
        animation: 'slide-up 250ms cubic-bezier(0.4,0,0.2,1)',
        maxHeight: '90%', overflow: 'auto',
      }}>
        <div style={{ width: 40, height: 4, background: 'rgba(244,236,221,0.2)', borderRadius: 2, margin: '0 auto 18px' }} />
        <Eyebrow style={{ color: '#F4B73D' }}>Partner brewery</Eyebrow>
        <div style={{
          fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 26,
          color: '#F4ECDD', letterSpacing: '-0.03em', marginTop: 4, marginBottom: 4,
        }}>{brewery.name}</div>
        <div style={{ fontSize: 13, color: '#B8A584', marginBottom: 18, fontFamily: 'Geist, system-ui' }}>
          <Icon name="pin" size={12} style={{ display: 'inline', verticalAlign: -1 }} /> {brewery.city} · {brewery.distance}
        </div>

        {/* Offer card */}
        <div style={{
          background: 'linear-gradient(135deg, #F4B73D, #D97F2C)',
          borderRadius: 18, padding: 18, marginBottom: 14, color: '#1A140C',
        }}>
          <Eyebrow style={{ color: 'rgba(26,20,12,0.7)' }}>This week's offer</Eyebrow>
          <div style={{
            fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 22,
            letterSpacing: '-0.02em', marginTop: 6, lineHeight: 1.2,
          }}>{brewery.offers}</div>
        </div>

        {/* Featured beer */}
        <div style={{
          background: '#1A140C', borderRadius: 16, padding: 14, marginBottom: 18,
          border: '1px solid rgba(244,236,221,0.07)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg, #7A4A1F, #A86524)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Icon name="beer" size={20} color="#F4ECDD" /></div>
          <div style={{ flex: 1 }}>
            <Eyebrow>Try their flagship</Eyebrow>
            <div style={{
              fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 600, fontSize: 15,
              color: '#F4ECDD', marginTop: 2,
            }}>{brewery.featured_beer}</div>
          </div>
        </div>

        {/* QR placeholder */}
        <div style={{
          padding: 18, background: '#F4ECDD', borderRadius: 18,
          display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18,
        }}>
          <div style={{
            width: 80, height: 80, background: '#1A140C', borderRadius: 8, flexShrink: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, #1A140C 0px, #1A140C 4px, #F4ECDD 4px, #F4ECDD 7px), repeating-linear-gradient(90deg, #1A140C 0px, #1A140C 5px, transparent 5px, transparent 9px)',
            backgroundBlendMode: 'difference',
          }} />
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 14,
              color: '#1A140C', letterSpacing: '-0.01em',
            }}>Show this at the bar</div>
            <div style={{ fontSize: 11.5, color: 'rgba(26,20,12,0.65)', marginTop: 4, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em' }}>
              CODE · 1MB-{uiHelpers.normName(brewery.name).slice(0, 6).toUpperCase()}
            </div>
          </div>
        </div>

        <Btn onClick={() => onLog && onLog({
          id: 'partner-' + uiHelpers.normName(brewery.featured_beer).replace(/\s+/g, '-'),
          name: brewery.featured_beer, brewery: brewery.name,
          style: 'Pale Ale', abv: null, region: brewery.city, source: 'partner',
        })}>
          Log a {brewery.featured_beer} <Icon name="arrowRight" size={20} />
        </Btn>
      </div>
    </div>
  );
}

function ComingSoonModal({ onClose }) {
  return (
    <div role="dialog" aria-modal="true" style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 30,
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: '#241B10', borderRadius: 22, padding: 24, textAlign: 'center',
        border: '1px solid rgba(244,236,221,0.1)',
      }}>
        <Icon name="sparkles" size={28} color="#F4B73D" />
        <div style={{
          fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 20,
          color: '#F4ECDD', letterSpacing: '-0.02em', marginTop: 10, marginBottom: 6,
        }}>Coming soon</div>
        <div style={{ fontSize: 13, color: '#B8A584', lineHeight: 1.5, marginBottom: 18, fontFamily: 'Geist, system-ui' }}>
          Redeem deals at participating bars right from the app.
        </div>
        <Btn size="md" onClick={onClose}>Got it</Btn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Milestone History
// ─────────────────────────────────────────────────────────────
function MilestoneHistoryScreen({ profile, onBack }) {
  const [hits, setHits] = React.useState(null);
  const [memberCount, setMemberCount] = React.useState(0);
  const [cheered, setCheeredSet] = React.useState(new Set());

  React.useEffect(() => {
    (async () => {
      const [h, m, c] = await Promise.all([
        storage_util.get('beers:milestones_hit', true),
        storage_util.get('community:members', true),
        storage_util.get('user:cheered_milestones', false),
      ]);
      setHits((h || []).sort((a, b) => b.hit_at - a.hit_at));
      setMemberCount(m || 0);
      setCheeredSet(new Set(c || []));
    })();
  }, []);

  const toggleCheers = async (m) => {
    const c = (await storage_util.get('user:cheered_milestones', false)) || [];
    const has = c.includes(m);
    const next = has ? c.filter(x => x !== m) : [...c, m];
    await storage_util.set('user:cheered_milestones', next, false);
    setCheeredSet(new Set(next));
    storage_util.incrementSharedCounter(`milestones:cheers:${m}`, has ? -1 : 1);
    if (!has) { try { SoundManager.play('ting'); haptic(8); } catch {} }
  };

  return (
    <div style={{ paddingBottom: 110, height: '100%', overflow: 'auto', background: '#1A140C' }}>
      <div style={{ padding: '56px 20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={onBack} aria-label="Back" style={{
          background: 'none', border: 'none', color: '#F4ECDD', cursor: 'pointer', padding: 0,
        }}><Icon name="chevronLeft" size={24} /></button>
        <div>
          <Eyebrow>Where we've been</Eyebrow>
          <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 26, color: '#F4ECDD', letterSpacing: '-0.03em', marginTop: 2 }}>Milestones</div>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        {hits === null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} w="100%" h={140} r={22} />)}
          </div>
        )}
        {hits !== null && hits.length === 0 && (
          <div style={{
            padding: '36px 20px', background: '#241B10', borderRadius: 22,
            border: '1px dashed rgba(244,236,221,0.12)', textAlign: 'center',
          }}>
            <Icon name="trophy" size={40} color="#7A6B52" style={{ marginBottom: 14 }} />
            <div style={{
              fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 20,
              color: '#F4ECDD', letterSpacing: '-0.02em', marginBottom: 6,
            }}>We're still pouring.</div>
            <div style={{ fontSize: 13, color: '#B8A584', lineHeight: 1.5, fontFamily: 'Geist, system-ui' }}>
              First milestone is at 100,000. Let's go get it.
            </div>
          </div>
        )}
        {hits && hits.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {hits.map((h, i) => (
              <MilestoneHistoryCard
                key={h.milestone}
                hit={h}
                memberCount={memberCount}
                cheered={cheered.has(h.milestone)}
                onCheers={() => toggleCheers(h.milestone)}
                isYou={h.member_number === profile?.member_number}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MilestoneHistoryCard({ hit, memberCount, cheered, onCheers, isYou }) {
  return (
    <div style={{
      background: 'linear-gradient(155deg, rgba(244,183,61,0.1), #241B10 70%)',
      border: '1px solid rgba(244,183,61,0.18)',
      borderRadius: 22, padding: 18, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.18 }}>
        <Icon name="trophy" size={80} color="#F4B73D" />
      </div>
      <Eyebrow style={{ color: '#F4B73D' }}>We hit</Eyebrow>
      <div style={{
        fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 44,
        color: '#F4ECDD', letterSpacing: '-0.04em', lineHeight: 1, marginTop: 8,
        fontVariantNumeric: 'tabular-nums',
      }}>{hit.milestone.toLocaleString()}</div>
      <div style={{ fontSize: 13, color: '#B8A584', marginTop: 8, fontFamily: 'Geist, system-ui', lineHeight: 1.5 }}>
        {dateUtils.formatLong(hit.hit_at)} · {memberCount.toLocaleString()} members
      </div>
      {hit.member_number && (
        <div style={{
          marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', background: 'rgba(244,183,61,0.12)',
          border: '1px solid rgba(244,183,61,0.3)', borderRadius: 999,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#F4B73D',
          letterSpacing: '0.06em',
        }}>
          <Icon name="trophy" size={10} /> CROSSED BY MEMBER #{hit.member_number} {isYou ? '· THAT WAS YOU' : ''}
        </div>
      )}
      <div style={{ marginTop: 14, position: 'relative' }}>
        <button onClick={onCheers} aria-pressed={cheered} style={{
          padding: '10px 16px', borderRadius: 999,
          background: cheered ? 'rgba(244,183,61,0.18)' : 'transparent',
          border: `1.5px solid ${cheered ? '#F4B73D' : 'rgba(244,236,221,0.18)'}`,
          color: cheered ? '#F4B73D' : '#F4ECDD', cursor: 'pointer',
          fontFamily: 'Geist, system-ui', fontWeight: 600, fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 8,
          transition: 'all 200ms',
        }}>
          <Icon name="beer" size={15} filled={cheered} color={cheered ? '#F4B73D' : 'currentColor'} strokeWidth={cheered ? 0 : 2} />
          {cheered ? 'You cheered this moment' : 'Cheers to this moment'}
        </button>
      </div>
    </div>
  );
}

window.BreweriesScreen = BreweriesScreen;
window.MilestoneHistoryScreen = MilestoneHistoryScreen;
window.BREWERY_PARTNERS = BREWERY_PARTNERS;
