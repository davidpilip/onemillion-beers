// backend-supabase.jsx — Real backend adapter for 1M Beers
//
// Plugs into app/storage.jsx via the window.__BACKEND interface:
//   { get(key, shared), set(key, value, shared), incrementSharedCounter(key, amount), list(prefix, shared) }
//
// Config lives in <script> as window.__1MB_CONFIG = { supabaseUrl, supabaseAnonKey }
// If config is missing, this file no-ops and storage.jsx uses its localStorage fallback.

(function () {
  const CFG = window.__1MB_CONFIG || {};
  if (!CFG.supabaseUrl || !CFG.supabaseAnonKey) {
    console.info('[backend] no Supabase config — running in localStorage-only mode');
    return;
  }
  if (!window.supabase || !window.supabase.createClient) {
    console.warn('[backend] supabase-js not loaded — falling back to localStorage');
    return;
  }

  const sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {
    // persistSession: keep the email login across app restarts so a user's
    // beers follow them (and to the same account on any device they sign in on).
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    realtime: { params: { eventsPerSecond: 4 } },
  });

  // Fallback identity for anyone not signed in yet (e.g. mid-onboarding, before
  // they verify their email). Once signed in we key personal rows off the real
  // Supabase auth user id, so data belongs to the person, not the device.
  const CLIENT_ID_KEY = '1mb:client_id';
  let clientId = localStorage.getItem(CLIENT_ID_KEY);
  if (!clientId) {
    clientId = 'c_' + crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY, clientId);
  }

  // The signed-in user id, kept in sync with the auth session. When present it
  // is the identity used for all personal reads/writes.
  let authUserId = null;
  const identity = () => authUserId || clientId;
  sb.auth.getSession().then(({ data }) => { authUserId = data?.session?.user?.id || null; }).catch(() => {});
  sb.auth.onAuthStateChange((_event, session) => {
    authUserId = session?.user?.id || null;
    if (typeof window.__onIdentityChange === 'function') window.__onIdentityChange(identity());
  });

  const backend = {
    mode: 'supabase',
    clientId,
    get userId() { return identity(); },

    async get(key, shared) {
      try {
        const q = sb.from('kv_store').select('value')
          .eq('scope', shared ? 'shared' : 'personal').eq('key', key);
        if (!shared) q.eq('user_id', identity());
        else q.is('user_id', null);
        // Use limit(1) + order desc instead of maybeSingle so we survive duplicates
        // gracefully (the migration cleans them up but we stay defensive).
        const { data, error } = await q.order('updated_at', { ascending: false }).limit(1);
        if (error) throw error;
        return (data && data[0]) ? data[0].value : null;
      } catch (e) {
        console.warn('[backend] get failed', key, e.message);
        return null;
      }
    },

    async set(key, value, shared) {
      try {
        // Use the kv_set RPC — handles partial-index upsert correctly for both shared & personal
        const { error } = await sb.rpc('kv_set', {
          p_scope: shared ? 'shared' : 'personal',
          p_user_id: shared ? null : identity(),
          p_key: key,
          p_value: value,
        });
        if (error) throw error;
        return true;
      } catch (e) {
        console.warn('[backend] set failed', key, e.message);
        return false;
      }
    },

    // Bulk fetch for shared rows — returns [{key, value}] in one round-trip.
    async listFull(prefix) {
      try {
        const { data, error } = await sb.rpc('kv_list_shared', { p_prefix: prefix });
        if (error) throw error;
        return data || [];
      } catch (e) {
        console.warn('[backend] listFull failed', prefix, e.message);
        return [];
      }
    },

    async incrementSharedCounter(key, amount = 1) {
      try {
        const { data, error } = await sb.rpc('kv_increment', { p_key: key, p_amount: amount });
        if (error) throw error;
        return typeof data === 'number' ? data : parseInt(data, 10);
      } catch (e) {
        console.warn('[backend] incrementSharedCounter failed', key, e.message);
        // Fallback: read-modify-write
        const cur = (await backend.get(key, true)) || 0;
        const next = (typeof cur === 'number' ? cur : 0) + amount;
        await backend.set(key, next, true);
        return next;
      }
    },

    async list(prefix, shared) {
      try {
        const q = sb.from('kv_store').select('key')
          .eq('scope', shared ? 'shared' : 'personal')
          .like('key', `${prefix}%`);
        if (!shared) q.eq('user_id', identity());
        else q.is('user_id', null);
        const { data, error } = await q;
        if (error) throw error;
        return (data || []).map(r => r.key);
      } catch (e) {
        console.warn('[backend] list failed', prefix, e.message);
        return [];
      }
    },

    // Realtime subscription to the global counter — wired separately by the app
    subscribeCount(onChange) {
      const channel = sb.channel('community-count')
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'kv_store', filter: 'key=eq.community:count' },
          (payload) => {
            const v = payload?.new?.value;
            if (typeof v === 'number') onChange(v);
          })
        .subscribe();
      return () => sb.removeChannel(channel);
    },
  };

  window.__BACKEND = backend;
  window.__SUPABASE = sb; // expose for auth flows
  console.info(`[backend] Supabase ready · client_id=${clientId.slice(0, 12)}…`);
})();
