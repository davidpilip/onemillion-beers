// onboarding.jsx — 5-step onboarding flow with clink animation
// Steps: welcome → age gate (DOB) → phone → SMS code → handle/display name
// All state persists immediately to storage.user:profile on completion.

function Onboarding({ onComplete }) {
  const [step, setStep] = React.useState(0);
  const [dob, setDob] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [code, setCode] = React.useState('');
  const [handle, setHandle] = React.useState('');
  const [animatingClink, setAnimatingClink] = React.useState(true);
  const [authError, setAuthError] = React.useState('');
  const [sending, setSending] = React.useState(false);

  // Real SMS auth via Supabase when configured; demo fallback otherwise
  const hasRealAuth = typeof window !== 'undefined' && window.__SUPABASE && window.__1MB_CONFIG?.smsEnabled;

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
      dob, phone, joined_at: Date.now(),
      created_id: uiHelpers.uuid(),
      auth_user_id: authUserId,
      sms_verified: !!authUserId,
    };
    await storage_util.set('user:profile', profile, false);
    onComplete(profile);
  };

  // Send OTP via Supabase (or skip in demo mode)
  const sendCode = async () => {
    setAuthError('');
    if (!hasRealAuth) { setStep(3); return; }
    setSending(true);
    try {
      const e164 = '+1' + phone.replace(/\D/g, '');
      const { error } = await window.__SUPABASE.auth.signInWithOtp({ phone: e164 });
      if (error) throw error;
      setStep(3);
    } catch (e) {
      setAuthError(e.message || 'Could not send code. Try again.');
    } finally { setSending(false); }
  };

  // Verify code via Supabase (or accept any 6 digits in demo mode)
  const verifyCode = async () => {
    setAuthError('');
    if (!hasRealAuth) { setStep(4); return; }
    setSending(true);
    try {
      const e164 = '+1' + phone.replace(/\D/g, '');
      const { error } = await window.__SUPABASE.auth.verifyOtp({ phone: e164, token: code, type: 'sms' });
      if (error) throw error;
      setStep(4);
    } catch (e) {
      setAuthError(e.message || 'Wrong code. Try again.');
      setCode('');
    } finally { setSending(false); }
  };

  const steps = [
    <Step0 key="0" onNext={() => setStep(1)} animatingClink={animatingClink} />,
    <Step1Age key="1" dob={dob} setDob={setDob} onBack={() => setStep(0)} onNext={() => setStep(2)} />,
    <Step2Phone key="2" phone={phone} setPhone={setPhone} onBack={() => setStep(1)} onNext={sendCode} sending={sending} error={authError} hasRealAuth={hasRealAuth} />,
    <Step3Code key="3" phone={phone} code={code} setCode={setCode} onBack={() => setStep(2)} onNext={verifyCode} sending={sending} error={authError} hasRealAuth={hasRealAuth} />,
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
        {/* Clink animation */}
        <div style={{ position: 'relative', width: 240, height: 160, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <style>{`
            @keyframes clink-l { 0% { transform: translateX(-30px) rotate(-15deg); } 45% { transform: translateX(0) rotate(0deg); } 55% { transform: translateX(0) rotate(0deg); } 100% { transform: translateX(-30px) rotate(-15deg); } }
            @keyframes clink-r { 0% { transform: translateX(30px) rotate(15deg); } 45% { transform: translateX(0) rotate(0deg); } 55% { transform: translateX(0) rotate(0deg); } 100% { transform: translateX(30px) rotate(15deg); } }
            @keyframes ping { 0% { transform: scale(0.4); opacity: 1; } 100% { transform: scale(1.4); opacity: 0; } }
          `}</style>
          <div style={{
            animation: animatingClink ? 'clink-l 2.6s ease-in-out infinite' : 'none',
            transformOrigin: 'bottom right',
          }}>
            <PintGlass size={90} fill={0.7} />
          </div>
          <div style={{
            animation: animatingClink ? 'clink-r 2.6s ease-in-out infinite' : 'none',
            transformOrigin: 'bottom left', marginLeft: -8,
          }}>
            <PintGlass size={90} fill={0.65} flip />
          </div>
          {/* Spark when they meet */}
          <div style={{
            position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)',
            width: 18, height: 18, borderRadius: '50%',
            background: 'radial-gradient(circle, #FFF6E0 0%, transparent 70%)',
            opacity: 0,
            animationName: animatingClink ? 'ping' : 'none',
            animationDuration: '2.6s',
            animationTimingFunction: 'ease-out',
            animationIterationCount: 'infinite',
            animationDelay: '1.15s',
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

// ── Step 2: Phone ──
function Step2Phone({ phone, setPhone, onBack, onNext, sending, error, hasRealAuth }) {
  const ok = phone.replace(/\D/g, '').length === 10;
  const formatPhone = (raw) => {
    let v = raw.replace(/\D/g, '').slice(0, 10);
    if (v.length > 6) v = `(${v.slice(0,3)}) ${v.slice(3,6)}-${v.slice(6)}`;
    else if (v.length > 3) v = `(${v.slice(0,3)}) ${v.slice(3)}`;
    else if (v.length > 0) v = `(${v}`;
    return v;
  };
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
        }}>What's your<br />number?</div>
        <div style={{ fontSize: 14, color: '#B8A584', marginBottom: 36, lineHeight: 1.5 }}>
          {hasRealAuth ? 'Six-digit code in a sec. No password to forget.' : 'Demo mode — any 10-digit number works. Six-digit code in a sec.'}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{
            padding: '20px 16px', background: '#241B10',
            border: '1.5px solid rgba(244,236,221,0.12)', borderRadius: 18,
            color: '#F4ECDD', fontFamily: 'Bricolage Grotesque, system-ui',
            fontWeight: 600, fontSize: 18,
          }}>🇺🇸 +1</div>
          <input
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            placeholder="(555) 123-4567"
            inputMode="tel"
            style={{
              flex: 1, padding: '20px 22px', boxSizing: 'border-box',
              background: '#241B10',
              border: `1.5px solid ${ok ? '#F4B73D' : 'rgba(244,236,221,0.12)'}`,
              borderRadius: 18, color: '#F4ECDD', outline: 'none',
              fontFamily: 'Bricolage Grotesque, system-ui', fontWeight: 600, fontSize: 18,
              letterSpacing: '0.03em',
            }}
          />
        </div>
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

// ── Step 3: SMS code ──
function Step3Code({ phone, code, setCode, onBack, onNext, sending, error, hasRealAuth }) {
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
          We sent it to {phone || 'your phone'}. {hasRealAuth ? '' : '(Demo: tap any 6 digits.)'}
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
