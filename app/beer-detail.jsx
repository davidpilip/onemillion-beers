// beer-detail.jsx — "Beer of the Week → Learn more" deep-dive page.
//
// Content model: curated lore (BEER_LORE) written for the featured beers,
// merged with LIVE 1M Beers data (times logged, community rating, photos)
// pulled from the shared store. Structured so a live-AI generator can later
// fill BEER_LORE on demand for any beer (see resolveLore()).

// ── Curated lore for the rotating Beer of the Week set ──
// Keyed by normalized beer name. Facts kept accurate & concise.
const BEER_LORE = {
  'heineken lager': {
    founded: '1873 · Amsterdam',
    story: "Gerard Adriaan Heineken bought a struggling Amsterdam brewery in 1873 and set out to make one flawless lager. The breakthrough came in 1886 when his 'A-yeast', developed by a student of Louis Pasteur, locked in the clean, faintly fruity character that still defines every green bottle today.",
    taste: 'Mild malt sweetness, a gentle hop snap, and a whisper of green-apple ester over a crisp, clean finish.',
    notable: "One of the most recognized beers on earth — poured in more than 190 countries.",
  },
  'modelo especial': {
    founded: '1925 · Mexico City',
    story: "Launched in 1925 as a 'model' of what a great beer could be, Modelo Especial spent decades as Mexico's quiet classic before its US rise. In 2023 it became the best-selling beer in America.",
    taste: 'Light-bodied and golden, with orange-blossom honey notes and a crisp, clean finish.',
    notable: '#1 best-selling beer in the United States (2023).',
  },
  'guinness draught': {
    founded: '1759 · Dublin',
    story: "In 1759 Arthur Guinness signed a now-legendary 9,000-year lease on the St. James's Gate brewery in Dublin. The modern nitrogen-poured Draught arrived in 1959, its tiny in-can widget creating that signature cascading surge and thick, creamy head.",
    taste: 'Roasted barley, coffee and cocoa over a silky nitrogen body with a dry, clean finish.',
    notable: 'The two-part pour takes about 119.5 seconds — and yes, that ritual matters.',
  },
  'pilsner urquell': {
    founded: '1842 · Plzeň, Bohemia',
    story: "This is the original. In 1842 Bavarian brewer Josef Groll poured the world's first pale lager in Plzeň, using soft local water, Saaz hops and triple decoction. Every pilsner and pale lager on earth descends from this glass.",
    taste: 'Rich golden malt met by a crisp, spicy-herbal Saaz hop bite and a clean bitterness.',
    notable: 'The beer that invented an entire category — the pilsner.',
  },
  'stella artois': {
    founded: '1926 · Leuven, Belgium',
    story: "With brewing roots in Leuven tracing to the Den Hoorn brewery of 1366, Stella Artois launched in 1926 as a Christmas beer — 'Stella' means star. Its branded chalice and 9-step pour turned serving it into a small ceremony.",
    taste: 'Floral hop aroma, crisp cereal malt, and a slightly bitter, clean finish.',
    notable: 'Best served in the chalice — the ritual is part of the beer.',
  },
  'pale ale': {
    founded: '1980 · Chico, California',
    story: "Ken Grossman brewed the first batch of Sierra Nevada Pale Ale in 1980 on hand-built equipment. Its bold use of whole-cone Cascade hops became a blueprint — and helped light the fuse on the American craft-beer revolution.",
    taste: 'Caramel malt backbone brightened by piney, grapefruit-citrus Cascade hops. Balanced and iconic.',
    notable: 'One of the beers that started American craft brewing.',
  },
};

function resolveLore(sponsor) {
  const key = (window.uiHelpers ? uiHelpers.normName(sponsor.beer_name) : (sponsor.beer_name || '').toLowerCase());
  return BEER_LORE[key] || null;
}

