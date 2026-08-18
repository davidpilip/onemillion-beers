// log-flow.jsx — 4-step log flow: pick beer → photo → rate → toast → submit
// Handles 5/day cap, same-day duplicate detection, photo compression, and
// commits to: community:count, community:recent_toasts, community:stats,
// toasts:feed:YYYY-MM-DD (if public), logs:anonymized:{id},
// beers:last_log_timestamp, user:daily_count, user:log_history,
// beers:database (if new).

function LogFlow({ profile, onClose, onComplete, onCapHit, prefillBeer = null }) {
  const [todayLogged, setTodayLogged] = React.useState(0);
  const [todayBeers, setTodayBeers] = React.useState([]); // {beer_id, beer_name}
  const [phase, setPhase] = React.useState('load'); // load | pick | photo | rate | toast | submitting | done
  const [beer, setBeer] = React.useState(prefillBeer);
  const [photo, setPhoto] = React.useState(null);
  const [rating, setRating] = React.useState(0);
  const [toast, setToast] = React.useState('');
  const [visibility, setVisibility] = React.useState('public');
  const [venueName, setVenueName] = React.useState('');
  const [showSameDay, setShowSameDay] = React.useState(false);
  const [result, setResult] = React.useState(null);   // { newCount, prevCount, logEntry, crossedMilestone }
  const [sharing, setSharing] = React.useState(false);

  const doShare = async () => {
    if (sharing || !window.shareBeer) return;
    setSharing(true);
    try {
      await window.shareBeer({
        beer_name: beer?.name, brewery: beer?.brewery, style: beer?.style,
        abv: beer?.abv, rating, photo, handle: profile?.handle,
        venue: venueName?.trim() || null, count: result?.newCount || 0,
      });
    } finally { setSharing(false); }
  };

  React.useEffect(() => {
    (async () => {
      const today = uiHelpers.todayLocalISO();
      const daily = await storage_util.get('user:daily_count', false);
      if (daily?.date === today && daily.count >= 5) {
        onCapHit(daily);
        return;
      }
      setTodayLogged(daily?.date === today ? daily.count : 0);
      setTodayBeers(daily?.date === today ? (daily.beers || []) : []);
      // If a beer was prefilled (e.g. from Beer of the Week), skip directly to photo
      setPhase(prefillBeer ? 'photo' : 'pick');
    })();
  }, []); // eslint-disable-line

  // ── Submit log ──
  const submit = async () => {
    setPhase('submitting');
    const ts = Date.now();
    const today = uiHelpers.todayLocalISO();
    const utcDate = new Date().toISOString().slice(0, 10); // for shared feed key
    const id = uiHelpers.uuid();
    const logEntry = {
      id,
      beer_id: beer.id, beer_name: beer.name, brewery: beer.brewery,
      style: beer.style, abv: beer.abv, region: beer.region,
      rating, toast: toast.trim(),
      photo: photo || null,
      handle: profile.handle, member_no: profile.member_number,
      visibility, venue_name: venueName.trim() || null,
      ts,
    };

    // 1. user:log_history
    const history = (await storage_util.get('user:log_history', false)) || [];
    history.unshift(logEntry);
    await storage_util.set('user:log_history', history.slice(0, 500), false);

    // 2. user:daily_count
    const newDaily = {
      date: today,
      count: todayLogged + 1,
      beers: [...todayBeers, { beer_id: beer.id, beer_name: beer.name, ts }],
    };
    await storage_util.set('user:daily_count', newDaily, false);

    // 3. community:count (shared counter) — capture previous for milestone detection
    const prevCount = (await storage_util.get('community:count', true)) || 0;
    const newCount = await storage_util.incrementSharedCounter('community:count', 1);

    // 4. beers:last_log_timestamp (drives the dormancy ticker)
    await storage_util.set('beers:last_log_timestamp', ts, true);

    // 5. logs:anonymized:{id} — for community aggregates on Stats screen
    //    Strips PII (no handle, no member_no, no photo, no toast text)
    const anon = {
      id, beer_id: beer.id, beer_name: beer.name, brewery: beer.brewery,
      style: beer.style, abv: beer.abv, region: beer.region,
      rating, ts,
    };
    await storage_util.set(`logs:anonymized:${id}`, anon, true);

    // 6. PUBLIC TOAST — one row per toast (key = "toast:{id}"), eliminates race condition.
    //    Every public log lands here, even without text/photo, so the feed never loses entries.
    if (visibility === 'public') {
      const publicToast = {
        id, member_number: profile.member_number,
        beer_id: beer.id, beer_name: beer.name, brewery: beer.brewery,
        style: beer.style, abv: beer.abv,
        rating, toast_text: logEntry.toast,
        photo_data: photo || null,
        venue_name: venueName.trim() || null,
        posted_at: new Date(ts).toISOString(),
        local_date: today,
        cheers_count: 0,
      };
      await storage_util.set(`toast:${id}`, publicToast, true);
    }

    // 7. community:stats — running aggregates
    const stats = (await storage_util.get('community:stats', true)) || {
      styles: {}, regions: {}, avg_rating: 0, total_ratings: 0, last_24h: 0,
    };
    const styleBucket = bucketStyle(beer.style);
    stats.styles[styleBucket] = (stats.styles[styleBucket] || 0) + 1;
    const regionBucket = bucketRegion(beer.region);
    stats.regions[regionBucket] = (stats.regions[regionBucket] || 0) + 1;
    if (rating > 0) {
      const sum = (stats.avg_rating || 0) * (stats.total_ratings || 0) + rating;
      stats.total_ratings = (stats.total_ratings || 0) + 1;
      stats.avg_rating = sum / stats.total_ratings;
    }
    stats.last_24h = (stats.last_24h || 0) + 1;
    await storage_util.set('community:stats', stats, true);

    // 8. beers:database — upsert custom beer
    if (beer.source === 'user') {
      const db = (await storage_util.get('beers:database', true)) || [];
      if (!db.some(b => b.id === beer.id)) {
        db.push({ ...beer, added_by_member: profile.member_number });
        await storage_util.set('beers:database', db, true);
      }
    }

    // 9. Milestone detection — did this log cross a threshold?
    const milestones = [1000, 10000, 100000, 250000, 500000, 750000, 1000000];
    const crossed = milestones.find(m => prevCount < m && newCount >= m);
    if (crossed) {
      const hit = (await storage_util.get('beers:milestones_hit', true)) || [];
      if (!hit.some(h => h.milestone === crossed)) {
        hit.push({ milestone: crossed, hit_at: ts, member_number: profile.member_number });
        await storage_util.set('beers:milestones_hit', hit, true);
      }
      // Mark as seen for this user (since they just saw the live overlay)
      const seen = (await storage_util.get('user:milestones_seen', false)) || [];
      if (!seen.includes(crossed)) {
        seen.push(crossed);
        await storage_util.set('user:milestones_seen', seen, false);
      }
    }

    const payload = { newCount, prevCount, logEntry, crossedMilestone: crossed };
    setResult(payload);
    setPhase('done');
    // A milestone crossing auto-advances to the big celebration overlay.
    // A normal log stays on the done screen so the user can share it.
    if (crossed) setTimeout(() => onComplete(payload), 600);
  };

  // ── Render phase ──
  if (phase === 'load') {
    return (
      <div style={{ height: '100%', background: '#1A140C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Skeleton w={140} h={20} />
      </div>
    );
  }
  if (phase === 'submitting') {
    return (
      <div style={{ height: '100%', background: '#1A140C', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <PintGlass size={80} fill={0.95} />
        <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 600, fontSize: 22, color: '#F4ECDD', letterSpacing: '-0.02em' }}>Pouring it in…</div>
      </div>
    );
  }
  if (phase === 'done') {
    return (
      <div style={{ height: '100%', background: 'radial-gradient(circle at 50% 40%, #3A2A18, #1A140C)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, position: 'relative', overflow: 'hidden' }}>
        <style>{`@keyframes pop-in{0%{transform:scale(0.5);opacity:0}60%{transform:scale(1.1);opacity:1}100%{transform:scale(1);opacity:1}}`}</style>
        <div style={{ animation: 'pop-in 600ms cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>
          <PintGlass size={120} fill={0.9} />
        </div>
        <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 36, color: '#F4B73D', letterSpacing: '-0.03em', textAlign: 'center', padding: '0 24px' }}>Cheers! 🍻</div>
        <div style={{ fontFamily: 'Geist, system-ui', fontSize: 14, color: '#F4ECDD', opacity: 0.8, textAlign: 'center', padding: '0 32px', lineHeight: 1.5 }}>
          That makes <b>{todayLogged + 1}</b> for you today, and one more for the world.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 420, padding: '20px 32px 0', boxSizing: 'border-box' }}>
          <button onClick={doShare} disabled={sharing} style={{
            padding: '18px 20px', borderRadius: 18, border: 'none', cursor: sharing ? 'default' : 'pointer',
            background: '#F4B73D', color: '#1A140C', opacity: sharing ? 0.7 : 1,
            fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 17,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            {sharing ? 'Preparing image…' : '📸  Share your beer'}
          </button>
          <button onClick={() => onComplete(result)} style={{
            padding: '16px 20px', borderRadius: 18, cursor: 'pointer',
            background: 'transparent', border: '1.5px solid rgba(244,236,221,0.16)', color: '#F4ECDD',
            fontFamily: 'Geist, system-ui', fontWeight: 600, fontSize: 16,
          }}>
            Done
          </button>
        </div>
      </div>
    );
  }

  // navigable steps
  const steps = ['pick', 'photo', 'rate', 'toast'];
  const stepIdx = steps.indexOf(phase);

  const goBack = () => {
    if (stepIdx <= 0) onClose();
    else setPhase(steps[stepIdx - 1]);
  };

  return (
    <div style={{ height: '100%', background: '#1A140C', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '56px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={goBack} style={{
          background: 'none', border: 'none', color: '#F4ECDD', cursor: 'pointer', padding: 0,
        }}>
          <Icon name={stepIdx === 0 ? 'x' : 'chevronLeft'} size={26} />
        </button>
        <div style={{ display: 'flex', gap: 4 }}>
          {steps.map((s, i) => (
            <div key={s} style={{
              width: i === stepIdx ? 22 : 6, height: 4, borderRadius: 2,
              background: i <= stepIdx ? '#F4B73D' : 'rgba(244,236,221,0.12)',
              transition: 'all 250ms',
            }} />
          ))}
        </div>
        <div style={{ width: 26 }} />
      </div>

      {phase === 'pick' && (
        <PickBeerStep
          profile={profile}
          todayBeers={todayBeers}
          onPick={(b, sameDay) => {
            setBeer(b);
            if (sameDay) setShowSameDay(true);
            else setPhase('photo');
          }}
        />
      )}

      {phase === 'photo' && beer && (
        <PhotoStep
          beer={beer}
          photo={photo}
          setPhoto={setPhoto}
          onSkip={() => setPhase('rate')}
          onNext={() => setPhase('rate')}
        />
      )}

      {phase === 'rate' && beer && (
        <RateStep
          beer={beer}
          rating={rating}
          setRating={setRating}
          onNext={() => setPhase('toast')}
        />
      )}

      {phase === 'toast' && beer && (
        <ToastStep
          beer={beer}
          toast={toast}
          setToast={setToast}
          rating={rating}
          photo={photo}
          todayLogged={todayLogged}
          visibility={visibility}
          setVisibility={setVisibility}
          venueName={venueName}
          setVenueName={setVenueName}
          onSubmit={submit}
        />
      )}

      {/* Same-day modal */}
      {showSameDay && (
        <SameDayModal
          beer={beer}
          onChoose={() => { setShowSameDay(false); setPhase('photo'); }}
          onCancel={() => { setShowSameDay(false); setBeer(null); }}
        />
      )}
    </div>
  );
}

// ── Step: Pick beer ──
function PickBeerStep({ profile, todayBeers, onPick }) {
  const [query, setQuery] = React.useState('');
  const [db, setDb] = React.useState([]);
  const [showAdd, setShowAdd] = React.useState(false);
  const [recents, setRecents] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      const all = (await storage_util.get('beers:database', true)) || [];
      setDb(all);
      const hist = (await storage_util.get('user:log_history', false)) || [];
      // unique by beer_id, most recent first, top 5
      const seen = new Set(); const out = [];
      for (const h of hist) {
        if (!seen.has(h.beer_id)) {
          const found = all.find(b => b.id === h.beer_id);
          if (found) { out.push(found); seen.add(h.beer_id); }
          if (out.length >= 5) break;
        }
      }
      setRecents(out);
    })();
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = !q ? db.slice(0, 60) : db.filter(b => {
    return b.name.toLowerCase().includes(q) ||
      b.brewery.toLowerCase().includes(q) ||
      (b.style || '').toLowerCase().includes(q);
  }).slice(0, 60);

  const handlePick = (b) => {
    const sameDay = todayBeers.some(x => x.beer_id === b.id);
    onPick(b, sameDay);
  };

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 24px' }}>
      <div style={{
        fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 30,
        color: '#F4ECDD', letterSpacing: '-0.03em', marginBottom: 6, marginTop: 4,
      }}>What are you<br />drinking?</div>
      <div style={{ fontSize: 13.5, color: '#B8A584', marginBottom: 18, fontFamily: 'Geist, system-ui' }}>
        Search {db.length}+ beers, or add a custom pour.
      </div>

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
        background: '#241B10', border: '1px solid rgba(244,236,221,0.1)',
        borderRadius: 16, marginBottom: 16,
      }}>
        <Icon name="search" size={18} color="#B8A584" />
        <input
          value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Pliny, Hazy IPA, Founders…"
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            color: '#F4ECDD', fontFamily: 'Geist, system-ui', fontSize: 15,
          }}
        />
        {query && (
          <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: '#7A6B52', cursor: 'pointer' }}>
            <Icon name="x" size={16} />
          </button>
        )}
      </div>

      {/* Add custom */}
      <button onClick={() => setShowAdd(true)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', background: 'rgba(244,183,61,0.08)',
        border: '1px dashed rgba(244,183,61,0.4)', borderRadius: 16,
        color: '#F4B73D', cursor: 'pointer', marginBottom: 16,
        fontFamily: 'Geist, system-ui', fontWeight: 600, fontSize: 14,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="plus" size={18} />
          Add a custom beer
        </span>
        <Icon name="chevronRight" size={16} />
      </button>

      {/* Recents */}
      {!query && recents.length > 0 && (
        <>
          <Eyebrow style={{ marginBottom: 8 }}>Recent for you</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
            {recents.map(b => <BeerCard key={b.id} beer={b} onClick={() => handlePick(b)} />)}
          </div>
        </>
      )}

      <Eyebrow style={{ marginBottom: 8 }}>{query ? `${filtered.length} matches` : 'Browse all'}</Eyebrow>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 && (
          <div style={{
            padding: 20, background: '#241B10', borderRadius: 18,
            border: '1px solid rgba(244,236,221,0.08)',
            textAlign: 'center', color: '#B8A584', fontSize: 13, fontFamily: 'Geist, system-ui',
          }}>
            No matches. <button onClick={() => setShowAdd(true)} style={{ background: 'none', border: 'none', color: '#F4B73D', cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit' }}>Add "{query}" as custom →</button>
          </div>
        )}
        {filtered.map(b => <BeerCard key={b.id} beer={b} onClick={() => handlePick(b)} />)}
      </div>

      {showAdd && (
        <AddCustomBeerModal
          initialName={query}
          profile={profile}
          db={db}
          onCancel={() => setShowAdd(false)}
          onAdd={(b) => { setShowAdd(false); handlePick(b); }}
        />
      )}
    </div>
  );
}

