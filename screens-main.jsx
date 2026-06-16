// screens-main.jsx — Home, Log flow, Toasts, Stats

// ─────────────────────────────────────────────────────────────
// HOME — global counter + breakdown graphs + recent toasts
// ─────────────────────────────────────────────────────────────
const HomeScreen = ({ theme, count, setScreen, todayLogged }) => {
  const goal = 1000000;
  const pct = Math.min(100, (count / goal) * 100);
  const formatted = count.toLocaleString();

  return (
    <div style={{ paddingBottom: 100 }}>
      <TopBar
        title="1M BEERS"
        theme={theme}
        big
        right={
          <button onClick={() => setScreen('settings')} style={{ background: 'none', border: 'none', padding: 0, color: theme.text, cursor: 'pointer' }}>
            <Icon name="settings" size={22} />
          </button>
        }
      />

      {/* Hero counter */}
      <div style={{ padding: '8px 20px 24px' }}>
        <div style={{
          fontFamily: 'Geist, system-ui', fontSize: 11, fontWeight: 600,
          letterSpacing: 1.4, textTransform: 'uppercase',
          color: theme.textDim, marginBottom: 8,
        }}>The world has poured</div>
        <Counter value={count} theme={theme} />
        <div style={{
          fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 600,
          fontSize: 18, color: theme.text, marginTop: 6, letterSpacing: -0.3,
        }}>beers · together</div>

        {/* progress */}
        <div style={{ marginTop: 22 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 8,
            fontFamily: 'Geist, system-ui', fontSize: 12, color: theme.textDim,
            whiteSpace: 'nowrap',
          }}>
            <span>{pct.toFixed(2)}% to 1M</span>
            <span>{(goal - count).toLocaleString()} left</span>
          </div>
          <div style={{ height: 14, borderRadius: 999, background: theme.surface, overflow: 'hidden', position: 'relative' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: `linear-gradient(90deg, ${theme.accent2}, ${theme.accent})`,
              borderRadius: 999, position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: -2, right: -2, width: 18, height: 18, borderRadius: '50%',
                background: theme.foam, border: `2px solid ${theme.bg}`,
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Big CTA */}
      <div style={{ padding: '0 20px 28px' }}>
        <button onClick={() => setScreen('log')} style={{
          width: '100%', borderRadius: 26, padding: '20px 22px',
          background: theme.accent, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          color: theme.accentText,
          boxShadow: `0 12px 30px ${theme.accent}30`,
        }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 800, fontSize: 22, letterSpacing: -0.5 }}>Log a beer</div>
            <div style={{ fontFamily: 'Geist, system-ui', fontSize: 12, fontWeight: 500, opacity: 0.7, marginTop: 2 }}>{todayLogged}/5 today · keep it chill</div>
          </div>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'rgba(26,20,12,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="plus" size={26} stroke={2.6} />
          </div>
        </button>
      </div>

      {/* Breakdown graphs */}
      <SectionTitle theme={theme}>The breakdown</SectionTitle>
      <BreakdownGrid theme={theme} />

      <div style={{ height: 8 }} />

      <SectionTitle theme={theme}>Fresh toasts</SectionTitle>
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {TOASTS.slice(0, 3).map((t, i) => <ToastCardCompact key={i} toast={t} theme={theme} />)}
        <button onClick={() => setScreen('toasts')} style={{
          background: 'none', border: 'none', padding: '10px 0',
          color: theme.accent, fontFamily: 'Geist, system-ui', fontWeight: 600, fontSize: 14,
          textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
        }}>See all toasts <Icon name="chevron" size={16} /></button>
      </div>
    </div>
  );
};

// Counter with rolling odometer
const Counter = ({ value, theme }) => {
  const str = value.toLocaleString();
  return (
    <div style={{
      fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 800,
      fontSize: 68, lineHeight: 0.95, color: theme.text,
      letterSpacing: -3, display: 'flex',
      fontFeatureSettings: '"tnum" 1',
    }}>
      {[...str].map((ch, i) => (
        <span key={i} style={{
          display: 'inline-block',
          color: /\d/.test(ch) ? theme.accent : theme.text,
          minWidth: /\d/.test(ch) ? 38 : 'auto',
          textAlign: 'center',
        }}>{ch}</span>
      ))}
    </div>
  );
};

const SectionTitle = ({ children, theme, action }) => (
  <div style={{
    padding: '4px 20px 12px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
  }}>
    <div style={{
      fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 22,
      color: theme.text, letterSpacing: -0.5,
    }}>{children}</div>
    {action}
  </div>
);

