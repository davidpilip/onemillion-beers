# OneMillion Beers — Engineering Handoff & Architecture

> A community beer-logging web app. One shared global counter, one million beers,
> logged together. iOS-styled, mobile-first, real-time, fully persistent.
>
> **This document is the single source of truth for continuing development.**
> Read it top to bottom before changing anything.

---

## 1. What this app is

OneMillion Beers ("1M Beers") is the anti-Untappd: less obsessive consumption
tracking, more a friendly communal toast. Every beer anyone logs adds **+1** to
a single global counter visible to everyone. The community goal is 1,000,000.

- **Vibe:** cheeky, warm, pub-friendly. Like a friend who knows beer, not a sommelier.
- **Platform:** single-page React app, styled like an iPhone app. Full-screen on
  mobile, framed phone preview on desktop.
- **Anonymity:** users are "Member #N" (join-order). Real handle is shown only on
  toasts they choose to make public.
- **Responsible drinking:** hard 5-logs-per-day cap, SAMHSA/AA resources in settings,
  no shaming.

## 2. Live deployment (current state)

| Thing | Value |
|---|---|
| Hosting | Cloudflare Pages |
| Live URL | `1mbeers.davidzpilip.workers.dev` (+ `*.pages.dev` preview URLs) |
| Database | Supabase project `kgclkfzsditawbhhmrix` |
| Supabase URL | `https://kgclkfzsditawbhhmrix.supabase.co` |
| Auth | Phone OTP code wired, currently in **demo mode** (`smsEnabled: false`) |
| Image storage | base64 data URLs inside the `kv_store` JSON (see §7 — needs upgrade) |

Config lives in `1M Beers App.html` in the `window.__1MB_CONFIG` block:
```js
window.__1MB_CONFIG = {
  supabaseUrl: "https://kgclkfzsditawbhhmrix.supabase.co",
  supabaseAnonKey: "sb_publishable_09sCZRKxylO3QhGqYUp7lw_SxnflGCt",
  smsEnabled: false,   // flip true after Twilio setup (see REAL_AUTH.md)
};
```

## 3. Tech stack

- **React 18.3.1** (UMD build, pinned) + **Babel standalone** (in-browser JSX transpile).
  No build step. Every `.jsx` is loaded via `<script type="text/babel" src=...>`.
- **Supabase JS v2** (UMD, from jsdelivr) for the database + auth.
- **No bundler, no npm.** This is intentional — it deploys as plain static files.
  A future rebuild may want Vite + a real build, but the current model is zero-infra.
- Fonts: Bricolage Grotesque (display), Geist (UI), JetBrains Mono (labels) via Google Fonts.

### Inter-file contract (IMPORTANT)
Each `<script type="text/babel">` is transpiled in isolation. Components are shared
by assigning to `window` at the bottom of each file (e.g. `window.HomeScreen = HomeScreen`).
When you add a component another file needs, you MUST export it on `window`.
Never name a style object just `styles` — collisions break everything. Use inline
styles (the current convention) or uniquely-named objects.

## 4. File map

