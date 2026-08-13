// profile-settings.jsx — Profile screen + Settings + recovery

function ProfileScreen({ profile, onNavigate }) {
  const [history, setHistory] = React.useState([]);
  const [stats, setStats] = React.useState({ logs: 0, styles: 0, breweries: 0 });
  const [todayLogged, setTodayLogged] = React.useState(0);

  React.useEffect(() => {
    (async () => {
      const hist = (await storage_util.get('user:log_history', false)) || [];
      const daily = await storage_util.get('user:daily_count', false);
      setHistory(hist);
      const today = uiHelpers.todayLocalISO();
      setTodayLogged(daily?.date === today ? daily.count : 0);
      const styles = new Set(hist.map(h => h.style).filter(Boolean));
      const breweries = new Set(hist.map(h => h.brewery).filter(Boolean));
      setStats({ logs: hist.length, styles: styles.size, breweries: breweries.size });
    })();
  }, []);

  return (
    <div style={{ paddingBottom: 110 }}>
      {/* Header */}
      <div style={{
        padding: '64px 20px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <Eyebrow>Your account</Eyebrow>
          <div style={{
            fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 30,
            color: '#F4ECDD', letterSpacing: '-0.03em', marginTop: 4,
          }}>{profile?.handle || 'you'}</div>
          <div style={{ fontSize: 12, color: '#B8A584', marginTop: 4, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em' }}>
            MEMBER #{profile?.member_number || '—'} · JOINED {profile?.joined_at ? new Date(profile.joined_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }).toUpperCase() : '—'}
          </div>
        </div>
        <button onClick={() => onNavigate('settings')} style={{
          width: 40, height: 40, borderRadius: '50%', background: '#241B10',
          border: '1px solid rgba(244,236,221,0.08)', color: '#F4ECDD', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><Icon name="settings" size={18} /></button>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Stat row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 18 }}>
          {[
            { v: stats.logs, l: 'beers logged' },
            { v: stats.styles, l: 'styles tried' },
            { v: stats.breweries, l: 'breweries' },
          ].map((s, i) => (
            <div key={i} style={{
              background: '#241B10', borderRadius: 18, padding: 14, textAlign: 'center',
              border: '1px solid rgba(244,236,221,0.08)',
            }}>
              <div style={{
                fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 28,
                color: '#F4B73D', letterSpacing: '-0.03em',
              }}>{uiHelpers.fmtNum(s.v)}</div>
              <div style={{ fontSize: 10.5, color: '#B8A584', marginTop: 2, fontFamily: 'Geist, system-ui' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Today */}
        <div style={{
          background: '#241B10', borderRadius: 18, padding: 16, marginBottom: 18,
          border: '1px solid rgba(244,236,221,0.08)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{
              fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 14,
              color: '#F4ECDD', letterSpacing: '-0.01em',
            }}>Today's pours</div>
            <div style={{ fontSize: 12, color: '#B8A584', fontWeight: 600, fontFamily: 'Geist, system-ui' }}>{todayLogged} / 5</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{
                flex: 1, height: 32, borderRadius: 10,
                background: i < todayLogged ? '#F4B73D' : '#2E2415',
                border: i < todayLogged ? 0 : '1px dashed rgba(244,236,221,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {i < todayLogged && <Icon name="check" size={16} strokeWidth={3} color="#1A140C" />}
              </div>
            ))}
          </div>
        </div>

        <Eyebrow style={{ marginBottom: 10, paddingLeft: 4 }}>Your log</Eyebrow>
        {history.length === 0 ? (
          <div style={{
            padding: '32px 20px', background: '#241B10', borderRadius: 18,
            border: '1px dashed rgba(244,236,221,0.12)',
            textAlign: 'center',
          }}>
            <PintGlass size={50} fill={0.1} />
            <div style={{ marginTop: 10, color: '#F4ECDD', fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 600, fontSize: 15 }}>
              First pour goes here.
            </div>
            <div style={{ marginTop: 4, color: '#B8A584', fontSize: 12.5, fontFamily: 'Geist, system-ui' }}>
              Hit the + when you crack one open.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.slice(0, 20).map((h, i) => (
              <HistoryRow key={h.id || i} log={h} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryRow({ log }) {
  return (
    <div style={{
      background: '#241B10', borderRadius: 14, padding: 12,
      display: 'flex', alignItems: 'center', gap: 12,
      border: '1px solid rgba(244,236,221,0.07)',
    }}>
      {log.photo ? (
        <img src={log.photo} alt="" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: `linear-gradient(135deg, ${uiHelpers.beerTone(log.style)[0]}, ${uiHelpers.beerTone(log.style)[1]})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'inset 0 -8px 12px rgba(0,0,0,0.18)',
        }}><Icon name="beer" size={20} color="#F4ECDD" /></div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 600, fontSize: 14, color: '#F4ECDD',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{log.beer_name}</div>
        <div style={{ fontSize: 11.5, color: '#B8A584', marginTop: 1, fontFamily: 'Geist, system-ui' }}>
          {log.brewery} · {timeAgo(log.ts)} ago
        </div>
      </div>
      <StarRow value={log.rating || 0} size={11} gap={1} />
    </div>
  );
}

// ── Settings ──
function SettingsScreen({ profile, onBack, onReset }) {
  const [resetting, setResetting] = React.useState(false);
  const [soundOn, setSoundOn] = React.useState(profile?.sound_enabled !== false);
  const toggleSound = async () => {
    const next = !soundOn;
    setSoundOn(next);
    SoundManager.setEnabled(next);
    if (next) { try { SoundManager.play('ting'); } catch {} }
    const p = (await storage_util.get('user:profile', false)) || profile;
    await storage_util.set('user:profile', { ...p, sound_enabled: next }, false);
  };
  const exportData = async () => {
    const [hist, daily, prof] = await Promise.all([
      storage_util.get('user:log_history', false),
      storage_util.get('user:daily_count', false),
      storage_util.get('user:profile', false),
    ]);
    const payload = { exported_at: new Date().toISOString(), profile: prof, history: hist, daily };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `1m-beers-export-${Date.now()}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ paddingBottom: 110 }}>
      <div style={{
        padding: '56px 20px 18px', display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: '#F4ECDD', cursor: 'pointer', padding: 0,
        }}><Icon name="chevronLeft" size={24} /></button>
        <div style={{
          fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 24,
          color: '#F4ECDD', letterSpacing: '-0.02em',
        }}>Settings</div>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Safety card */}
        <div style={{
          background: 'linear-gradient(135deg, #F4B73D, #D97F2C)',
          borderRadius: 22, padding: 20, marginBottom: 22, color: '#1A140C',
        }}>
          <Icon name="heart" size={22} strokeWidth={2.4} />
          <div style={{
            fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 22,
            letterSpacing: '-0.02em', marginTop: 10, marginBottom: 6,
          }}>Drinking should feel good.</div>
          <div style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.85, marginBottom: 14, fontFamily: 'Geist, system-ui' }}>
            If it doesn't, support is one tap away. Confidential, free, 24/7.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a href="tel:18006624357" style={{
              padding: '8px 14px', background: 'rgba(26,20,12,0.22)', borderRadius: 999,
              color: '#1A140C', fontFamily: 'Geist, system-ui', fontWeight: 600, fontSize: 12,
              textDecoration: 'none',
            }}>SAMHSA Helpline</a>
            <a href="https://www.aa.org/find-aa" target="_blank" rel="noopener noreferrer" style={{
              padding: '8px 14px', background: 'rgba(26,20,12,0.22)', borderRadius: 999,
              color: '#1A140C', fontFamily: 'Geist, system-ui', fontWeight: 600, fontSize: 12,
              textDecoration: 'none',
            }}>AA meetings near me</a>
          </div>
        </div>

        <SettingsGroup label="Account">
          <SettingsRow label="Handle" value={profile?.handle || '—'} mono />
          <SettingsRow label="Member #" value={`#${profile?.member_number || '—'}`} mono />
          <SettingsRow label="Email" value={profile?.email || profile?.phone || '—'} mono />
          <SettingsRow label="Joined" value={profile?.joined_at ? new Date(profile.joined_at).toLocaleDateString() : '—'} mono last />
        </SettingsGroup>

        <SettingsGroup label="Preferences">
          <div style={{
            padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 600, fontSize: 14, color: '#F4ECDD' }}>Sound effects</div>
              <div style={{ fontSize: 11.5, color: '#B8A584', marginTop: 2, fontFamily: 'Geist, system-ui' }}>Clinks, pours, milestone chimes</div>
            </div>
            <button onClick={toggleSound} role="switch" aria-checked={soundOn} aria-label="Toggle sound effects" style={{
              width: 44, height: 26, borderRadius: 999,
              background: soundOn ? '#F4B73D' : '#2E2415',
              border: '1px solid rgba(244,236,221,0.08)', position: 'relative', cursor: 'pointer', flexShrink: 0,
              transition: 'background 0.2s',
            }}>
              <div style={{
                position: 'absolute', top: 2, left: soundOn ? 20 : 2, width: 20, height: 20, borderRadius: '50%',
                background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>
        </SettingsGroup>

        <SettingsGroup label="Data">
          <SettingsRow label="Export my pours" sub="Downloads a JSON file" onClick={exportData} chevron />
          <SettingsRow label="Pending writes" value="0" mono last />
        </SettingsGroup>

        <SettingsGroup label="About">
          <SettingsRow label="Privacy" sub="What we store, what we don't" chevron />
          <SettingsRow label="Terms" chevron />
          <SettingsRow label="Send feedback" sub="We read every one" chevron last />
        </SettingsGroup>

        <SettingsGroup label="Danger zone">
          <SettingsRow
            label="Reset account"
            sub="Wipes your local data. Cannot undo."
            danger
            onClick={() => setResetting(true)}
            chevron last
          />
        </SettingsGroup>

        <div style={{
          textAlign: 'center', padding: 22,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#7A6B52', letterSpacing: '0.12em',
        }}>1M BEERS · v1.0.0 · MADE WITH FOAM</div>
      </div>

      {resetting && (
        <ResetConfirmModal
          onCancel={() => setResetting(false)}
          onConfirm={async () => {
            await storage_util.set('user:profile', null, false);
            await storage_util.set('user:log_history', [], false);
            await storage_util.set('user:daily_count', null, false);
            setResetting(false);
            onReset();
          }}
        />
      )}
    </div>
  );
}

function SettingsGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <Eyebrow style={{ marginBottom: 8, paddingLeft: 4 }}>{label}</Eyebrow>
      <div style={{
        background: '#241B10', borderRadius: 18, overflow: 'hidden',
        border: '1px solid rgba(244,236,221,0.07)',
      }}>{children}</div>
    </div>
  );
}

function SettingsRow({ label, value, sub, mono, danger, onClick, chevron, last }) {
  return (
    <div onClick={onClick} style={{
      padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
      borderBottom: last ? 0 : '1px solid rgba(244,236,221,0.06)',
      cursor: onClick ? 'pointer' : 'default',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 600, fontSize: 14,
          color: danger ? '#E07A5F' : '#F4ECDD',
        }}>{label}</div>
        {sub && <div style={{ fontSize: 11.5, color: '#B8A584', marginTop: 2, fontFamily: 'Geist, system-ui' }}>{sub}</div>}
      </div>
      {value && (
        <div style={{
          fontFamily: mono ? 'JetBrains Mono, monospace' : 'Geist, system-ui',
          fontSize: 13, color: '#B8A584',
        }}>{value}</div>
      )}
      {chevron && <Icon name="chevronRight" size={16} color="#7A6B52" />}
    </div>
  );
}

function ResetConfirmModal({ onCancel, onConfirm }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      zIndex: 200, display: 'flex', alignItems: 'flex-end',
    }}>
      <div style={{
        width: '100%', background: '#241B10', borderRadius: '24px 24px 0 0',
        padding: '24px 24px 36px', borderTop: '1px solid rgba(224,122,95,0.25)',
        animation: 'slide-up 250ms cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{ width: 40, height: 4, background: 'rgba(244,236,221,0.2)', borderRadius: 2, margin: '0 auto 18px' }} />
        <Icon name="shield" size={26} color="#E07A5F" />
        <div style={{
          fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 24,
          color: '#F4ECDD', letterSpacing: '-0.02em', marginTop: 10,
        }}>Reset everything?</div>
        <div style={{ fontSize: 13.5, color: '#B8A584', marginTop: 6, lineHeight: 1.5, fontFamily: 'Geist, system-ui' }}>
          Wipes your local profile, log, and daily count. The community counter is unaffected. Cannot undo.
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <Btn variant="ghost" onClick={onCancel}>Keep it</Btn>
          <Btn variant="danger" onClick={onConfirm}>Reset</Btn>
        </div>
      </div>
    </div>
  );
}

window.ProfileScreen = ProfileScreen;
window.SettingsScreen = SettingsScreen;