// Breakdown — 4 mini graphs
const BreakdownGrid = ({ theme }) => {
  return (
    <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
      <MiniCard theme={theme} title="By style" subtitle="last 24h">
        <BarMini theme={theme} data={[
          { l: 'IPA', v: 0.85 },
          { l: 'Lager', v: 0.72 },
          { l: 'Stout', v: 0.41 },
          { l: 'Pils', v: 0.55 },
          { l: 'Sour', v: 0.28 },
        ]} />
      </MiniCard>
      <MiniCard theme={theme} title="By region" subtitle="this week">
        <Donut theme={theme} segments={[
          { v: 38, c: theme.accent },
          { v: 24, c: theme.accent2 },
          { v: 18, c: theme.foam },
          { v: 12, c: '#7FB069' },
          { v: 8, c: theme.textDim },
        ]} labels={['West', 'NE', 'South', 'MW', 'Intl']} />
      </MiniCard>
      <MiniCard theme={theme} title="By age" subtitle="active users">
        <BarMini theme={theme} data={[
          { l: '21-25', v: 0.62 },
          { l: '26-30', v: 0.91 },
          { l: '31-35', v: 0.48 },
          { l: '36+', v: 0.28 },
        ]} />
      </MiniCard>
      <MiniCard theme={theme} title="Pour rate" subtitle="beers/min">
        <Spark theme={theme} />
      </MiniCard>
    </div>
  );
};

const MiniCard = ({ theme, title, subtitle, children }) => (
  <div style={{
    background: theme.surface, borderRadius: 18, padding: 14,
    display: 'flex', flexDirection: 'column', gap: 10,
    border: `1px solid ${theme.line}`,
  }}>
    <div>
      <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 14, color: theme.text }}>{title}</div>
      <div style={{ fontFamily: 'Geist, system-ui', fontSize: 10.5, color: theme.textDim, marginTop: 1 }}>{subtitle}</div>
    </div>
    <div style={{ flex: 1, minHeight: 70 }}>{children}</div>
  </div>
);

const BarMini = ({ theme, data }) => (
  <div style={{ display: 'flex', alignItems: 'stretch', gap: 6, height: 70 }}>
    {data.map((d, i) => (
      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 4, height: '100%' }}>
        <div style={{
          width: '100%', height: `${Math.max(d.v * 54, 4)}px`,
          background: i === 1 ? theme.accent : theme.accent2,
          opacity: i === 1 ? 1 : 0.55,
          borderRadius: 4,
        }} />
        <div style={{ fontFamily: 'Geist, system-ui', fontSize: 9, color: theme.textDim, letterSpacing: -0.1 }}>{d.l}</div>
      </div>
    ))}
  </div>
);

const Donut = ({ theme, segments, labels }) => {
  const total = segments.reduce((a, s) => a + s.v, 0);
  let acc = 0;
  const r = 28, c = 36;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx={c} cy={c} r={r} fill="none" stroke={theme.surface2} strokeWidth="10" />
        {segments.map((s, i) => {
          const len = (s.v / total) * (2 * Math.PI * r);
          const start = (acc / total) * (2 * Math.PI * r);
          acc += s.v;
          return (
            <circle key={i} cx={c} cy={c} r={r} fill="none"
              stroke={s.c} strokeWidth="10"
              strokeDasharray={`${len} ${(2 * Math.PI * r) - len}`}
              strokeDashoffset={-start}
              transform={`rotate(-90 ${c} ${c})`}
            />
          );
        })}
        <text x={c} y={c + 4} textAnchor="middle" fontFamily="Bricolage Grotesque" fontWeight="700" fontSize="13" fill={theme.text}>{total}%</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2.5, fontFamily: 'Geist, system-ui', fontSize: 9.5 }}>
        {segments.slice(0, 3).map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, color: theme.textDim }}>
            <div style={{ width: 7, height: 7, borderRadius: 2, background: s.c }} />
            {labels[i]} {s.v}%
          </div>
        ))}
      </div>
    </div>
  );
};