function BeerDetailScreen({ info, onBack, onOpenLog }) {
  const [data, setData] = React.useState(info || null);
  const [live, setLive] = React.useState(null); // { count, avg, photos: [dataURL] }

  // Resolve the weekly sponsor if opened without explicit info.
  React.useEffect(() => {
    if (data) return;
    (async () => { try { setData(await resolveBeerOfWeek()); } catch (_) {} })();
  }, [data]);

  // Pull live 1M Beers numbers for this beer.
  React.useEffect(() => {
    if (!data) return;
    let cancelled = false;
    (async () => {
      try {
        const target = uiHelpers.normName(data.sponsor.beer_name);
        const [logRows, toastRows] = await Promise.all([
          storage_util.listFull('logs:anonymized:', true).catch(() => []),
          storage_util.listFull('toast:', true).catch(() => []),
        ]);
        const logs = (logRows || []).map(r => r.value).filter(v => v && uiHelpers.normName(v.beer_name) === target);
        const rated = logs.filter(l => l.rating > 0);
        const avg = rated.length ? (rated.reduce((s, l) => s + Number(l.rating), 0) / rated.length) : 0;
        const photos = (toastRows || []).map(r => r.value)
          .filter(v => v && v.photo_data && uiHelpers.normName(v.beer_name) === target)
          .slice(0, 6).map(v => v.photo_data);
        if (!cancelled) setLive({ count: logs.length, avg, photos });
      } catch (_) { if (!cancelled) setLive({ count: 0, avg: 0, photos: [] }); }
    })();
    return () => { cancelled = true; };
  }, [data]);

  if (!data) {
    return (
      <div style={{ height: '100%', background: '#1A140C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Skeleton w={160} h={20} />
      </div>
    );
  }

  const { sponsor, beer } = data;
  const lore = resolveLore(sponsor);
  const abv = (beer && beer.abv) || sponsor.abv || null;

  const Stat = ({ label, value, accent }) => (
    <div style={{
      flex: 1, background: '#241B10', border: '1px solid rgba(244,236,221,0.08)',
      borderRadius: 16, padding: '14px 12px', textAlign: 'center',
    }}>
      <div style={{
        fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 22,
        color: accent ? '#F4B73D' : '#F4ECDD', letterSpacing: '-0.02em',
      }}>{value}</div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, color: '#7A6B52', letterSpacing: '0.06em', marginTop: 4 }}>
        {label}
      </div>
    </div>
  );

  const Section = ({ eyebrow, children }) => (
    <div style={{ marginTop: 24 }}>
      <Eyebrow style={{ color: '#F4B73D', marginBottom: 8 }}>{eyebrow}</Eyebrow>
      <div style={{ fontFamily: 'Geist, system-ui', fontSize: 14.5, lineHeight: 1.6, color: '#E7DCC6' }}>
        {children}
      </div>
    </div>
  );

  return (
    <div style={{ height: '100%', background: '#1A140C', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ padding: '18px 20px 4px', display: 'flex', alignItems: 'center' }}>
        <button onClick={onBack} aria-label="Back" style={{
          background: 'none', border: 'none', color: '#F4ECDD', cursor: 'pointer', padding: 0,
        }}><Icon name="chevronLeft" size={24} /></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 120px' }}>
        {/* Hero */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
          <BeerGlyph style={sponsor.style} size={72} />
          <div style={{ minWidth: 0 }}>
            <Eyebrow style={{ color: '#F4B73D' }}>
              <Icon name="sparkles" size={11} style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} />
              Beer of the week
            </Eyebrow>
            <div style={{
              fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 28,
              color: '#F4ECDD', letterSpacing: '-0.03em', lineHeight: 1.05, marginTop: 4,
            }}>{sponsor.beer_name}</div>
            <div style={{ fontSize: 13, color: '#B8A584', marginTop: 3, fontFamily: 'Geist, system-ui' }}>
              {sponsor.brewery} · {sponsor.style}
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Stat label="ABV" value={abv ? `${Number(abv).toFixed(1)}%` : '—'} />
          <Stat label="LOGGED ON 1M" value={live ? live.count.toLocaleString() : '···'} accent />
          <Stat label="AVG RATING" value={live && live.avg ? `${live.avg.toFixed(1)}★` : '—'} />
        </div>

        {lore ? (
          <>
            <Section eyebrow={`The story · ${lore.founded}`}>{lore.story}</Section>
            <Section eyebrow="Taste">{lore.taste}</Section>
            <Section eyebrow="Why it matters">{lore.notable}</Section>
          </>
        ) : (
          <Section eyebrow="About">
            {sponsor.sponsor_message ? `"${sponsor.sponsor_message}"` : 'A community favorite this week.'}
            <div style={{ marginTop: 8, color: '#7A6B52', fontSize: 12.5 }}>
              A full deep-dive for this beer is coming soon.
            </div>
          </Section>
        )}

        {/* Community photos */}
        {live && live.photos.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <Eyebrow style={{ color: '#F4B73D', marginBottom: 10 }}>Poured by the community</Eyebrow>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {live.photos.map((src, i) => (
                <img key={i} src={src} alt="" style={{
                  width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 12,
                  border: '1px solid rgba(244,236,221,0.08)',
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Where to find it */}
        {sponsor.bar_partner && (
          <div style={{
            marginTop: 24, display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
            background: '#241B10', border: '1px solid rgba(244,236,221,0.08)', borderRadius: 16,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', background: 'rgba(244,183,61,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}><Icon name="pin" size={18} color="#F4B73D" /></div>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, color: '#7A6B52', letterSpacing: '0.06em' }}>ON TAP AT</div>
              <div style={{ fontFamily: 'Geist, system-ui', fontSize: 14, color: '#F4ECDD', marginTop: 2 }}>{sponsor.bar_partner}</div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 22, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#5C5040', letterSpacing: '0.04em', textAlign: 'center' }}>
          NOTES CURATED FOR 1M BEERS
        </div>
      </div>

      {/* Sticky Log it */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 20px 28px',
        background: 'linear-gradient(to top, #1A140C 60%, transparent)',
      }}>
        <Btn onClick={() => onOpenLog(beer || {
          id: 'sponsor-' + uiHelpers.normName(sponsor.beer_name).replace(/\s+/g, '-'),
          name: sponsor.beer_name, brewery: sponsor.brewery, style: sponsor.style,
          abv: abv, region: 'Sponsor', source: 'sponsor',
        })}>
          Log this beer <Icon name="arrowRight" size={18} />
        </Btn>
      </div>
    </div>
  );
}

window.BeerDetailScreen = BeerDetailScreen;
