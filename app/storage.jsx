// storage.jsx — Persistent storage utility for 1M Beers
//
// Three-tier strategy:
//   1. If window.__BACKEND is set (Supabase adapter loaded with config), use it.
//   2. Else if window.storage is available (Claude artifact storage), use it.
//   3. Else fall back to namespaced localStorage (single-device only).
//
// Failed shared writes are queued to user:pending_writes for retry.

const HAS_NATIVE_STORAGE = typeof window !== 'undefined' && window.storage && typeof window.storage.get === 'function';

// localStorage fallback — namespaced so shared vs personal don't collide.
// Note: in fallback mode, "shared" is just per-browser too. That's a known limitation
// for environments without a real backend; the app still functions end-to-end.
const LS_NS = { personal: '1mb:p:', shared: '1mb:s:' };

async function nativeGet(key, shared) {
  // Prefer real backend if configured
  if (typeof window !== 'undefined' && window.__BACKEND) {
    try { return await window.__BACKEND.get(key, shared); }
    catch (e) { console.warn('[storage] backend get failed', key, e); return null; }
  }
  if (!HAS_NATIVE_STORAGE) return null;
  try {
    const v = shared ? await window.storage.getSharedItem?.(key) : await window.storage.getItem?.(key);
    if (v === undefined || v === null) return null;
    try { return JSON.parse(v); } catch { return v; }
  } catch (e) { console.warn('[storage] native get failed', key, e); return null; }
}
async function nativeSet(key, value, shared) {
  if (typeof window !== 'undefined' && window.__BACKEND) {
    try { return await window.__BACKEND.set(key, value, shared); }
    catch (e) { console.warn('[storage] backend set failed', key, e); return false; }
  }
  if (!HAS_NATIVE_STORAGE) return false;
  try {
    const s = JSON.stringify(value);
    if (shared) await window.storage.setSharedItem?.(key, s);
    else await window.storage.setItem?.(key, s);
    return true;
  } catch (e) { console.warn('[storage] native set failed', key, e); return false; }
}
async function nativeList(prefix, shared) {
  if (typeof window !== 'undefined' && window.__BACKEND) {
    try { return await window.__BACKEND.list(prefix, shared); }
    catch { return []; }
  }
  if (!HAS_NATIVE_STORAGE) return [];
  try {
    const fn = shared ? window.storage.listSharedKeys : window.storage.listKeys;
    if (typeof fn !== 'function') return [];
    return (await fn(prefix)) || [];
  } catch { return []; }
}

function lsKey(key, shared) { return (shared ? LS_NS.shared : LS_NS.personal) + key; }
function lsGet(key, shared) {
  try { const raw = localStorage.getItem(lsKey(key, shared)); if (raw == null) return null; return JSON.parse(raw); }
  catch { return null; }
}
function lsSet(key, value, shared) {
  try { localStorage.setItem(lsKey(key, shared), JSON.stringify(value)); return true; }
  catch (e) { console.warn('[storage] LS set failed', key, e); return false; }
}
function lsList(prefix, shared) {
  const out = []; const ns = shared ? LS_NS.shared : LS_NS.personal;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(ns + (prefix || ''))) out.push(k.slice(ns.length));
  }
  return out;
}

const storage = {
  get mode() {
    if (typeof window !== 'undefined' && window.__BACKEND) return 'supabase';
    return HAS_NATIVE_STORAGE ? 'native' : 'localStorage';
  },

  async get(key, shared = false) {
    const hasBackend = typeof window !== 'undefined' && (window.__BACKEND || HAS_NATIVE_STORAGE);
    if (hasBackend) {
      const v = await nativeGet(key, shared);
      if (v !== null) return v;
    }
    return lsGet(key, shared);
  },

  async set(key, value, shared = false) {
    const hasBackend = typeof window !== 'undefined' && (window.__BACKEND || HAS_NATIVE_STORAGE);
    if (hasBackend) {
      const ok = await nativeSet(key, value, shared);
      if (ok) { lsSet(key, value, shared); return true; }
      // backend failed — fall through to LS, also queue retry if shared
      if (shared) await storage.queueRetry({ op: 'set', key, value, shared: true });
    }
    return lsSet(key, value, shared);
  },

  async listFull(prefix, shared = true) {
    // Fast path: backend bulk fetch returns key+value in one query
    if (typeof window !== 'undefined' && window.__BACKEND?.listFull) {
      try {
        const rows = await window.__BACKEND.listFull(prefix);
        if (rows && rows.length) return rows.map(r => ({ key: r.key, value: r.value }));
      } catch (e) { console.warn('[storage] listFull failed', e); }
    }
    // Fallback: list keys then fetch each
    const keys = await storage.list(prefix, shared);
    const values = await Promise.all(keys.map(k => storage.get(k, shared).catch(() => null)));
    return keys.map((k, i) => ({ key: k, value: values[i] })).filter(r => r.value !== null);
  },

  async list(prefix, shared = false) {
    const hasBackend = typeof window !== 'undefined' && (window.__BACKEND || HAS_NATIVE_STORAGE);
    if (hasBackend) {
      const remote = await nativeList(prefix, shared);
      if (remote && remote.length) return remote;
    }
    return lsList(prefix, shared);
  },

  // Atomic increment via backend RPC when available; read-modify-write fallback.
  async incrementSharedCounter(key, amount = 1) {
    if (typeof window !== 'undefined' && window.__BACKEND?.incrementSharedCounter) {
      try {
        const v = await window.__BACKEND.incrementSharedCounter(key, amount);
        if (typeof v === 'number') { lsSet(key, v, true); return v; }
      } catch (e) { console.warn('[storage] backend increment failed', e); }
    }
    const current = (await storage.get(key, true)) || 0;
    const next = (typeof current === 'number' ? current : 0) + amount;
    const ok = await storage.set(key, next, true);
    if (!ok) await storage.queueRetry({ op: 'increment', key, amount });
    return next;
  },

  // ── Retry queue ────────────────────────────────────────────────
  async queueRetry(operation) {
    const q = (await storage.get('user:pending_writes', false)) || [];
    q.push({ ...operation, queued_at: Date.now(), attempts: 0 });
    await lsSet('user:pending_writes', q, false); // bypass retry-loop
  },

  async processRetryQueue() {
    const q = (await storage.get('user:pending_writes', false)) || [];
    if (!q.length) return;
    const remaining = [];
    for (const op of q) {
      const attempts = op.attempts || 0;
      if (attempts >= 3) continue; // drop after 3 attempts
      // Exponential backoff: 1s, 3s, 9s after first attempt at queue time
      const delay = attempts === 0 ? 0 : [1000, 3000, 9000][attempts - 1] || 9000;
      await new Promise(r => setTimeout(r, delay));
      let ok = false;
      try {
        if (op.op === 'set') ok = await nativeSet(op.key, op.value, op.shared);
        else if (op.op === 'increment') {
          const cur = (await storage.get(op.key, true)) || 0;
          ok = await nativeSet(op.key, cur + (op.amount || 1), true);
        }
      } catch { ok = false; }
      if (!ok) remaining.push({ ...op, attempts: attempts + 1 });
    }
    await lsSet('user:pending_writes', remaining, false);
  },
};

window.storage_util = storage;