const Spark = ({ theme }) => {
  const pts = [12, 18, 14, 22, 19, 28, 24, 32, 38, 31, 42, 48, 41, 52];
  const max = Math.max(...pts);
  const w = 150, h = 70;
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i / (pts.length - 1)) * w} ${h - (p / max) * (h - 8)}`).join(' ');
  return (
    <div>
      <div style={{
        fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 22, color: theme.text,
        letterSpacing: -0.5,
      }}>52<span style={{ fontSize: 12, color: theme.textDim, marginLeft: 4, fontWeight: 500 }}>/min</span></div>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block', marginTop: -8 }}>
        <defs>
          <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={theme.accent} stopOpacity="0.4" />
            <stop offset="1" stopColor={theme.accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill="url(#spark-grad)" />
        <path d={d} fill="none" stroke={theme.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Toast card (compact for home, full for feed)
// ─────────────────────────────────────────────────────────────
const ToastCardCompact = ({ toast, theme }) => (
  <div style={{
    background: theme.surface, borderRadius: 18, padding: 14,
    display: 'flex', gap: 12, alignItems: 'flex-start',
    border: `1px solid ${theme.line}`,
  }}>
    <Avatar name={toast.user} size={36} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
        <span style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 14, color: theme.text }}>{toast.user}</span>
        <span style={{ fontFamily: 'Geist, system-ui', fontSize: 11, color: theme.textFaint }}>· {toast.time}</span>
      </div>
      <div style={{ fontFamily: 'Geist, system-ui', fontSize: 12, color: theme.textDim, marginBottom: 4 }}>
        on <span style={{ color: theme.accent, fontWeight: 600 }}>{toast.beer}</span>
      </div>
      <div style={{ fontFamily: 'Geist, system-ui', fontSize: 13, color: theme.text, lineHeight: 1.4 }}>{toast.text}</div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// LOG FLOW — multi-step
// ─────────────────────────────────────────────────────────────
const LogFlow = ({ theme, onClose, onComplete, todayLogged }) => {
  const [step, setStep] = React.useState(0);
  const [selectedBeer, setSelectedBeer] = React.useState(null);
  const [rating, setRating] = React.useState(0);
  const [toast, setToast] = React.useState('');
  const [search, setSearch] = React.useState('');

  const atLimit = todayLogged >= 5;

  const filtered = BEERS.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.brewery.toLowerCase().includes(search.toLowerCase()) ||
    b.style.toLowerCase().includes(search.toLowerCase())
  );

  const steps = ['Pick a beer', 'Rate it', 'Add a toast'];

  if (atLimit) {
    return (
      <div style={{ padding: 20, paddingTop: 60, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <TopBar title="Easy there" theme={theme} onClose={onClose} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '0 20px' }}>
          <div style={{ fontSize: 64, marginBottom: 18 }}>🫶</div>
          <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 800, fontSize: 28, color: theme.text, letterSpacing: -0.7, marginBottom: 12 }}>
            That's 5 for today.
          </div>
          <div style={{ fontFamily: 'Geist, system-ui', fontSize: 15, color: theme.textDim, lineHeight: 1.5, maxWidth: 280, marginBottom: 28 }}>
            We cap daily logs at five. The community is in no rush — your liver shouldn't be either. Catch you tomorrow.
          </div>
          <div style={{ width: '100%', maxWidth: 320 }}>
            <Btn theme={theme} onClick={onClose}>Sounds fair</Btn>
          </div>
          <button style={{
            background: 'none', border: 'none', marginTop: 14, padding: 10,
            color: theme.textDim, fontFamily: 'Geist, system-ui', fontSize: 12, cursor: 'pointer',
            textDecoration: 'underline',
          }}>Need support? Tap here</button>
        </div>
      </div>
    );
  }

  const next = () => step < 2 ? setStep(step + 1) : onComplete({ beer: selectedBeer, rating, toast });
  const back = () => step > 0 ? setStep(step - 1) : onClose();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: theme.bg }}>
      <TopBar
        title={steps[step]}
        theme={theme}
        onClose={step === 0 ? onClose : undefined}
        onBack={step > 0 ? () => setStep(step - 1) : undefined}
        right={
          <div style={{ display: 'flex', gap: 4 }}>
            {steps.map((_, i) => (
              <div key={i} style={{
                width: i === step ? 18 : 6, height: 6, borderRadius: 3,
                background: i <= step ? theme.accent : theme.surface,
                transition: 'all 0.3s',
              }} />
            ))}
          </div>
        }
      />

      <div style={{ flex: 1, overflow: 'auto', padding: '4px 20px 20px' }}>
        {step === 0 && (
          <div>
            <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 800, fontSize: 28, color: theme.text, letterSpacing: -0.7, marginBottom: 6 }}>
              What are you drinking?
            </div>
            <div style={{ fontFamily: 'Geist, system-ui', fontSize: 13, color: theme.textDim, marginBottom: 18 }}>
              Search or pick one of yours
            </div>
            <div style={{
              background: theme.surface, borderRadius: 16, padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
              border: `1px solid ${theme.line}`,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.textDim} strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4-4" />
              </svg>
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Hopfully Yours, IPA, Foam Co..."
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: theme.text, fontFamily: 'Geist, system-ui', fontSize: 15,
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(b => (
                <button key={b.id} onClick={() => { setSelectedBeer(b); setStep(1); }} style={{
                  background: selectedBeer?.id === b.id ? theme.surface2 : theme.surface,
                  borderRadius: 16, padding: 12, display: 'flex', gap: 12, alignItems: 'center',
                  border: `1px solid ${theme.line}`, cursor: 'pointer', textAlign: 'left',
                }}>
                  <PhotoBox label={b.style} w={52} h={52} radius={12} tone={b.tone} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 15, color: theme.text, marginBottom: 2 }}>{b.name}</div>
                    <div style={{ fontFamily: 'Geist, system-ui', fontSize: 12, color: theme.textDim }}>{b.brewery} · {b.style} · {b.abv}%</div>
                  </div>
                  <Icon name="chevron" size={18} color={theme.textFaint} />
                </button>
              ))}
              {filtered.length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', color: theme.textDim, fontFamily: 'Geist, system-ui', fontSize: 13 }}>
                  No matches. Add it as a custom pour →
                </div>
              )}
            </div>
          </div>
        )}

        {step === 1 && selectedBeer && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: theme.surface, borderRadius: 18, marginBottom: 24, border: `1px solid ${theme.line}` }}>
              <PhotoBox label={selectedBeer.style} w={60} h={60} radius={14} tone={selectedBeer.tone} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 17, color: theme.text }}>{selectedBeer.name}</div>
                <div style={{ fontFamily: 'Geist, system-ui', fontSize: 12, color: theme.textDim }}>{selectedBeer.brewery} · {selectedBeer.abv}%</div>
              </div>
            </div>

            <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 800, fontSize: 28, color: theme.text, letterSpacing: -0.7, marginBottom: 8 }}>
              How was it?
            </div>
            <div style={{ fontFamily: 'Geist, system-ui', fontSize: 13, color: theme.textDim, marginBottom: 24 }}>
              No pressure. There are no wrong opinions, just different palates.
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setRating(n)} style={{
                  background: 'none', border: 'none', padding: 4, cursor: 'pointer',
                  transition: 'transform 0.15s',
                  transform: rating === n ? 'scale(1.15)' : 'scale(1)',
                }}>
                  <Icon name={n <= rating ? 'star' : 'star-o'} size={42} color={n <= rating ? theme.accent : theme.textFaint} stroke={2} />
                </button>
              ))}
            </div>

            <div style={{ textAlign: 'center', minHeight: 22, fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 600, fontSize: 16, color: theme.accent, marginBottom: 16 }}>
              {['', 'Hard pass', 'Eh, fine', 'Solid', 'Real good', 'Liquid gold'][rating]}
            </div>
          </div>
        )}

        {step === 2 && selectedBeer && (
          <div>
            <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 800, fontSize: 28, color: theme.text, letterSpacing: -0.7, marginBottom: 8 }}>
              Raise a toast
            </div>
            <div style={{ fontFamily: 'Geist, system-ui', fontSize: 13, color: theme.textDim, marginBottom: 18 }}>
              A few words for the community. Optional, but encouraged.
            </div>

            <textarea
              value={toast} onChange={(e) => setToast(e.target.value.slice(0, 240))}
              placeholder="cracked one open after a long day, this hit different..."
              style={{
                width: '100%', minHeight: 140, padding: 16, boxSizing: 'border-box',
                background: theme.surface, border: `1px solid ${theme.line}`,
                borderRadius: 18, color: theme.text, outline: 'none', resize: 'none',
                fontFamily: 'Geist, system-ui', fontSize: 15, lineHeight: 1.5,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: 'Geist, system-ui', fontSize: 11, color: theme.textFaint }}>
              <span>Be kind. Be curious.</span>
              <span>{toast.length}/240</span>
            </div>

            <div style={{ marginTop: 22, padding: 14, background: theme.surface, borderRadius: 16, border: `1px solid ${theme.line}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Icon name="shield" size={16} color={theme.accent} />
                <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 13, color: theme.text }}>Heads up</div>
              </div>
              <div style={{ fontFamily: 'Geist, system-ui', fontSize: 12, color: theme.textDim, lineHeight: 1.5 }}>
                This will be your <b style={{ color: theme.text }}>{todayLogged + 1}{['st','nd','rd'][todayLogged] || 'th'} of 5</b> beers today. Pace yourself — the community is patient.
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '12px 20px 28px', background: theme.bg, borderTop: `1px solid ${theme.line}` }}>
        <Btn theme={theme} onClick={next} >
          {step === 0 ? 'Choose a beer' : step === 1 ? (rating === 0 ? 'Pick a rating' : 'Continue') : 'Pour it in'}
          {step < 2 && rating > 0 && <Icon name="arrow-r" size={20} />}
          {step === 2 && <Icon name="check" size={22} stroke={2.6} />}
        </Btn>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// TOASTS feed
