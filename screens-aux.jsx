// screens-aux.jsx — Onboarding, Profile, Breweries, Settings, Milestone celebration

// ─────────────────────────────────────────────────────────────
// ONBOARDING — multi-page intro + age gate + phone auth
// ─────────────────────────────────────────────────────────────
const Onboarding = ({ theme, onComplete }) => {
  const [step, setStep] = React.useState(0);
  const [phone, setPhone] = React.useState('');
  const [code, setCode] = React.useState('');
  const [dob, setDob] = React.useState('');

  const slides = [
    {
      eyebrow: 'Welcome to',
      title: '1M Beers',
      body: "Log a beer. Add to a global count. That's it. Built for people who like beer and the people who like beer.",
      visual: <HeroVisual theme={theme} />,
    },
    {
      eyebrow: 'The premise',
      title: 'A million beers,\nclinked together.',
      body: "Not a race. A long, friendly toast. We aggregate — your individual log stays private.",
      visual: <PremiseVisual theme={theme} />,
    },
    {
      eyebrow: 'House rules',
      title: '5 a day. 21+. Be cool.',
      body: "We cap daily logs. We verify age. We cheer for breweries you've never heard of. Resources are one tap away.",
      visual: <RulesVisual theme={theme} />,
    },
  ];

  if (step < 3) {
    const s = slides[step];
    return (
      <div style={{ height: '100%', background: theme.bg, display: 'flex', flexDirection: 'column', padding: '60px 24px 28px' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {slides.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i <= step ? theme.accent : theme.surface,
            }} />
          ))}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {s.visual}
          <div style={{
            fontFamily: 'Geist, system-ui', fontSize: 11, fontWeight: 600,
            letterSpacing: 1.6, textTransform: 'uppercase', color: theme.accent, marginTop: 32, marginBottom: 10,
          }}>{s.eyebrow}</div>
          <div style={{
            fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 800,
            fontSize: 44, lineHeight: 1.0, color: theme.text, letterSpacing: -1.5,
            whiteSpace: 'pre-line', marginBottom: 16,
          }}>{s.title}</div>
          <div style={{
            fontFamily: 'Geist, system-ui', fontSize: 16, color: theme.textDim, lineHeight: 1.5, maxWidth: 320,
          }}>{s.body}</div>
        </div>
        <Btn theme={theme} onClick={() => setStep(step + 1)}>
          {step === 2 ? 'Get started' : 'Next'} <Icon name="arrow-r" size={20} />
        </Btn>
      </div>
    );
  }

  // age gate
  if (step === 3) {
    const ok = dob.length === 10;
    return (
      <div style={{ height: '100%', background: theme.bg, display: 'flex', flexDirection: 'column', padding: '60px 24px 28px' }}>
        <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: theme.text, padding: 0, alignSelf: 'flex-start', cursor: 'pointer', marginBottom: 20 }}>
          <Icon name="chevron-l" size={26} />
        </button>
        <div style={{ flex: 1 }}>
          <Icon name="lock" size={28} color={theme.accent} />
          <div style={{
            fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 800,
            fontSize: 36, lineHeight: 1.05, color: theme.text, letterSpacing: -1, marginTop: 16, marginBottom: 10,
          }}>Quick check —<br/>are you 21+?</div>
          <div style={{ fontFamily: 'Geist, system-ui', fontSize: 14, color: theme.textDim, marginBottom: 32 }}>
            US legal drinking age. We don't store this beyond verification.
          </div>
          <div style={{ marginBottom: 12, fontFamily: 'Geist, system-ui', fontSize: 12, color: theme.textDim, letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: 600 }}>Date of birth</div>
          <input
            value={dob}
            onChange={(e) => {
              let v = e.target.value.replace(/\D/g, '').slice(0, 8);
              if (v.length > 4) v = v.slice(0,2) + '/' + v.slice(2,4) + '/' + v.slice(4);
              else if (v.length > 2) v = v.slice(0,2) + '/' + v.slice(2);
              setDob(v);
            }}
            placeholder="MM / DD / YYYY"
            style={{
              width: '100%', padding: '20px 22px', boxSizing: 'border-box',
              background: theme.surface, border: `1.5px solid ${ok ? theme.accent : theme.line}`,
              borderRadius: 18, color: theme.text, outline: 'none',
              fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 22, letterSpacing: 1,
            }}
          />
        </div>
        <Btn theme={theme} onClick={() => ok && setStep(4)} style={{ opacity: ok ? 1 : 0.45 }}>Verify age</Btn>
      </div>
    );
  }

  // phone
  if (step === 4) {
    const ok = phone.replace(/\D/g, '').length >= 10;
    return (
      <div style={{ height: '100%', background: theme.bg, display: 'flex', flexDirection: 'column', padding: '60px 24px 28px' }}>
        <button onClick={() => setStep(3)} style={{ background: 'none', border: 'none', color: theme.text, padding: 0, alignSelf: 'flex-start', cursor: 'pointer', marginBottom: 20 }}>
          <Icon name="chevron-l" size={26} />
        </button>
        <div style={{ flex: 1 }}>
          <Icon name="phone" size={28} color={theme.accent} />
          <div style={{
            fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 800,
            fontSize: 36, lineHeight: 1.05, color: theme.text, letterSpacing: -1, marginTop: 16, marginBottom: 10,
          }}>What's your<br/>number?</div>
          <div style={{ fontFamily: 'Geist, system-ui', fontSize: 14, color: theme.textDim, marginBottom: 32 }}>
            We send a 6-digit code. No password to forget.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{
              padding: '20px 16px', background: theme.surface,
              border: `1.5px solid ${theme.line}`, borderRadius: 18,
              color: theme.text, fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 18,
            }}>🇺🇸 +1</div>
            <input
              value={phone}
              onChange={(e) => {
                let v = e.target.value.replace(/\D/g, '').slice(0, 10);
                if (v.length > 6) v = `(${v.slice(0,3)}) ${v.slice(3,6)}-${v.slice(6)}`;
                else if (v.length > 3) v = `(${v.slice(0,3)}) ${v.slice(3)}`;
                else if (v.length > 0) v = `(${v}`;
                setPhone(v);
              }}
              placeholder="(555) 123-4567"
              style={{
                flex: 1, padding: '20px 22px', boxSizing: 'border-box',
                background: theme.surface, border: `1.5px solid ${ok ? theme.accent : theme.line}`,
                borderRadius: 18, color: theme.text, outline: 'none',
                fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 18, letterSpacing: 0.5,
              }}
            />
          </div>
        </div>
        <Btn theme={theme} onClick={() => ok && setStep(5)} style={{ opacity: ok ? 1 : 0.45 }}>Send code</Btn>
      </div>
    );
  }

  // code
  if (step === 5) {
    const ok = code.length === 6;
    return (
      <div style={{ height: '100%', background: theme.bg, display: 'flex', flexDirection: 'column', padding: '60px 24px 28px' }}>
        <button onClick={() => setStep(4)} style={{ background: 'none', border: 'none', color: theme.text, padding: 0, alignSelf: 'flex-start', cursor: 'pointer', marginBottom: 20 }}>
          <Icon name="chevron-l" size={26} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 800,
            fontSize: 36, lineHeight: 1.05, color: theme.text, letterSpacing: -1, marginBottom: 10,
          }}>Code please.</div>
          <div style={{ fontFamily: 'Geist, system-ui', fontSize: 14, color: theme.textDim, marginBottom: 32 }}>
            Sent to {phone || '(555) 123-4567'}. Try <b style={{ color: theme.accent }}>123456</b>.
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
            {[0,1,2,3,4,5].map(i => (
              <div key={i} style={{
                flex: 1, aspectRatio: '1', maxWidth: 50, background: theme.surface,
                border: `1.5px solid ${code[i] ? theme.accent : theme.line}`,
                borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 800, fontSize: 24, color: theme.text,
              }}>{code[i] || ''}</div>
            ))}
          </div>
          <input
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
          />
          <div style={{ marginTop: 22, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[1,2,3,4,5,6,7,8,9,0].map(n => (
              <button key={n} onClick={() => setCode((code + n).slice(0, 6))} style={{
                width: 'calc((100% - 30px) / 5)', padding: '14px 0',
                background: theme.surface, border: `1px solid ${theme.line}`,
                borderRadius: 12, color: theme.text, cursor: 'pointer',
                fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 18,
              }}>{n}</button>
            ))}
          </div>
        </div>
        <Btn theme={theme} onClick={() => ok && onComplete()} style={{ opacity: ok ? 1 : 0.45 }}>Cheers, let's go</Btn>
      </div>
    );
  }
  return null;
};

