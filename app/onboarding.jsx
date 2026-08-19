// onboarding.jsx — 5-step onboarding flow with clink animation
// Steps: welcome → age gate (DOB) → email → email code → handle/display name
// All state persists immediately to storage.user:profile on completion.

function Onboarding({ onComplete }) {
  const [step, setStep] = React.useState(0);
  const [dob, setDob] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [code, setCode] = React.useState('');
  const [handle, setHandle] = React.useState('');
  const [animatingClink, setAnimatingClink] = React.useState(true);
  const [authError, setAuthError] = React.useState('');
  const [sending, setSending] = React.useState(false);

  // Real email-code auth via Supabase when configured; demo fallback otherwise.
  // (Email auth is on by default in Supabase, so just having a client is enough.)
  const hasRealAuth = typeof window !== 'undefined' && !!window.__SUPABASE;

  // animate clink on first paint
  React.useEffect(() => {
    if (step !== 0) setAnimatingClink(false);
    else {
      setAnimatingClink(false);
      const t = setTimeout(() => setAnimatingClink(true), 100);
      return () => clearTimeout(t);
    }
  }, [step]);

  const finish = async () => {
    // If we used real Supabase auth, the auth.uid() is now stable across devices.
    // We persist it on the profile so future logins recognize this user.
    let authUserId = null;
    if (hasRealAuth) {
      try {
        const { data } = await window.__SUPABASE.auth.getUser();
        authUserId = data?.user?.id || null;
      } catch {}
    }
    const memberNo = await storage_util.incrementSharedCounter('community:members', 1);
    const profile = {
      member_number: memberNo,
      handle: handle.trim() || `member${memberNo}`,
      dob, email, joined_at: Date.now(),
      created_id: uiHelpers.uuid(),
      auth_user_id: authUserId,
      email_verified: !!authUserId,
    };
    await storage_util.set('user:profile', profile, false);
    onComplete(profile);
  };

  // Email the 6-digit code via Supabase (or skip in demo mode)
  const sendCode = async () => {
    setAuthError('');
    if (!hasRealAuth) { setStep(3); return; }
    setSending(true);
    try {
      const addr = email.trim().toLowerCase();
      const { error } = await window.__SUPABASE.auth.signInWithOtp({
        email: addr,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setStep(3);
    } catch (e) {
      setAuthError(e.message || 'Could not send code. Try again.');
    } finally { setSending(false); }
  };

  // Verify the emailed code via Supabase (or accept any 6 digits in demo mode)
  const verifyCode = async () => {
    setAuthError('');
    if (!hasRealAuth) { setStep(4); return; }
    setSending(true);
    try {
      const addr = email.trim().toLowerCase();
      // Returning users verify with type 'email'; brand-new signups confirm
      // with a 'signup' token. Try 'email' first, then fall back to 'signup'.
      let { error } = await window.__SUPABASE.auth.verifyOtp({ email: addr, token: code, type: 'email' });
      if (error) {
        const retry = await window.__SUPABASE.auth.verifyOtp({ email: addr, token: code, type: 'signup' });
        if (retry.error) throw retry.error;
      }
      setStep(4);
    } catch (e) {
      setAuthError(e.message || 'Wrong code. Try again.');
      setCode('');
    } finally { setSending(false); }
  };

  const steps = [
    <Step0 key="0" onNext={() => setStep(1)} animatingClink={animatingClink} />,
    <Step1Age key="1" dob={dob} setDob={setDob} onBack={() => setStep(0)} onNext={() => setStep(2)} />,
    <Step2Email key="2" email={email} setEmail={setEmail} onBack={() => setStep(1)} onNext={sendCode} sending={sending} error={authError} hasRealAuth={hasRealAuth} />,
    <Step3Code key="3" email={email} code={code} setCode={setCode} onBack={() => setStep(2)} onNext={verifyCode} sending={sending} error={authError} hasRealAuth={hasRealAuth} />,
    <Step4Handle key="4" handle={handle} setHandle={setHandle} onBack={() => setStep(3)} onNext={finish} />,
  ];

  return (
    <div style={{
      height: '100%', background: '#1A140C', position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {step > 0 && (
        <div style={{
          display: 'flex', gap: 4, padding: '70px 24px 0',
        }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i <= step ? '#F4B73D' : 'rgba(244,236,221,0.1)',
              transition: 'background 300ms',
            }} />
          ))}
        </div>
      )}
      {steps[step]}
    </div>
  );
}