// ─────────────────────────────────────────────────────────────
const ToastsScreen = ({ theme }) => {
  const [tab, setTab] = React.useState('recent');
  const sorted = tab === 'recent' ? TOASTS : [...TOASTS].sort((a, b) => b.upvotes - a.upvotes);
  return (
    <div style={{ paddingBottom: 100 }}>
      <TopBar title="Toasts" theme={theme} big />
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{
          fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 800, fontSize: 30,
          color: theme.text, letterSpacing: -0.8, marginBottom: 6,
        }}>What folks are saying</div>
        <div style={{ fontFamily: 'Geist, system-ui', fontSize: 13, color: theme.textDim, marginBottom: 16 }}>
          Reviews, ramblings, hot takes from the pour line.
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <Pill theme={theme} active={tab === 'recent'} onClick={() => setTab('recent')}>Most recent</Pill>
          <Pill theme={theme} active={tab === 'popular'} onClick={() => setTab('popular')}>Most clinked</Pill>
          <Pill theme={theme} active={tab === 'friends'} onClick={() => setTab('friends')}>Nearby</Pill>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sorted.map((t, i) => <ToastCard key={i} toast={t} theme={theme} />)}
        </div>
      </div>
    </div>
  );
};

const ToastCard = ({ toast, theme }) => {
  const [up, setUp] = React.useState(false);
  return (
    <div style={{
      background: theme.surface, borderRadius: 20, padding: 16,
      border: `1px solid ${theme.line}`,
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <Avatar name={toast.user} size={42} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 15, color: theme.text }}>{toast.user}</div>
          <div style={{ fontFamily: 'Geist, system-ui', fontSize: 12, color: theme.textDim }}>
            on <span style={{ color: theme.accent, fontWeight: 600 }}>{toast.beer}</span> · {toast.time}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 1 }}>
          {[1,2,3,4,5].map(n => (
            <Icon key={n} name="star" size={11} color={n <= toast.rating ? theme.accent : theme.textFaint} />
          ))}
        </div>
      </div>
      <div style={{ fontFamily: 'Geist, system-ui', fontSize: 14.5, color: theme.text, lineHeight: 1.5, marginBottom: 12 }}>
        "{toast.text}"
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setUp(!up)} style={{
          background: up ? theme.accent : 'transparent', color: up ? theme.accentText : theme.text,
          border: `1px solid ${up ? theme.accent : theme.line}`,
          borderRadius: 999, padding: '6px 12px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5,
          fontFamily: 'Geist, system-ui', fontWeight: 600, fontSize: 12,
        }}>
          <Icon name="thumb" size={14} stroke={2.2} />
          {toast.upvotes + (up ? 1 : 0)}
        </button>
        <button style={{
          background: 'transparent', color: theme.textDim,
          border: `1px solid ${theme.line}`,
          borderRadius: 999, padding: '6px 12px', cursor: 'pointer',
          fontFamily: 'Geist, system-ui', fontWeight: 600, fontSize: 12,
        }}>Reply</button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────