const HeroVisual = ({ theme }) => (
  <div style={{
    width: '100%', height: 220, borderRadius: 24, position: 'relative', overflow: 'hidden',
    background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <div style={{
      fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 800,
      fontSize: 88, color: theme.accentText, letterSpacing: -3, lineHeight: 1,
      textShadow: `4px 4px 0 ${theme.bg}30`,
    }}>1M</div>
    <div style={{
      position: 'absolute', bottom: 18, left: 18, fontFamily: 'JetBrains Mono, monospace',
      fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase',
      color: theme.accentText, opacity: 0.7,
    }}>EST. 2026 · ONE BEER AT A TIME</div>
  </div>
);

const PremiseVisual = ({ theme }) => {
  const dots = Array.from({ length: 60 }, (_, i) => i);
  return (
    <div style={{
      width: '100%', height: 220, borderRadius: 24, padding: 24, boxSizing: 'border-box',
      background: theme.surface, border: `1px solid ${theme.line}`,
      display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 8, alignContent: 'center',
    }}>
      {dots.map(i => (
        <div key={i} style={{
          aspectRatio: 1, borderRadius: '50%',
          background: i < 42 ? theme.accent : theme.surface2,
          opacity: i < 42 ? (0.4 + (i / 60) * 0.6) : 0.4,
        }} />
      ))}
    </div>
  );
};

const RulesVisual = ({ theme }) => (
  <div style={{
    width: '100%', height: 220, borderRadius: 24, padding: 20, boxSizing: 'border-box',
    background: theme.surface, border: `1px solid ${theme.line}`,
    display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center',
  }}>
    {[
      { ico: 'shield', t: 'Daily 5-beer cap', s: 'No speedruns. Pace yourselves.' },
      { ico: 'lock', t: '21+ verified', s: 'No exceptions, no shortcuts.' },
      { ico: 'heart', t: 'Resources, one tap', s: 'Support is in the menu.' },
    ].map((r, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12, background: theme.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}><Icon name={r.ico} size={18} color={theme.accentText} stroke={2.4} /></div>
        <div>
          <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 14, color: theme.text }}>{r.t}</div>
          <div style={{ fontFamily: 'Geist, system-ui', fontSize: 12, color: theme.textDim }}>{r.s}</div>
        </div>
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────
const ProfileScreen = ({ theme, todayLogged, totalLogged }) => {
  const log = [
    { beer: 'Hopfully Yours', brewery: 'Foam Co.', date: 'Today · 4:32p', rating: 4 },
    { beer: 'Slow Pour', brewery: 'Pour Decisions', date: 'Today · 1:18p', rating: 5 },
    { beer: 'Lager Than Life', brewery: 'Tinroof', date: 'Yesterday', rating: 4 },
    { beer: 'Saison du Soleil', brewery: 'Wildwood', date: 'Sat, Apr 27', rating: 4 },
    { beer: 'Bitter End', brewery: 'Tinroof', date: 'Fri, Apr 26', rating: 3 },
  ];
  return (
    <div style={{ paddingBottom: 100 }}>
      <TopBar title="You" theme={theme} big />
      <div style={{ padding: '0 20px' }}>
        {/* Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <Avatar name="You" size={68} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 800, fontSize: 24, color: theme.text, letterSpacing: -0.5 }}>you.</div>
            <div style={{ fontFamily: 'Geist, system-ui', fontSize: 13, color: theme.textDim }}>cheers since Mar 2026</div>
          </div>
        </div>

        {/* Stat row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 18 }}>
          {[
            { v: totalLogged, l: 'beers logged' },
            { v: '14', l: 'styles tried' },
            { v: '6', l: 'breweries' },
          ].map((s, i) => (
            <div key={i} style={{
              background: theme.surface, borderRadius: 16, padding: 14, textAlign: 'center',
              border: `1px solid ${theme.line}`,
            }}>
              <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 800, fontSize: 26, color: theme.accent, letterSpacing: -0.8 }}>{s.v}</div>
              <div style={{ fontFamily: 'Geist, system-ui', fontSize: 10.5, color: theme.textDim, marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Today */}
        <div style={{
          background: theme.surface, borderRadius: 18, padding: 16, marginBottom: 18,
          border: `1px solid ${theme.line}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 14, color: theme.text }}>Today's pours</div>
            <div style={{ fontFamily: 'Geist, system-ui', fontSize: 12, color: theme.textDim, fontWeight: 600 }}>{todayLogged} / 5</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{
                flex: 1, height: 32, borderRadius: 10,
                background: i < todayLogged ? theme.accent : theme.surface2,
                border: i < todayLogged ? 'none' : `1px dashed ${theme.line}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {i < todayLogged && <Icon name="check" size={16} stroke={3} color={theme.accentText} />}
              </div>
            ))}
          </div>
        </div>

        <SectionTitle theme={theme}>Your log</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {log.map((l, i) => (
            <div key={i} style={{
              background: theme.surface, borderRadius: 14, padding: 12,
              display: 'flex', alignItems: 'center', gap: 12,
              border: `1px solid ${theme.line}`,
            }}>
              <PhotoBox label="" w={44} h={44} radius={10} tone={['amber','foam','copper','dark'][i % 4]} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 14, color: theme.text }}>{l.beer}</div>
                <div style={{ fontFamily: 'Geist, system-ui', fontSize: 11.5, color: theme.textDim }}>{l.brewery} · {l.date}</div>
              </div>
              <div style={{ display: 'flex', gap: 1 }}>
                {[1,2,3,4,5].map(n => (
                  <Icon key={n} name="star" size={10} color={n <= l.rating ? theme.accent : theme.textFaint} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// BREWERIES (partner discovery)
// ─────────────────────────────────────────────────────────────
const BreweriesScreen = ({ theme, onBack }) => {
  return (
    <div style={{ paddingBottom: 40, height: '100%', overflow: 'auto' }}>
      <TopBar title="Breweries" theme={theme} onBack={onBack} />
      <div style={{ padding: '0 20px' }}>
        <div style={{
          fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 800, fontSize: 30,
          color: theme.text, letterSpacing: -0.8, marginBottom: 6,
        }}>Local pour partners</div>
        <div style={{ fontFamily: 'Geist, system-ui', fontSize: 13, color: theme.textDim, marginBottom: 18 }}>
          Log a beer at a partner, get a token toward your next pint.
        </div>

        {/* Featured */}
        <div style={{ borderRadius: 22, overflow: 'hidden', marginBottom: 18, border: `1px solid ${theme.line}`, background: theme.surface }}>
          <PhotoBox label="FEATURED · BEER OF THE WEEK" h={140} radius={0} tone="copper" />
          <div style={{ padding: 16 }}>
            <div style={{ fontFamily: 'Geist, system-ui', fontSize: 11, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: theme.accent, marginBottom: 6 }}>Beer of the week</div>
            <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 800, fontSize: 22, color: theme.text, letterSpacing: -0.5 }}>Hopfully Yours</div>
            <div style={{ fontFamily: 'Geist, system-ui', fontSize: 13, color: theme.textDim, marginTop: 4 }}>Foam Co. · Hazy IPA · 6.8%</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <Btn theme={theme} size="md" full={false} style={{ flex: 1 }}>Claim a token</Btn>
              <button style={{
                width: 48, height: 48, borderRadius: 999, background: 'transparent',
                border: `1.5px solid ${theme.line}`, color: theme.text, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Icon name="map" size={20} /></button>
            </div>
          </div>
        </div>

        <SectionTitle theme={theme}>Near you</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {BREWERIES.map((b, i) => (
            <div key={i} style={{
              background: theme.surface, borderRadius: 18, padding: 12,
              display: 'flex', alignItems: 'center', gap: 12,
              border: `1px solid ${theme.line}`,
            }}>
              <PhotoBox label="" w={56} h={56} radius={14} tone={b.tone} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 15, color: theme.text }}>{b.name}</div>
                <div style={{ fontFamily: 'Geist, system-ui', fontSize: 12, color: theme.textDim, marginTop: 2 }}>
                  <Icon name="pin" size={11} /> {b.city} · {b.miles}mi · {b.beers} beers
                </div>
              </div>
              <Pill theme={theme} active>Visit</Pill>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SETTINGS / safety
// ─────────────────────────────────────────────────────────────
const SettingsScreen = ({ theme, onBack, themeKey, setThemeKey }) => {
  const [notifs, setNotifs] = React.useState({ toasts: true, milestones: true, polls: false, brewery: true });
  return (
    <div style={{ paddingBottom: 40, height: '100%', overflow: 'auto', background: theme.bg }}>
      <TopBar title="Settings" theme={theme} onBack={onBack} />
      <div style={{ padding: '0 20px' }}>
        {/* Safety card */}
        <div style={{
          background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
          borderRadius: 22, padding: 20, marginBottom: 20, color: theme.accentText,
        }}>
          <Icon name="heart" size={22} stroke={2.4} color={theme.accentText} />
          <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 800, fontSize: 22, letterSpacing: -0.5, marginTop: 10, marginBottom: 6 }}>
            Drinking should feel good.
          </div>
          <div style={{ fontFamily: 'Geist, system-ui', fontSize: 13, lineHeight: 1.5, opacity: 0.8, marginBottom: 14 }}>
            If it doesn't, support is one tap away. Confidential, free, 24/7.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button style={{
              padding: '8px 14px', background: 'rgba(26,20,12,0.22)', border: 'none',
              borderRadius: 999, color: theme.accentText, fontFamily: 'Geist, system-ui', fontWeight: 600, fontSize: 12, cursor: 'pointer',
            }}>SAMHSA Helpline</button>
            <button style={{
              padding: '8px 14px', background: 'rgba(26,20,12,0.22)', border: 'none',
              borderRadius: 999, color: theme.accentText, fontFamily: 'Geist, system-ui', fontWeight: 600, fontSize: 12, cursor: 'pointer',
            }}>AA meetings near me</button>
          </div>
        </div>

        {/* Theme */}
        <SettingGroup theme={theme} title="Look & feel">
          <div style={{ padding: '14px 16px', display: 'flex', gap: 8 }}>
            {Object.entries(THEMES).map(([k, t]) => (
              <button key={k} onClick={() => setThemeKey(k)} style={{
                flex: 1, padding: '12px 8px', borderRadius: 14,
                background: t.bg, border: `2px solid ${themeKey === k ? theme.accent : theme.line}`,
                cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center',
              }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: t.accent }} />
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: t.accent2 }} />
                </div>
                <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 12, color: t.text }}>{t.name}</div>
              </button>
            ))}
          </div>
        </SettingGroup>

        {/* Notifications */}
        <SettingGroup theme={theme} title="Notifications">
          {[
            ['toasts', 'New toasts on your beers', 'when someone clinks your review'],
            ['milestones', 'Community milestones', 'big counter celebrations'],
            ['polls', 'Beer polls & weekly picks', 'mostly weekly digest'],
            ['brewery', 'Local brewery offers', 'partners near you'],
          ].map(([k, l, s], i, arr) => (
            <ToggleRow key={k} theme={theme} label={l} sub={s} on={notifs[k]} onChange={() => setNotifs({ ...notifs, [k]: !notifs[k] })} last={i === arr.length - 1} />
          ))}
        </SettingGroup>

        <SettingGroup theme={theme} title="Privacy">
          <LinkRow theme={theme} label="Export my pours" sub="JSON, anytime" />
          <LinkRow theme={theme} label="Hide me from nearby feed" toggle />
          <LinkRow theme={theme} label="Delete account" danger last />
        </SettingGroup>

        <SettingGroup theme={theme} title="About">
          <LinkRow theme={theme} label="Privacy policy" />
          <LinkRow theme={theme} label="Terms of service" />
          <LinkRow theme={theme} label="Send feedback" sub="we read every one" last />
        </SettingGroup>

        <div style={{ textAlign: 'center', padding: 22, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: theme.textFaint, letterSpacing: 1.2 }}>
          1M BEERS · v0.9.4 · MADE WITH FOAM
        </div>
      </div>
    </div>
  );
};

const SettingGroup = ({ theme, title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ fontFamily: 'Geist, system-ui', fontSize: 11, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: theme.textDim, marginBottom: 8, paddingLeft: 4 }}>{title}</div>
    <div style={{ background: theme.surface, borderRadius: 18, overflow: 'hidden', border: `1px solid ${theme.line}` }}>{children}</div>
  </div>
);

const ToggleRow = ({ theme, label, sub, on, onChange, last }) => (
  <div style={{
    padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
    borderBottom: last ? 'none' : `1px solid ${theme.line}`,
  }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 600, fontSize: 14, color: theme.text }}>{label}</div>
      {sub && <div style={{ fontFamily: 'Geist, system-ui', fontSize: 11.5, color: theme.textDim, marginTop: 2 }}>{sub}</div>}
    </div>
    <button onClick={onChange} style={{
      width: 44, height: 26, borderRadius: 999, background: on ? theme.accent : theme.surface2,
      border: `1px solid ${theme.line}`, position: 'relative', cursor: 'pointer', flexShrink: 0,
      transition: 'background 0.2s',
    }}>
      <div style={{
        position: 'absolute', top: 2, left: on ? 20 : 2, width: 20, height: 20, borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
      }} />
    </button>
  </div>
);