// ── Step 0: Welcome with clink ──
function Step0({ onNext, animatingClink }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', padding: '60px 24px 32px',
    }}>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 32,
      }}>
        {/* Clink animation — wind up, swing IN, tap with a spark + recoil */}
        <div style={{ position: 'relative', width: 240, height: 160, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <style>{`
            @keyframes clink-l {
              0%   { transform: translateX(-16px) rotate(-9deg); }
              12%  { transform: translateX(-24px) rotate(-15deg); }
              30%  { transform: translateX(4px)   rotate(9deg); }
              39%  { transform: translateX(-6px)  rotate(3deg); }
              48%  { transform: translateX(1px)   rotate(6deg); }
              66%  { transform: translateX(-16px) rotate(-9deg); }
              100% { transform: translateX(-16px) rotate(-9deg); }
            }
            @keyframes clink-r {
              0%   { transform: translateX(16px) rotate(9deg); }
              12%  { transform: translateX(24px) rotate(15deg); }
              30%  { transform: translateX(-4px) rotate(-9deg); }
              39%  { transform: translateX(6px)  rotate(-3deg); }
              48%  { transform: translateX(-1px) rotate(-6deg); }
              66%  { transform: translateX(16px) rotate(9deg); }
              100% { transform: translateX(16px) rotate(9deg); }
            }
            @keyframes clink-spark {
              0%, 25% { opacity: 0; transform: translateX(-50%) scale(0.2) rotate(0deg); }
              31%     { opacity: 1; transform: translateX(-50%) scale(1.25) rotate(35deg); }
              46%     { opacity: 0; transform: translateX(-50%) scale(2)   rotate(60deg); }
              100%    { opacity: 0; transform: translateX(-50%) scale(0.2) rotate(60deg); }
            }
            @keyframes clink-ring {
              0%, 26% { opacity: 0; transform: translateX(-50%) scale(0.3); }
              32%     { opacity: 0.9; }
              50%     { opacity: 0; transform: translateX(-50%) scale(2.8); }
              100%    { opacity: 0; transform: translateX(-50%) scale(0.3); }
            }
          `}</style>
          <div style={{
            animation: animatingClink ? 'clink-l 2.2s cubic-bezier(0.5,0,0.35,1) infinite' : 'none',
            transformOrigin: 'bottom right',
          }}>
            <PintGlass size={90} fill={0.7} />
          </div>
          <div style={{
            animation: animatingClink ? 'clink-r 2.2s cubic-bezier(0.5,0,0.35,1) infinite' : 'none',
            transformOrigin: 'bottom left', marginLeft: -6,
          }}>
            <PintGlass size={90} fill={0.65} flip />
          </div>
          {/* Expanding ring on impact */}
          <div style={{
            position: 'absolute', top: 30, left: '50%',
            width: 22, height: 22, borderRadius: '50%',
            border: '2px solid rgba(255,246,224,0.9)', opacity: 0, pointerEvents: 'none',
            animation: animatingClink ? 'clink-ring 2.2s ease-out infinite' : 'none',
          }} />
          {/* Bright spark flash on impact */}
          <div style={{
            position: 'absolute', top: 26, left: '50%',
            width: 30, height: 30, borderRadius: '50%',
            background: 'radial-gradient(circle, #FFF6E0 0%, #F4B73D 42%, transparent 72%)',
            opacity: 0, pointerEvents: 'none',
            animation: animatingClink ? 'clink-spark 2.2s ease-out infinite' : 'none',
          }} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <Eyebrow>Welcome to</Eyebrow>
          <div style={{
            fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700,
            fontSize: 56, lineHeight: 0.95, color: '#F4ECDD', letterSpacing: '-0.04em',
            marginTop: 8, marginBottom: 16,
          }}>1M Beers</div>
          <div style={{
            fontFamily: 'Geist, system-ui', fontSize: 16, lineHeight: 1.5,
            color: '#B8A584', maxWidth: 280, margin: '0 auto',
          }}>
            One global toast. Log a beer, add to the count, see the community grow.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Btn onClick={onNext}>
          Let's pour <Icon name="arrowRight" size={20} />
        </Btn>
        <div style={{
          textAlign: 'center', fontSize: 11, color: 'rgba(184,165,132,0.6)',
          fontFamily: 'Geist, system-ui',
        }}>
          21+ only · drink responsibly
        </div>
      </div>
    </div>
  );
}

