// sound.jsx — Lazy Web Audio synthesis. Lazy AudioContext on first user interaction.
// Respects user:profile.sound_enabled (default true). No-op if disabled or unsupported.
// Public API: SoundManager.play('clink' | 'ting' | 'pour' | 'milestone' | 'success' | 'error')

const SoundManager = (() => {
  let ctx = null;
  let enabled = true;
  let unlocked = false;
  let masterGain = null;
  let reverbBus = null;

  const ensureContext = async () => {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.85;
      masterGain.connect(ctx.destination);

      // Tiny synthesized reverb bus — a 0.8s decaying noise IR
      const ir = ctx.createBuffer(2, ctx.sampleRate * 0.8, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        for (let i = 0; i < d.length; i++) {
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
        }
      }
      reverbBus = ctx.createConvolver();
      reverbBus.buffer = ir;
      const reverbGain = ctx.createGain();
      reverbGain.gain.value = 0.18;
      reverbBus.connect(reverbGain);
      reverbGain.connect(masterGain);
    } catch (e) { console.warn('[sound] init failed', e); }
    return ctx;
  };

  // Unlock on first user interaction
  const unlock = async () => {
    if (unlocked) return;
    unlocked = true;
    const c = await ensureContext();
    if (c && c.state === 'suspended') {
      try { await c.resume(); } catch {}
    }
  };

  document.addEventListener('pointerdown', unlock, { once: true, passive: true });
  document.addEventListener('keydown', unlock, { once: true });
  document.addEventListener('touchstart', unlock, { once: true, passive: true });

  const setEnabled = (v) => { enabled = !!v; };
  const isEnabled = () => enabled;

  // Helper: build an oscillator with attack/decay envelope
  const tone = ({ freq, freqEnd, type = 'sine', attack = 0.005, decay = 0.15, peak = 0.2, when = 0, reverb = 0 }) => {
    if (!ctx) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqEnd && freqEnd !== freq) osc.frequency.exponentialRampToValueAtTime(freqEnd, t0 + attack + decay);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
    osc.connect(gain);
    gain.connect(masterGain);
    if (reverb && reverbBus) {
      const send = ctx.createGain(); send.gain.value = reverb;
      gain.connect(send); send.connect(reverbBus);
    }
    osc.start(t0);
    osc.stop(t0 + attack + decay + 0.05);
  };

  const filteredNoise = ({ duration = 0.6, cutoffStart = 200, cutoffEnd = 2000, peak = 0.08, when = 0 }) => {
    if (!ctx) return;
    const t0 = ctx.currentTime + when;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(cutoffStart, t0);
    filter.frequency.exponentialRampToValueAtTime(cutoffEnd, t0 + duration * 0.8);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    // Bubble modulator
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 6;
    lfoGain.gain.value = peak * 0.4;
    lfo.connect(lfoGain); lfoGain.connect(gain.gain);
    noise.connect(filter); filter.connect(gain); gain.connect(masterGain);
    if (reverbBus) {
      const send = ctx.createGain(); send.gain.value = 0.1;
      gain.connect(send); send.connect(reverbBus);
    }
    noise.start(t0); noise.stop(t0 + duration + 0.05);
    lfo.start(t0); lfo.stop(t0 + duration + 0.05);
  };

  const play = async (name) => {
    if (!enabled) return;
    try {
      const c = await ensureContext();
      if (!c) return;
      if (c.state === 'suspended') { try { await c.resume(); } catch {} }
      switch (name) {
        case 'clink':
          tone({ freq: 1800, freqEnd: 1200, type: 'triangle', attack: 0.005, decay: 0.12, peak: 0.22, reverb: 0.4 });
          tone({ freq: 2400, type: 'sine', attack: 0.003, decay: 0.06, peak: 0.18, reverb: 0.5 });
          tone({ freq: 3200, type: 'sine', attack: 0.003, decay: 0.04, peak: 0.1, when: 0.01, reverb: 0.3 });
          break;
        case 'ting':
          tone({ freq: 880, type: 'sine', attack: 0.005, decay: 0.2, peak: 0.15, reverb: 0.15 });
          tone({ freq: 1760, type: 'sine', attack: 0.005, decay: 0.1, peak: 0.06, reverb: 0.1 });
          break;
        case 'pour':
          filteredNoise({ duration: 0.6, cutoffStart: 200, cutoffEnd: 2000, peak: 0.1 });
          break;
        case 'milestone': {
          // C5 E5 G5 C6 E6 ascending arpeggio
          const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
          notes.forEach((f, i) => {
            tone({ freq: f, type: 'sine', attack: 0.01, decay: 0.32, peak: 0.18, when: i * 0.13, reverb: 0.55 });
            tone({ freq: f * 2, type: 'sine', attack: 0.01, decay: 0.18, peak: 0.06, when: i * 0.13, reverb: 0.4 });
          });
          break;
        }
        case 'success':
          tone({ freq: 783.99, type: 'sine', attack: 0.005, decay: 0.1, peak: 0.16, reverb: 0.2 });
          tone({ freq: 1046.5, type: 'sine', attack: 0.005, decay: 0.14, peak: 0.16, when: 0.09, reverb: 0.2 });
          break;
        case 'error':
          tone({ freq: 220, type: 'sine', attack: 0.01, decay: 0.25, peak: 0.18, reverb: 0.15 });
          break;
        default: break;
      }
    } catch (e) { /* silent */ }
  };

  return { play, setEnabled, isEnabled, unlock };
})();

// Tiny vibration helper — best-effort, never throws
const haptic = (ms = 10) => {
  try { if (navigator.vibrate) navigator.vibrate(ms); } catch {}
};

window.SoundManager = SoundManager;
window.haptic = haptic;