```
1M Beers App.html        ← ENTRY POINT. App shell, routing, bottom nav, splash,
                            milestone polling, keyboard shortcuts, config block.
index.html               ← identical copy of entry (Cloudflare serves index.html at root)
ios-frame.jsx            ← desktop phone-bezel chrome (IOSDevice component)

app/
  storage.jsx            ← persistence layer. 3-tier: Supabase → artifact storage → localStorage.
                            Exposes window.storage_util { get,set,list,listFull,incrementSharedCounter,
                            queueRetry, processRetryQueue }.
  backend-supabase.jsx   ← Supabase adapter. Sets window.__BACKEND + window.__SUPABASE.
                            get/set/list/listFull/incrementSharedCounter + subscribeCount (realtime).
  beer-data.jsx          ← ~800 seeded real beers (window.BEER_SEEDS), STYLES list, slug helper.
  icons.jsx              ← lucide-style <Icon name=.. /> set.
  ui.jsx                 ← Btn, Eyebrow, BeerCard, StarRow, PintGlass, CountUp, Skeleton,
                            useToast, compressImage, beerTone, todayLocalISO, uuid, normName.
  sound.jsx              ← SoundManager (Web Audio synthesis) + haptic().
  polish.jsx             ← dateUtils, EventLog, ErrorToast, SuccessBanner, CheatSheet,
                            HelpButton, OfflineDot, BreathingWordmark, PageFade, useTapCounter.
  onboarding.jsx         ← 5-step flow: welcome+clink → age gate → phone → SMS code → handle.
                            Real Supabase OTP when smsEnabled, demo otherwise.
  home.jsx               ← Home screen: live counter, progress, CTA, Beer of Week,
                            fresh-toasts preview, breweries link, live breakdown grid.
  log-flow.jsx           ← 4-step log: pick → photo → rate → toast(+visibility+venue).
                            Cap wall, same-day dup detection, all the storage writes.
  toasts-feed.jsx        ← public feed, 3 filter tabs, Cheers system, per-row toast schema.
  stats-screen.jsx       ← live aggregates from logs:anonymized:*, milestone timeline,
                            clickable drill-down modals (style/region/beer → underlying logs).
  profile-settings.jsx   ← profile, today tracker, history, settings, sound toggle, export, reset.
  breweries.jsx          ← partner breweries list + detail modal + Milestone history screen.
  admin.jsx              ← Bartender Mode (5-tap wordmark). 7 sections incl. counter override,
                            force milestone, sponsor override, feed moderation, data export.

SQL (run in Supabase SQL editor, in order):
  supabase-schema.sql        ← original table + RLS
  supabase-migration-v2.sql  ← dedupe + partial unique indexes (NULL user_id fix)
  supabase-migration-v3.sql  ← kv_set() + kv_list_shared() RPCs (CURRENT — required)

Docs:
  README.md      ← deploy overview + host options
  DEPLOY.md      ← Supabase + Cloudflare step-by-step
  REAL_AUTH.md   ← Twilio + Supabase phone-auth setup

Legacy/unused (safe to delete):
  1M Beers.html, app-shell.jsx, screens-main.jsx, screens-aux.jsx, tweaks-panel.jsx
  (these are the original DESIGN PROTOTYPE, superseded by the functional app/ build)
```

## 5. Data model (Supabase `kv_store` table)

Single generic key-value table — intentionally portable.
```
kv_store ( id bigserial, scope text['shared'|'personal'], user_id text NULL,
           key text, value jsonb, updated_at timestamptz )
```
- **Shared rows** (`scope='shared'`, `user_id=NULL`) — visible to all.
- **Personal rows** (`scope='personal'`, `user_id=<clientId or auth.uid>`) — per user.

### Shared keys
| Key | Value | Notes |
|---|---|---|
| `community:count` | int | the global counter. Use `kv_increment` RPC (atomic). |
| `community:members` | int | next member number. Incremented at signup. |
| `beers:database` | array | full beer catalog (seed + user-added). |
| `beers:last_log_timestamp` | int (ms) | drives dormancy ticker. |
| `beers:milestones_hit` | array | `{milestone, hit_at, member_number}`. |
| `beers:weekly_sponsor:YYYY-WW` | object | Beer of the Week (admin-overridable). |
| `toast:{uuid}` | object | ONE PUBLIC TOAST PER ROW (current schema — avoids races). |
| `logs:anonymized:{uuid}` | object | privacy-stripped log for stats `{beer_id,name,brewery,style,abv,region,rating,ts}`. |
| `toasts:cheers:{toastId}` | int | cheers counter per toast. |
| `toasts:feed:YYYY-MM-DD` | array | LEGACY array feed (still read for old data, do not write). |

### Personal keys
`user:profile`, `user:log_history`, `user:daily_count` (`{date,count,beers[]}`),
`user:cheered_toasts`, `user:cheered_milestones`, `user:milestones_seen`,
`user:cached_feed`, `user:cached_stats`, `user:event_log`, `user:success_banner`,
`user:backfill_v1_done`, `user:admin_unlocked`, `user:pending_writes`.

