# 🍻 Deploy 1M Beers — Real Backend Setup

You're going from a "works for one person" demo to a **real social app** where
the global counter, toasts, and Cheers are shared across everyone who visits.

**Total time: ~15 minutes. Total cost: $0 (Supabase free tier + Cloudflare Pages free tier).**

When the app grows, you can pay $25/mo for Supabase Pro for more storage and
the database stays portable — you own all your data and can export it to
anywhere else at any time.

---

## Part 1 — Set up Supabase (5 minutes)

Supabase gives you a real Postgres database with one click. Free tier handles
~50K users and 500MB of data, which is plenty to launch.

### 1.1 Create the project

1. Go to **https://supabase.com** → **Start your project** → sign in with GitHub or email
2. Click **New project**
3. Fill in:
   - **Name**: `1m-beers`
   - **Database password**: generate one with the "Generate a password" button. **Save it in a password manager** — you'll basically never need it after this.
   - **Region**: pick the one closest to where your users live (East US, West EU, etc.)
4. Click **Create new project**. Wait ~2 minutes for provisioning.

### 1.2 Run the schema

1. In the Supabase dashboard, left sidebar → **SQL Editor**
2. Click **New query**
3. Open the file **`supabase-schema.sql`** from this project folder, copy ALL of it, paste into the SQL editor
4. Click **Run** (bottom right, or Cmd+Enter)
5. You should see "Success. No rows returned" — that's correct.

What you just created:
- A `kv_store` table that holds all the app data (community counter, toasts, beer library, user logs)
- A `kv_increment` function for atomic counter updates
- Row-level security policies so the anon key can read/write safely

### 1.3 Grab your two config values

1. Left sidebar → **Project Settings** (gear icon at bottom) → **API**
2. Copy these two strings:
   - **Project URL** (looks like `https://abcdefghijk.supabase.co`)
   - **anon / public** key (a long string starting with `eyJ...`) — this is the **safe-to-share** key, not the service_role key

Keep this tab open. You'll paste them in next.

---

## Part 2 — Wire the app to Supabase (1 minute)

1. Open **`1M Beers App.html`** in any text editor
2. Find this block near the top (around line 40):

```html
<script>
  window.__1MB_CONFIG = {
    supabaseUrl: "",        // e.g. "https://abcdefgh.supabase.co"
    supabaseAnonKey: "",    // e.g. "eyJhbGciOi..."
  };
</script>
```

3. Paste your values in the quotes:

```html
<script>
  window.__1MB_CONFIG = {
    supabaseUrl: "https://YOUR_PROJECT.supabase.co",
    supabaseAnonKey: "eyJhbGc...your-long-key...",
  };
</script>
```

4. Save the file.

That's it. The app will now read and write to Supabase. The localStorage
fallback still kicks in if your phone is offline — writes queue and retry.

### Quick local test

Before deploying, open `1M Beers App.html` in your browser. You should see in
the DevTools console:

```
[backend] Supabase ready · client_id=c_xxxxxxx…
```

Log a beer. Then go to your Supabase dashboard → **Table Editor** → `kv_store`.
You'll see your rows. **That's your real data, in your own database.**

---

## Part 3 — Deploy to Cloudflare Pages (5 minutes, free forever)

### 3.1 Upload

1. Go to **https://pages.cloudflare.com** → sign up (free, no card)
2. Click **Create a project** → **Upload assets**
3. Project name: `1m-beers`
4. **Drag the entire `1M Beers` folder onto the upload zone**
5. Click **Deploy site**

You'll get a URL like `https://1m-beers.pages.dev`. **That's your live app.**

### 3.2 Test from your phone

Open the URL on your phone. Onboard. Log a beer. Check Supabase Table Editor.
You'll see the row land. Send the URL to a friend. They onboard too. The
global counter goes up *for both of you*. You see each other's toasts.

It's a real social app now.

### 3.3 (Optional) Custom domain — ~$10/year

Inside Cloudflare:
1. **Registrar** → register a domain (`1mbeers.app` if available, or `.com` / `.beer`)
2. Inside your Pages project: **Custom domains** → **Set up a custom domain**
3. Type the domain. DNS auto-configures. SSL ready in 2 minutes.

---

## Part 4 — Going further (when you outgrow the free tier)

**You will not hit Supabase free-tier limits until you have tens of thousands
of users.** When you do:

- **Supabase Pro** is **$25/mo** — 8 GB database, 250 GB bandwidth, daily backups
- Cloudflare Pages stays free forever no matter how many visitors

### Your data is portable

The `kv_store` schema is intentionally generic. To migrate to a different
backend later:

```sql
-- One command exports everything as JSON
SELECT json_agg(kv_store) FROM public.kv_store;
```

You can import that JSON into Firebase, PocketBase, Cloudflare D1, or a
custom Postgres instance whenever you outgrow Supabase. **Nothing is locked in.**

### Real phone authentication (when you're ready)

The current setup uses a client-generated anonymous ID. To upgrade to real
SMS-verified phone auth (Supabase has this built in):

1. Supabase dashboard → **Authentication** → **Providers** → **Phone** → enable
2. Set up a Twilio account for SMS (~$0.0075/SMS, free trial credit)
3. Tell me to wire it — about 30 lines of code in `onboarding.jsx`

### Migrating existing client IDs to real auth

When you switch to phone auth, run this once to attach existing client_ids to
their new auth.uid():

```sql
UPDATE public.kv_store
SET user_id = 'AUTH_UID_HERE'
WHERE user_id = 'c_OLD_CLIENT_ID_HERE';
```

Users keep all their logs. No data loss.

---

## Troubleshooting

**"[backend] no Supabase config — running in localStorage-only mode"**
Your `__1MB_CONFIG` values are still empty. Recheck `1M Beers App.html`.

**"[backend] supabase-js not loaded"**
The unpkg CDN is blocked or down. Try a hard refresh, or swap the script src for
`https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js`.

**Writes look like they're failing**
Open Supabase → **Logs** → **API**. You'll see exact error messages. Most
common: the SQL schema didn't run all the way (no RLS policies). Re-run it.

**Friends can't see my toasts**
Make sure their visibility was set to "Public" when logging, not "Just me".
The Just-me toggle in the log flow keeps logs in personal scope.

---

## Quick reference

| What | Where | Cost |
|---|---|---|
| Database | Supabase | $0 → $25/mo |
| Hosting | Cloudflare Pages | $0 forever |
| Domain | Cloudflare Registrar | ~$10/year |
| SMS (later) | Twilio | ~$0.01/SMS |
| **Total to launch** | | **$0 today** |

🍻 Go ship it.