const StatsScreen = ({ theme, count }) => {
  const milestones = [
    { n: 100000, label: 'First 100K', done: true, when: 'Mar 2026' },
    { n: 250000, label: 'Quarter pour', done: true, when: 'Apr 2026' },
    { n: 500000, label: 'Halfway hops', done: count >= 500000, when: count >= 500000 ? 'Apr 2026' : 'soon' },
    { n: 750000, label: '3/4 toast', done: count >= 750000, when: count >= 750000 ? 'this week' : '~Jun 2026' },
    { n: 1000000, label: 'One million.', done: count >= 1000000, when: count >= 1000000 ? '🎉' : '~Aug 2026' },
  ];
  const styles = [
    { l: 'IPA', v: 0.85, c: theme.accent },
    { l: 'Lager', v: 0.72, c: theme.accent2 },
    { l: 'Pilsner', v: 0.55, c: theme.foam },
    { l: 'Stout', v: 0.41, c: '#7FB069' },
    { l: 'Wheat', v: 0.34, c: '#9B6BCC' },
    { l: 'Sour', v: 0.28, c: '#4FA3C7' },
    { l: 'Saison', v: 0.18, c: theme.textDim },
  ];
  return (
    <div style={{ paddingBottom: 100 }}>
      <TopBar title="Stats" theme={theme} big />
      <div style={{ padding: '0 20px' }}>
        <div style={{
          fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 800, fontSize: 30,
          color: theme.text, letterSpacing: -0.8, marginBottom: 6,
        }}>The big picture</div>
        <div style={{ fontFamily: 'Geist, system-ui', fontSize: 13, color: theme.textDim, marginBottom: 20 }}>
          Aggregate trends. No individual data — your pours stay yours.
        </div>

        {/* Milestones */}
        <div style={{ background: theme.surface, borderRadius: 22, padding: 18, marginBottom: 18, border: `1px solid ${theme.line}` }}>
          <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 16, color: theme.text, marginBottom: 14 }}>Community milestones</div>
          <div style={{ position: 'relative', paddingLeft: 4 }}>
            {milestones.map((m, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '8px 0',
                position: 'relative',
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: m.done ? theme.accent : theme.surface2,
                  border: m.done ? 'none' : `2px solid ${theme.textFaint}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {m.done && <Icon name="check" size={14} stroke={3} color={theme.accentText} />}
                </div>
                {i < milestones.length - 1 && (
                  <div style={{
                    position: 'absolute', left: 10, top: 28, bottom: -8,
                    width: 2, background: m.done ? theme.accent : theme.line,
                  }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 14, color: theme.text }}>
                    {m.label} <span style={{ color: theme.textDim, fontWeight: 500 }}>· {m.n.toLocaleString()}</span>
                  </div>
                  <div style={{ fontFamily: 'Geist, system-ui', fontSize: 11, color: theme.textDim, marginTop: 1 }}>{m.when}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Style breakdown — large */}
        <div style={{ background: theme.surface, borderRadius: 22, padding: 18, marginBottom: 18, border: `1px solid ${theme.line}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 16, color: theme.text }}>Most-poured styles</div>
            <div style={{ fontFamily: 'Geist, system-ui', fontSize: 11, color: theme.textDim }}>last 7 days</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {styles.map((s, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontFamily: 'Geist, system-ui', fontSize: 12 }}>
                  <span style={{ color: theme.text, fontWeight: 600 }}>{s.l}</span>
                  <span style={{ color: theme.textDim }}>{Math.round(s.v * 12500)}</span>
                </div>
                <div style={{ height: 8, background: theme.surface2, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${s.v * 100}%`, background: s.c, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Region + Age side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
          <MiniCard theme={theme} title="Regions" subtitle="active 7d">
            <Donut theme={theme} segments={[
              { v: 38, c: theme.accent },
              { v: 24, c: theme.accent2 },
              { v: 18, c: theme.foam },
              { v: 12, c: '#7FB069' },
              { v: 8, c: theme.textDim },
            ]} labels={['West', 'NE', 'South', 'MW', 'Intl']} />
          </MiniCard>
          <MiniCard theme={theme} title="Age mix" subtitle="loggers">
            <BarMini theme={theme} data={[
              { l: '21-25', v: 0.62 },
              { l: '26-30', v: 0.91 },
              { l: '31-35', v: 0.48 },
              { l: '36+', v: 0.28 },
            ]} />
          </MiniCard>
        </div>

        {/* Breweries spotlight */}
        <div style={{ background: theme.surface, borderRadius: 22, padding: 18, border: `1px solid ${theme.line}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 16, color: theme.text }}>Brewery partners nearby</div>
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', marginLeft: -18, marginRight: -18, padding: '0 18px', scrollbarWidth: 'none' }}>
            {BREWERIES.map((b, i) => (
              <div key={i} style={{ flexShrink: 0, width: 130 }}>
                <PhotoBox label={b.name} h={100} radius={14} tone={b.tone} />
                <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 13, color: theme.text, marginTop: 8 }}>{b.name}</div>
                <div style={{ fontFamily: 'Geist, system-ui', fontSize: 11, color: theme.textDim }}>{b.miles}mi · {b.beers} beers</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { HomeScreen, LogFlow, ToastsScreen, StatsScreen, ToastCard, ToastCardCompact, Counter });