### Critical history / gotchas (read this!)
1. **NULL ≠ NULL in Postgres.** The original `UNIQUE(scope,user_id,key)` never fired
   for shared rows → duplicate rows everywhere → reads crashed. Fixed in v2 with
   partial unique indexes (`WHERE user_id IS NULL` / `IS NOT NULL`).
2. **Partial indexes broke REST upsert** (`onConflict` had no constraint to target)
   → shared writes silently failed → "nobody sees anyone's posts." Fixed in v3 with
   `kv_set()` RPC that does explicit select-then-insert/update. **All writes now go
   through `kv_set`; all bulk reads through `kv_list_shared` (`storage.listFull`).**
3. **Feed was a single array** → write races dropped toasts. Now one row per toast
   (`toast:{uuid}`). Old toasts are backfilled once per device on load (`user:backfill_v1_done`).

## 6. Auth — current vs target

**Current (demo):** any 6-digit code works. A random `clientId` (`c_<uuid>`) is
stored in localStorage and used as the personal `user_id`. Clearing the browser =
new identity.

**Target (production):** Supabase Phone Auth via Twilio. Code is already written in
`onboarding.jsx` (gated on `smsEnabled`). To activate:
1. Twilio account → get Account SID, Auth Token, phone number.
2. Supabase → Auth → Providers → Phone → enable → paste Twilio creds.
3. Set `smsEnabled: true` in the config block, redeploy.
4. On verify, `auth.uid()` becomes the stable cross-device identity. Persist it on
   the profile (`auth_user_id`) — code already does this.
5. **Migration for existing users:** `UPDATE kv_store SET user_id='<auth.uid>'
   WHERE user_id='<old client_id>'`. See REAL_AUTH.md.

**Security debt to address:** RLS currently allows any anon client to read/write any
personal row (trust-the-client_id model). Once real auth is on, tighten RLS to
`user_id = auth.uid()` for personal rows.

## 7. Image storage — NEEDS UPGRADE

Photos are currently compressed client-side (max 800px, JPEG q0.7 via
`compressImage` in ui.jsx) and stored as **base64 data URLs inside the toast/log
JSON**. This works but bloats rows and the kv_store table.

**Recommended upgrade:** Supabase Storage bucket.
1. Create a public bucket `beer-photos`.
2. On log submit, upload the compressed Blob → get a public URL.
3. Store the URL (not the base64) in the toast row's `photo_data`.
4. The photo-picker UI already supports both camera + library (`PhotoStep` in log-flow.jsx).

## 8. The next bot's TODO (priorities)

1. **Turn on real SMS auth** (REAL_AUTH.md) + tighten RLS to `auth.uid()`.
2. **Move images to Supabase Storage** (§7) — biggest scalability win.
3. **Realtime feed** — `window.__BACKEND.subscribeCount` exists; extend to subscribe
   to `toast:*` inserts so the feed updates without polling.
4. **Reply threads on toasts** (currently stubbed).
5. **Nearby filter** (currently stub) — needs geolocation + region on toasts.
6. **Brewery partner redemption** (currently "coming soon" modal).
7. **Consider a real build** (Vite) if the codebase keeps growing — but keep the
   zero-infra deploy story if possible.

## 9. How to run locally

No build. Serve the folder (file:// breaks Babel):
```bash
python3 -m http.server 8080
# open http://localhost:8080/1M%20Beers%20App.html
```
Without Supabase config it runs in localStorage-only mode (single-device).

## 10. Brand / design tokens

- Background `#1A140C` (espresso) · card `#241B10` · elevated `#2E2415`
- Text `#F4ECDD` (cream) · secondary `#B8A584` (tan) · tertiary `#7A6B52`
- Accent `#F4B73D` (amber) · secondary accent `#D97F2C` (copper)
- Success `#87C66B` · danger `#E07A5F`
- Radii: 14 (chips) · 18 (cards) · 22-26 (hero/modals) · 9999 (pills)
- All breweries/beers are REAL brands; member identities are anonymized.

---

*Last updated: handoff build v3.9. Counter, members, beer DB, per-row toasts,
live stats, clickable drill-downs, sound, admin, breweries, milestones all working.
Demo auth + base64 images are the two known pre-production shortcuts.*