// ── Step: Photo ──
function PhotoStep({ beer, photo, setPhoto, onSkip, onNext }) {
  const cameraRef = React.useRef(null);
  const libraryRef = React.useRef(null);
  const [compressing, setCompressing] = React.useState(false);

  const onFile = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    setCompressing(true);
    try {
      const data = await uiHelpers.compressImage(f, 800, 0.7);
      setPhoto(data);
    } catch (err) { console.warn('photo err', err); }
    setCompressing(false);
    // reset value so the same file can be re-picked
    if (e.target) e.target.value = '';
  };

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 24px', display: 'flex', flexDirection: 'column' }}>
      <SelectedBeerPill beer={beer} />
      <div style={{
        fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 30,
        color: '#F4ECDD', letterSpacing: '-0.03em', marginBottom: 6,
      }}>Snap it<br />(optional)</div>
      <div style={{ fontSize: 13.5, color: '#B8A584', marginBottom: 24, fontFamily: 'Geist, system-ui' }}>
        Show off the pour. We compress to keep it light.
      </div>

      {/* Two file inputs: camera-only & library-picker. iOS/Android route to the right source. */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFile}
        style={{ display: 'none' }}
        aria-label="Take a photo"
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        onChange={onFile}
        style={{ display: 'none' }}
        aria-label="Choose from photo library"
      />

      <div style={{
        background: '#241B10', border: '2px dashed rgba(244,183,61,0.3)',
        borderRadius: 22, padding: 0, overflow: 'hidden', position: 'relative',
        aspectRatio: '4/5', display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16, flexShrink: 0,
      }}>
        {photo ? (
          <>
            <img src={photo} alt="Your beer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button onClick={() => setPhoto(null)} aria-label="Remove photo" style={{
              position: 'absolute', top: 12, right: 12,
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(0,0,0,0.6)', border: 0, color: '#F4ECDD', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(6px)',
            }}><Icon name="x" size={18} /></button>
          </>
        ) : compressing ? (
          <div style={{ color: '#B8A584', fontFamily: 'Geist, system-ui', fontSize: 14 }}>Compressing…</div>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            padding: 24, color: '#F4ECDD',
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%', background: '#F4B73D',
              color: '#1A140C', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><Icon name="camera" size={28} strokeWidth={2} /></div>
            <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 600, fontSize: 16 }}>Add a photo</div>
            <div style={{ fontSize: 12, color: '#B8A584', fontFamily: 'Geist, system-ui', textAlign: 'center', maxWidth: 220 }}>
              Pick from your library or shoot a new one.
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {photo ? (
          <>
            <Btn onClick={onNext}>Continue <Icon name="arrowRight" size={20} /></Btn>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="ghost" size="md" onClick={() => libraryRef.current?.click()} style={{ flex: 1 }}>
                <Icon name="image" size={16} /> Library
              </Btn>
              <Btn variant="ghost" size="md" onClick={() => cameraRef.current?.click()} style={{ flex: 1 }}>
                <Icon name="camera" size={16} /> Camera
              </Btn>
            </div>
          </>
        ) : (
          <>
            <Btn onClick={() => libraryRef.current?.click()}>
              <Icon name="image" size={18} /> Choose from library
            </Btn>
            <Btn variant="ghost" onClick={() => cameraRef.current?.click()}>
              <Icon name="camera" size={18} /> Take a photo
            </Btn>
            <Btn variant="ghost" onClick={onSkip}>Skip photo</Btn>
          </>
        )}
      </div>
    </div>
  );
}