const LinkRow = ({ theme, label, sub, danger, toggle, last }) => (
  <div style={{
    padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
    borderBottom: last ? 'none' : `1px solid ${theme.line}`,
  }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 600, fontSize: 14, color: danger ? theme.danger : theme.text }}>{label}</div>
      {sub && <div style={{ fontFamily: 'Geist, system-ui', fontSize: 11.5, color: theme.textDim, marginTop: 2 }}>{sub}</div>}
    </div>
    {toggle ? <ToggleRow theme={theme} label="" on={false} onChange={() => {}} last /> : <Icon name="chevron" size={16} color={theme.textFaint} />}
  </div>
);

// ─────────────────────────────────────────────────────────────
// MILESTONE celebration (full-screen overlay)
// ─────────────────────────────────────────────────────────────
const MilestoneOverlay = ({ theme, milestone, onClose }) => {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: `radial-gradient(circle at 50% 40%, ${theme.accent2}, ${theme.bg})`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 30, textAlign: 'center', overflow: 'hidden',
    }}>
      {/* confetti */}
      {Array.from({ length: 24 }).map((_, i) => {
        const colors = [theme.accent, theme.foam, '#7FB069', '#E26B5A', '#9B6BCC'];
        return (
          <div key={i} style={{
            position: 'absolute',
            left: `${(i * 13) % 100}%`,
            top: `${(i * 17) % 100}%`,
            width: 8, height: 12,
            background: colors[i % colors.length],
            transform: `rotate(${(i * 37) % 360}deg)`,
            opacity: 0.9,
            animation: `confetti-${i % 3} 2.5s ease-out infinite`,
          }} />
        );
      })}
      <style>{`
        @keyframes confetti-0 { 0%{transform:translateY(-30px) rotate(0)} 100%{transform:translateY(40px) rotate(360deg)} }
        @keyframes confetti-1 { 0%{transform:translateY(-20px) rotate(0)} 100%{transform:translateY(50px) rotate(-360deg)} }
        @keyframes confetti-2 { 0%{transform:translateY(-40px) rotate(0)} 100%{transform:translateY(30px) rotate(180deg)} }
      `}</style>

      <div style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
        letterSpacing: 1.6, textTransform: 'uppercase', color: theme.text, opacity: 0.7, marginBottom: 12,
      }}>WE JUST CROSSED</div>
      <div style={{
        fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 800,
        fontSize: 76, color: theme.foam, letterSpacing: -3, lineHeight: 0.95,
      }}>{milestone.toLocaleString()}</div>
      <div style={{
        fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 800, fontSize: 24, color: theme.text,
        letterSpacing: -0.6, marginTop: 6, marginBottom: 18,
      }}>beers, together.</div>
      <div style={{
        fontFamily: 'Geist, system-ui', fontSize: 14, color: theme.text, opacity: 0.8,
        maxWidth: 280, lineHeight: 1.5, marginBottom: 30,
      }}>That's a lot of foam. Pour a small one and clink at your screen — we'll feel it.</div>
      <div style={{ width: '100%', maxWidth: 300 }}>
        <Btn theme={theme} variant="ghost" onClick={onClose} style={{ background: theme.text, color: theme.bg }}>
          Cheers <Icon name="arrow-r" size={20} />
        </Btn>
      </div>
    </div>
  );
};

Object.assign(window, { Onboarding, ProfileScreen, BreweriesScreen, SettingsScreen, MilestoneOverlay });