// ── Step 1: Age gate (DOB) ──
function Step1Age({ dob, setDob, onBack, onNext }) {
  const ageOk = React.useMemo(() => {
    if (dob.length !== 10) return false;
    const [m, d, y] = dob.split('/').map(Number);
    if (!y || !m || !d) return false;
    const birth = new Date(y, m - 1, d);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const mo = now.getMonth() - birth.getMonth();
    if (mo < 0 || (mo === 0 && now.getDate() < birth.getDate())) age--;
    return age >= 21;
  }, [dob]);
  const ageInvalid = dob.length === 10 && !ageOk;

  const formatDob = (raw) => {
    let v = raw.replace(/\D/g, '').slice(0, 8);
    if (v.length > 4) v = v.slice(0, 2) + '/' + v.slice(2, 4) + '/' + v.slice(4);
    else if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
    return v;
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 24px 32px' }}>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', color: '#F4ECDD', cursor: 'pointer',
        padding: 0, alignSelf: 'flex-start', marginBottom: 24,
      }}><Icon name="chevronLeft" size={24} /></button>
      <div style={{ flex: 1 }}>
        <Icon name="lock" size={28} color="#F4B73D" />
        <div style={{
          fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 36,
          color: '#F4ECDD', letterSpacing: '-0.03em', lineHeight: 1.05,
          marginTop: 20, marginBottom: 12,
        }}>Quick check —<br />are you 21+?</div>
        <div style={{ fontSize: 14, color: '#B8A584', marginBottom: 36, lineHeight: 1.5 }}>
          US legal drinking age. We store this verified once, then never share.
        </div>
        <Eyebrow style={{ marginBottom: 10 }}>Date of birth</Eyebrow>
        <input
          value={dob}
          onChange={(e) => setDob(formatDob(e.target.value))}
          placeholder="MM / DD / YYYY"
          inputMode="numeric"
          style={{
            width: '100%', padding: '20px 22px', boxSizing: 'border-box',
            background: '#241B10',
            border: `1.5px solid ${ageInvalid ? '#E07A5F' : ageOk ? '#F4B73D' : 'rgba(244,236,221,0.12)'}`,
            borderRadius: 18, color: '#F4ECDD', outline: 'none',
            fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 600, fontSize: 22,
            letterSpacing: '0.05em',
          }}
        />
        {ageInvalid && (
          <div style={{ marginTop: 12, color: '#E07A5F', fontSize: 13, fontFamily: 'Geist, system-ui' }}>
            Sorry — you need to be 21 or older.
          </div>
        )}
      </div>
      <Btn onClick={ageOk ? onNext : undefined} disabled={!ageOk}>Verify age</Btn>
    </div>
  );
}

// ── Step 2: Email ──
function Step2Email({ email, setEmail, onBack, onNext, sending, error, hasRealAuth }) {
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 24px 32px' }}>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', color: '#F4ECDD', cursor: 'pointer',
        padding: 0, alignSelf: 'flex-start', marginBottom: 24,
      }}><Icon name="chevronLeft" size={24} /></button>
      <div style={{ flex: 1 }}>
        <Icon name="phone" size={28} color="#F4B73D" />
        <div style={{
          fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 36,
          color: '#F4ECDD', letterSpacing: '-0.03em', lineHeight: 1.05,
          marginTop: 20, marginBottom: 12,
        }}>What's your<br />email?</div>
        <div style={{ fontSize: 14, color: '#B8A584', marginBottom: 36, lineHeight: 1.5 }}>
          {hasRealAuth ? "We'll email you a six-digit code. No password to forget." : 'Demo mode — any email works. Six-digit code in a sec.'}
        </div>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && ok && !sending) onNext(); }}
          placeholder="you@example.com"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          style={{
            width: '100%', padding: '20px 22px', boxSizing: 'border-box',
            background: '#241B10',
            border: `1.5px solid ${ok ? '#F4B73D' : 'rgba(244,236,221,0.12)'}`,
            borderRadius: 18, color: '#F4ECDD', outline: 'none',
            fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 600, fontSize: 18,
            letterSpacing: '0.01em',
          }}
        />
      </div>
      {error && (
        <div style={{
          marginBottom: 12, padding: '10px 14px', background: 'rgba(224,122,95,0.12)',
          border: '1px solid rgba(224,122,95,0.3)', borderRadius: 12,
          color: '#E07A5F', fontSize: 13, fontFamily: 'Geist, system-ui',
        }}>{error}</div>
      )}
      <Btn onClick={ok && !sending ? onNext : undefined} disabled={!ok || sending}>
        {sending ? 'Sending…' : 'Send code'}
      </Btn>
    </div>
  );
}