// ── Step: Rate ──
function RateStep({ beer, rating, setRating, onNext }) {
  const labels = ['', 'Hard pass', 'Eh, fine', 'Solid', 'Real good', 'Liquid gold'];
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 24px', display: 'flex', flexDirection: 'column' }}>
      <SelectedBeerPill beer={beer} />
      <div style={{
        fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 30,
        color: '#F4ECDD', letterSpacing: '-0.03em', marginBottom: 6,
      }}>How was it?</div>
      <div style={{ fontSize: 13.5, color: '#B8A584', marginBottom: 48, fontFamily: 'Geist, system-ui' }}>
        No wrong answers, just different palates.
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <StarRow value={rating} onChange={setRating} size={48} gap={10} />
      </div>

      <div style={{
        textAlign: 'center', minHeight: 34, marginBottom: 24,
        fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 600, fontSize: 22,
        color: '#F4B73D', letterSpacing: '-0.02em',
        opacity: rating ? 1 : 0, transition: 'opacity 200ms',
      }}>{labels[rating] || '—'}</div>

      <div style={{ marginTop: 'auto' }}>
        <Btn onClick={onNext} disabled={rating === 0}>
          {rating === 0 ? 'Pick a rating' : <>Continue <Icon name="arrowRight" size={20} /></>}
        </Btn>
      </div>
    </div>
  );
}

// ── Step: Toast (review text + visibility + venue) ──
// Venue autocomplete — queries Photon (free OpenStreetMap geocoder, no API key).
// Biases toward real places (amenities) so bars/pubs/restaurants surface first.
// Falls back gracefully to whatever the user typed if the lookup fails.
function VenuePicker({ value, onChange }) {
  const [q, setQ] = React.useState(value || '');
  const [results, setResults] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [hover, setHover] = React.useState(-1);
  const boxRef = React.useRef(null);
  const timer = React.useRef(null);
  const reqId = React.useRef(0);

  React.useEffect(() => { setQ(value || ''); }, [value]);

  const search = (text) => {
    clearTimeout(timer.current);
    const t = text.trim();
    if (t.length < 3) { setResults([]); setLoading(false); return; }
    setLoading(true);
    const myReq = ++reqId.current;
    timer.current = setTimeout(async () => {
      try {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(t)}&limit=6&lang=en&osm_tag=amenity`;
        const res = await fetch(url);
        const data = await res.json();
        if (myReq !== reqId.current) return; // a newer keystroke won
        const feats = (data.features || []).map(f => {
          const p = f.properties || {};
          const name = p.name || p.street || p.city;
          const sub = [p.street && p.name ? p.street : null, p.city, p.state, p.country]
            .filter(Boolean).slice(0, 2).join(', ');
          return name ? { name, sub, key: `${p.osm_id || ''}:${p.osm_value || ''}` } : null;
        }).filter(Boolean);
        setResults(feats);
      } catch (_) { setResults([]); }
      finally { if (myReq === reqId.current) setLoading(false); }
    }, 300);
  };

  const onInput = (text) => {
    const v = text.slice(0, 60);
    setQ(v); onChange(v); setOpen(true); setHover(-1); search(v);
  };
  const pick = (r) => {
    setQ(r.name); onChange(r.name); setResults([]); setOpen(false);
  };

  React.useEffect(() => {
    const h = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => { document.removeEventListener('mousedown', h); clearTimeout(timer.current); };
  }, []);

  return (
    <div ref={boxRef} style={{ position: 'relative', marginTop: 16 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
        background: '#241B10', borderRadius: 14, border: '1px solid rgba(244,236,221,0.08)',
      }}>
        <Icon name="pin" size={16} color="#F4B73D" />
        <input
          value={q}
          onChange={(e) => onInput(e.target.value)}
          onFocus={() => { if (results.length) setOpen(true); }}
          placeholder="Tag a bar or venue (optional)"
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            color: '#F4ECDD', fontFamily: 'Geist, system-ui', fontSize: 14,
          }}
        />
        {loading && <span style={{ fontSize: 11, color: '#7A6B52', fontFamily: 'JetBrains Mono, monospace' }}>···</span>}
      </div>
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, zIndex: 60,
          background: '#241B10', border: '1px solid rgba(244,236,221,0.14)', borderRadius: 14,
          overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.55)', maxHeight: 250, overflowY: 'auto',
        }}>
          {results.map((r, i) => (
            <button
              key={r.key + i}
              onMouseDown={(e) => { e.preventDefault(); pick(r); }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(-1)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
                width: '100%', textAlign: 'left', padding: '11px 14px', cursor: 'pointer',
                background: hover === i ? 'rgba(244,183,61,0.10)' : 'none', border: 'none',
                borderBottom: i < results.length - 1 ? '1px solid rgba(244,236,221,0.06)' : 'none',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#F4ECDD', fontFamily: 'Geist, system-ui', fontSize: 14, fontWeight: 600 }}>
                <Icon name="pin" size={13} color="#F4B73D" /> {r.name}
              </span>
              {r.sub && <span style={{ color: '#B8A584', fontFamily: 'Geist, system-ui', fontSize: 12, paddingLeft: 21 }}>{r.sub}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ToastStep({ beer, toast, setToast, rating, photo, todayLogged, visibility, setVisibility, venueName, setVenueName, onSubmit }) {
  const remaining = 240 - toast.length;
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 24px', display: 'flex', flexDirection: 'column' }}>
      <SelectedBeerPill beer={beer} />
      <div style={{
        fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 30,
        color: '#F4ECDD', letterSpacing: '-0.03em', marginBottom: 6,
      }}>Raise a toast</div>
      <div style={{ fontSize: 13.5, color: '#B8A584', marginBottom: 18, fontFamily: 'Geist, system-ui' }}>
        Optional. Something nice, something funny, something honest.
      </div>

      <textarea
        value={toast}
        onChange={(e) => setToast(e.target.value.slice(0, 240))}
        placeholder="cracked one open after the longest tuesday of my life…"
        style={{
          width: '100%', minHeight: 120, padding: 16, boxSizing: 'border-box',
          background: '#241B10', border: '1px solid rgba(244,236,221,0.12)',
          borderRadius: 18, color: '#F4ECDD', outline: 'none', resize: 'none',
          fontFamily: 'Geist, system-ui', fontSize: 15, lineHeight: 1.5,
        }}
      />
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginTop: 8, fontSize: 11, color: '#7A6B52', fontFamily: 'JetBrains Mono, monospace',
      }}>
        <span>BE KIND · BE CURIOUS</span>
        <span>{remaining}</span>
      </div>

      {/* Venue (optional) — autocomplete against OpenStreetMap (Photon) */}
      <VenuePicker value={venueName} onChange={setVenueName} />

      {/* Visibility toggle */}
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <VisToggle
          active={visibility === 'public'}
          onClick={() => setVisibility('public')}
          icon="globe" title="Public" sub="Share to the feed"
        />
        <VisToggle
          active={visibility === 'private'}
          onClick={() => setVisibility('private')}
          icon="lock" title="Just me" sub="Counts, not seen"
        />
      </div>

      {/* Summary card */}
      <div style={{
        marginTop: 16, padding: 14, background: '#241B10', borderRadius: 16,
        border: '1px solid rgba(244,236,221,0.08)',
      }}>
        <Eyebrow style={{ marginBottom: 10 }}>Final pour</Eyebrow>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {photo ? (
            <img src={photo} alt="" style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'cover' }} />
          ) : (
            <BeerGlyph style={beer.style} size={56} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 600, fontSize: 15, color: '#F4ECDD' }}>{beer.name}</div>
            <div style={{ fontSize: 12, color: '#B8A584', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              {beer.brewery} · <StarRow value={rating} size={11} gap={1} />
            </div>
          </div>
        </div>
        <div style={{
          marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(244,236,221,0.08)',
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#B8A584',
          fontFamily: 'Geist, system-ui',
        }}>
          <Icon name="drop" size={14} color="#F4B73D" />
          This will be your <b style={{ color: '#F4ECDD' }}>{todayLogged + 1} of 5</b> today. Slow sips.
        </div>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 22 }}>
        <Btn onClick={onSubmit}>
          Pour it in <Icon name="check" size={22} strokeWidth={2.6} />
        </Btn>
      </div>
    </div>
  );
}

function VisToggle({ active, onClick, icon, title, sub }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '12px 14px', borderRadius: 14,
      background: active ? 'rgba(244,183,61,0.14)' : '#241B10',
      border: `1.5px solid ${active ? '#F4B73D' : 'rgba(244,236,221,0.08)'}`,
      color: '#F4ECDD', cursor: 'pointer', textAlign: 'left',
      display: 'flex', alignItems: 'center', gap: 10,
      transition: 'background 150ms, border-color 150ms',
    }}>
      <Icon name={icon} size={16} color={active ? '#F4B73D' : '#B8A584'} />
      <div>
        <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 600, fontSize: 13, color: active ? '#F4ECDD' : '#B8A584' }}>{title}</div>
        <div style={{ fontSize: 10.5, color: '#7A6B52', fontFamily: 'Geist, system-ui', marginTop: 1 }}>{sub}</div>
      </div>
    </button>
  );
}

function SelectedBeerPill({ beer }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
      background: '#241B10', border: '1px solid rgba(244,236,221,0.08)',
      borderRadius: 999, marginBottom: 22, alignSelf: 'flex-start',
    }}>
      <BeerGlyph style={beer.style} size={24} />
      <div style={{ fontFamily: 'Geist, system-ui', fontSize: 13, fontWeight: 600, color: '#F4ECDD' }}>{beer.name}</div>
      <div style={{ fontSize: 11, color: '#B8A584' }}>· {beer.brewery}</div>
    </div>
  );
}

// ── Same-day duplicate modal ──
function SameDayModal({ beer, onChoose, onCancel }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      zIndex: 200, display: 'flex', alignItems: 'flex-end',
    }}>
      <div style={{
        width: '100%', background: '#241B10', borderRadius: '24px 24px 0 0',
        padding: '24px 24px 36px', borderTop: '1px solid rgba(244,236,221,0.12)',
        animation: 'slide-up 250ms cubic-bezier(0.4,0,0.2,1)',
      }}>
        <style>{`@keyframes slide-up{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
        <div style={{ width: 40, height: 4, background: 'rgba(244,236,221,0.2)', borderRadius: 2, margin: '0 auto 18px' }} />
        <Icon name="rotate" size={26} color="#F4B73D" />
        <div style={{
          fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 24,
          color: '#F4ECDD', letterSpacing: '-0.02em', marginTop: 12,
        }}>Same beer, second time?</div>
        <div style={{ fontSize: 13.5, color: '#B8A584', marginTop: 8, lineHeight: 1.5, fontFamily: 'Geist, system-ui' }}>
          You already logged <b style={{ color: '#F4ECDD' }}>{beer.name}</b> today. Each pour still counts — just confirming.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
          <Btn onClick={onChoose}>Yep, another one</Btn>
          <Btn variant="ghost" onClick={onCancel}>Pick something else</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Add custom beer modal ──
function AddCustomBeerModal({ initialName, profile, db, onCancel, onAdd }) {
  const [name, setName] = React.useState(initialName || '');
  const [brewery, setBrewery] = React.useState('');
  const [style, setStyle] = React.useState('IPA');
  const [abv, setAbv] = React.useState('');
  const [region, setRegion] = React.useState('');

  // Dedup check
  const dup = React.useMemo(() => {
    if (!name.trim() || !brewery.trim()) return null;
    const nName = uiHelpers.normName(name);
    const nBrew = uiHelpers.normName(brewery);
    return db.find(b => uiHelpers.normName(b.name) === nName && uiHelpers.normName(b.brewery) === nBrew);
  }, [name, brewery, db]);

  const ok = name.trim().length > 1 && brewery.trim().length > 1 && !dup;

  const submit = () => {
    if (!ok) return;
    const id = window.beerIdSlug(`${name}-${brewery}`) + '-u';
    onAdd({
      id, name: name.trim(), brewery: brewery.trim(), style,
      abv: parseFloat(abv) || null, region: region.trim() || 'Unknown',
      source: 'user', added_by_member: profile.member_number,
    });
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      zIndex: 200, display: 'flex', alignItems: 'flex-end',
    }}>
      <div style={{
        width: '100%', background: '#241B10', borderRadius: '24px 24px 0 0',
        padding: '24px 24px 32px', borderTop: '1px solid rgba(244,236,221,0.12)',
        maxHeight: '85%', overflow: 'auto',
        animation: 'slide-up 250ms cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{ width: 40, height: 4, background: 'rgba(244,236,221,0.2)', borderRadius: 2, margin: '0 auto 18px' }} />
        <div style={{
          fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 24,
          color: '#F4ECDD', letterSpacing: '-0.02em', marginBottom: 4,
        }}>Add a custom beer</div>
        <div style={{ fontSize: 13, color: '#B8A584', marginBottom: 18, fontFamily: 'Geist, system-ui' }}>
          Adds to the community library for everyone.
        </div>
        <Field label="Beer name *">
          <TextInput value={name} onChange={setName} placeholder="e.g. Cosmic Punch" />
        </Field>
        <Field label="Brewery *">
          <TextInput value={brewery} onChange={setBrewery} placeholder="e.g. Local Brews" />
        </Field>
        <Field label="Style">
          <select value={style} onChange={(e) => setStyle(e.target.value)} style={{
            width: '100%', padding: 14, background: '#1A140C',
            border: '1px solid rgba(244,236,221,0.12)', borderRadius: 14,
            color: '#F4ECDD', outline: 'none', fontFamily: 'Geist, system-ui', fontSize: 15,
          }}>
            {(window.STYLES || []).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <div style={{ display: 'flex', gap: 10 }}>
          <Field label="ABV %">
            <TextInput value={abv} onChange={(v) => setAbv(v.replace(/[^\d.]/g, '').slice(0,5))} placeholder="6.5" />
          </Field>
          <Field label="Region (optional)">
            <TextInput value={region} onChange={setRegion} placeholder="Portland, OR" />
          </Field>
        </div>

        {dup && (
          <div style={{
            marginTop: 8, padding: 12, background: 'rgba(244,183,61,0.1)',
            border: '1px solid rgba(244,183,61,0.3)', borderRadius: 12,
            color: '#F4B73D', fontSize: 12.5, fontFamily: 'Geist, system-ui',
          }}>
            Already in the library: <b>{dup.name}</b> by {dup.brewery}.
            <button onClick={() => onAdd(dup)} style={{
              background: 'none', border: 0, color: '#F4B73D', textDecoration: 'underline',
              cursor: 'pointer', padding: 0, marginLeft: 4, font: 'inherit',
            }}>Use that one →</button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
          <Btn onClick={submit} disabled={!ok}>Add & continue</Btn>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12, flex: 1 }}>
      <Eyebrow style={{ marginBottom: 6 }}>{label}</Eyebrow>
      {children}
    </div>
  );
}
function TextInput({ value, onChange, placeholder }) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{
        width: '100%', padding: 14, boxSizing: 'border-box',
        background: '#1A140C', border: '1px solid rgba(244,236,221,0.12)',
        borderRadius: 14, color: '#F4ECDD', outline: 'none',
        fontFamily: 'Geist, system-ui', fontSize: 15,
      }} />
  );
}

// ── Style bucket ──
function bucketStyle(s) {
  if (!s) return 'Other';
  const l = s.toLowerCase();
  if (l.includes('ipa')) return 'IPA';
  if (l.includes('stout') || l.includes('porter')) return 'Stout';
  if (l.includes('lager') || l.includes('helles') || l.includes('vienna')) return 'Lager';
  if (l.includes('pils')) return 'Pils';
  if (l.includes('sour') || l.includes('gose') || l.includes('berliner') || l.includes('lambic') || l.includes('wild')) return 'Sour';
  if (l.includes('wheat') || l.includes('hefe') || l.includes('wit')) return 'Wheat';
  if (l.includes('saison') || l.includes('farmhouse')) return 'Saison';
  if (l.includes('belgian') || l.includes('tripel') || l.includes('dubbel') || l.includes('quad')) return 'Belgian';
  if (l.includes('pale ale') || l.includes('apa')) return 'Pale';
  return 'Other';
}
function bucketRegion(r) {
  if (!r) return 'Intl';
  const l = r.toLowerCase();
  if (l.includes('usa')) {
    if (/(california|oregon|washington|nevada|arizona)/.test(l)) return 'West';
    if (/(new york|massachusetts|vermont|maine|rhode|connecticut|pennsylvania|new hampshire|new jersey)/.test(l)) return 'NE';
    if (/(florida|georgia|texas|north carolina|south carolina|tennessee|virginia|louisiana|alabama)/.test(l)) return 'South';
    if (/(illinois|michigan|wisconsin|ohio|indiana|missouri|iowa|colorado|minnesota|kansas)/.test(l)) return 'MW';
    return 'MW';
  }
  return 'Intl';
}

// ── Cap wall ──
function CapWall({ profile, onClose }) {
  const [secsToReset, setSecsToReset] = React.useState(0);
  React.useEffect(() => {
    const tick = () => {
      const now = new Date(); const next = new Date(now); next.setHours(24, 0, 0, 0);
      setSecsToReset(Math.floor((next - now) / 1000));
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);
  const h = Math.floor(secsToReset / 3600);
  const m = Math.floor((secsToReset % 3600) / 60);
  return (
    <div style={{
      height: '100%', background: '#1A140C',
      display: 'flex', flexDirection: 'column', padding: '60px 24px 32px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#F4ECDD', cursor: 'pointer', padding: 0 }}>
          <Icon name="x" size={26} />
        </button>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 18 }}>
        <PintGlass size={110} fill={1} />
        <div style={{
          fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 36,
          color: '#F4ECDD', letterSpacing: '-0.03em', lineHeight: 1.05,
        }}>That's five.<br />Nice work.</div>
        <div style={{ fontSize: 15, color: '#B8A584', maxWidth: 300, lineHeight: 1.5, fontFamily: 'Geist, system-ui' }}>
          We cap daily logs at five. The community's in no rush — neither's your liver. Catch you tomorrow.
        </div>
        <div style={{
          marginTop: 8, padding: '10px 18px', background: '#241B10',
          border: '1px solid rgba(244,183,61,0.2)', borderRadius: 999,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#F4B73D',
          letterSpacing: '0.06em',
        }}>RESETS IN {String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Btn onClick={onClose}>Sounds fair</Btn>
        <button style={{
          background: 'none', border: 'none', color: '#B8A584', cursor: 'pointer',
          fontFamily: 'Geist, system-ui', fontSize: 13, padding: 10, textDecoration: 'underline',
        }}>Need support? Resources here</button>
      </div>
    </div>
  );
}

window.LogFlow = LogFlow;
window.CapWall = CapWall;
window.bucketStyle = bucketStyle;
window.bucketRegion = bucketRegion;