// ── Step 3: Email code ──
function Step3Code({ email, code, setCode, onBack, onNext, sending, error, hasRealAuth }) {
  const ok = code.length === 6;
  // Auto-advance only in demo mode; real mode waits for explicit verify call
  React.useEffect(() => { if (ok && !hasRealAuth) setTimeout(onNext, 280); }, [ok, hasRealAuth]); // eslint-disable-line
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 24px 32px' }}>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', color: '#F4ECDD', cursor: 'pointer',
        padding: 0, alignSelf: 'flex-start', marginBottom: 24,
      }}><Icon name="chevronLeft" size={24} /></button>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 36,
          color: '#F4ECDD', letterSpacing: '-0.03em', lineHeight: 1.05,
          marginBottom: 12,
        }}>Code, please.</div>
        <div style={{ fontSize: 14, color: '#B8A584', marginBottom: 28, lineHeight: 1.5 }}>
          We emailed it to {email || 'your inbox'}. {hasRealAuth ? 'Check your inbox (and spam).' : '(Demo: tap any 6 digits.)'}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginBottom: 24 }}>
          {[0,1,2,3,4,5].map(i => (
            <div key={i} style={{
              flex: 1, maxWidth: 50, aspectRatio: '1',
              background: '#241B10',
              border: `1.5px solid ${code[i] ? '#F4B73D' : 'rgba(244,236,221,0.12)'}`,
              borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 24,
              color: '#F4ECDD',
            }}>{code[i] || ''}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <NumKey key={n} n={n} onClick={() => setCode((code + n).slice(0, 6))} />
          ))}
          <div />
          <NumKey n={0} onClick={() => setCode((code + 0).slice(0, 6))} />
          <NumKey icon="x" onClick={() => setCode(code.slice(0, -1))} />
        </div>
      </div>
      {error && (
        <div style={{
          margin: '0 0 12px', padding: '10px 14px', background: 'rgba(224,122,95,0.12)',
          border: '1px solid rgba(224,122,95,0.3)', borderRadius: 12,
          color: '#E07A5F', fontSize: 13, fontFamily: 'Geist, system-ui',
        }}>{error}</div>
      )}
      {hasRealAuth && (
        <Btn onClick={ok && !sending ? onNext : undefined} disabled={!ok || sending}>
          {sending ? 'Verifying…' : 'Verify code'}
        </Btn>
      )}
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <button style={{
          background: 'none', border: 'none', color: '#B8A584', cursor: 'pointer',
          fontFamily: 'Geist, system-ui', fontSize: 13, padding: 8, textDecoration: 'underline',
        }}>Resend in 30s</button>
      </div>
    </div>
  );
}

function NumKey({ n, icon, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '18px 0', background: '#241B10',
      border: '1px solid rgba(244,236,221,0.08)', borderRadius: 14,
      color: '#F4ECDD', cursor: 'pointer',
      fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 22,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'transform 100ms, background 100ms',
    }}
    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.94)'}
    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >{icon ? <Icon name={icon} size={20} /> : n}</button>
  );
}

// ── Step 4: Handle ──
function Step4Handle({ handle, setHandle, onBack, onNext }) {
  const ok = handle.trim().length >= 2;
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 24px 32px' }}>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', color: '#F4ECDD', cursor: 'pointer',
        padding: 0, alignSelf: 'flex-start', marginBottom: 24,
      }}><Icon name="chevronLeft" size={24} /></button>
      <div style={{ flex: 1 }}>
        <Icon name="user" size={28} color="#F4B73D" />
        <div style={{
          fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 700, fontSize: 36,
          color: '#F4ECDD', letterSpacing: '-0.03em', lineHeight: 1.05,
          marginTop: 20, marginBottom: 12,
        }}>What do<br />we call you?</div>
        <div style={{ fontSize: 14, color: '#B8A584', marginBottom: 28, lineHeight: 1.5 }}>
          A first name, handle, or chosen alias. You can change it later.
        </div>
        <input
          value={handle}
          onChange={(e) => setHandle(e.target.value.slice(0, 24))}
          placeholder="e.g. Sam, hoppy_sam"
          style={{
            width: '100%', padding: '20px 22px', boxSizing: 'border-box',
            background: '#241B10',
            border: `1.5px solid ${ok ? '#F4B73D' : 'rgba(244,236,221,0.12)'}`,
            borderRadius: 18, color: '#F4ECDD', outline: 'none',
            fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 600, fontSize: 22,
          }}
        />
        <div style={{
          marginTop: 18, padding: 14, background: '#241B10', borderRadius: 14,
          border: '1px solid rgba(244,236,221,0.08)',
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <Icon name="shield" size={16} color="#F4B73D" style={{ marginTop: 2 }} />
          <div style={{ fontSize: 12.5, color: '#B8A584', lineHeight: 1.5, fontFamily: 'Geist, system-ui' }}>
            Your logs are private by default. Your name only appears on toasts you choose to share.
          </div>
        </div>
      </div>
      <Btn onClick={ok ? onNext : undefined} disabled={!ok}>Cheers, let's go</Btn>
    </div>
  );
}

window.Onboarding = Onboarding;
