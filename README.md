# 1M Beers

A community beer-logging app. One global counter, one million beers, together.

## What's in this folder

```
1M Beers App.html      ← THE ENTRY POINT (open this in a browser)
ios-frame.jsx          ← device chrome
app/
  storage.jsx          ← persistence layer (artifact storage + localStorage fallback)
  beer-data.jsx        ← 150+ seeded real beers
  icons.jsx, ui.jsx    ← shared UI primitives
  sound.jsx            ← Web Audio synthesis
  polish.jsx           ← date utils, event log, cheat sheet, banners
  onboarding.jsx       ← 5-step onboarding
  community.jsx        ← Beer of the Week, milestones, dormancy ticker
  home.jsx             ← Home screen
  log-flow.jsx         ← 4-step log flow
  toasts-feed.jsx      ← public feed + Cheers
  stats-screen.jsx     ← real community aggregates
  profile-settings.jsx ← profile + settings + sound toggle
  breweries.jsx        ← partner breweries + milestone history
  admin.jsx            ← Bartender Mode admin panel
tweaks-panel.jsx       ← (unused in production, leftover from prototype)
```

It's a fully static site — no build step, no npm install, just HTML + JSX
transpiled in the browser by Babel.

## Deploy in 5 minutes (recommended: Cloudflare Pages)

**Cloudflare Pages** is free, fast, and dead simple. Better than Netlify and
Vercel for static sites like this — unlimited bandwidth on the free tier and
no cold starts.

### Step-by-step

1. Go to **https://pages.cloudflare.com** and sign up (free, takes 30 seconds)
2. Click **"Create a project"** → **"Upload assets"** (don't bother with Git unless you want to)
3. Drag this entire folder into the upload area
4. Set **Project name**: `1m-beers` (or whatever — this becomes your URL prefix)
5. Click **Deploy**
6. Done. You get a URL like `https://1m-beers.pages.dev` to share with friends.

That's it. No config, no build settings, no dotfiles needed.

### Custom domain (optional, ~$10/year)

1. Buy a domain on Cloudflare Registrar (cheapest at-cost pricing, ~$10/year for `.app` or `.com`)
2. In your Pages project: **Custom domains** → **Set up a custom domain** → type it in
3. Cloudflare auto-configures the DNS

Now you have `1mbeers.app` or whatever.

## Alternative hosts (all free, all work)

| Host | Setup time | Bandwidth | Notes |
|---|---|---|---|
| **Cloudflare Pages** ⭐ | 2 min | unlimited | best free tier, no card needed |
| Netlify | 2 min | 100GB/mo | drag-and-drop UI, easy |
| Vercel | 2 min | 100GB/mo | optimized for Next.js but works fine |
| GitHub Pages | 5 min | 100GB/mo | requires a GitHub repo |
| Surge.sh | 1 min | unlimited | CLI-only (`surge .`) |

I recommend Cloudflare Pages. Pick any of the others if you already have an account.

## ⚠️ Important: the "shared counter" caveat

This app was originally built on Claude's artifact storage, which has true
cross-user shared state. When you host it on Cloudflare Pages (or any static
host) **without a backend**, the app falls back to `localStorage`.

**What that means in practice**:
- Each visitor has their own profile, own log history, own counter
- The "global counter" is global to that person's browser only
- The toasts feed only shows toasts that person logged
- No real cross-device sync

The app still works perfectly end-to-end — onboarding, logging, photos,
ratings, Cheers, stats, milestones, admin panel. It just isn't actually a
*shared community* without a backend.

### Want a real shared counter?

You'll need a backend. Cheapest path: **Supabase** (free tier is generous).
~50 lines of code to swap `app/storage.jsx`'s `nativeGet`/`nativeSet` calls
for Supabase reads/writes. I can write that for you — ask me when you're
ready.

Other backend options that would work cleanly here:
- **Firebase Realtime Database** (free tier good for ~1M ops/day)
- **Cloudflare Workers + KV** (stays in the Cloudflare ecosystem, ~$5/mo)
- **PocketBase** (self-host on a $5 VPS, full SQLite backend)

## Mobile install (PWA-style, no app store)

Once hosted, your friends can:

**iPhone**: open the URL in Safari → Share → Add to Home Screen.
**Android**: open the URL in Chrome → menu → Add to Home Screen.

It launches full-screen, no browser chrome, feels native.

For a real "Add to Home Screen" prompt + offline support, add a
`manifest.json` and a service worker. Ask me when you're ready.

## Local testing before deploying

Just open `1M Beers App.html` in a browser. That's it. No build, no server.

Or run a tiny local server (so file:// paths don't trip up some browsers):

```bash
# in this folder
python3 -m http.server 8080
# then open http://localhost:8080/1M%20Beers%20App.html
```

## Files you can safely delete before deploying

- `tweaks-panel.jsx` — leftover from the prototype phase, not loaded
- Any `.napkin` or screenshot files in `uploads/`
- This `README.md` itself (not loaded by the app)

## Cost summary

| What | Cost |
|---|---|
| Cloudflare Pages hosting | **$0/mo forever** |
| Custom domain (optional) | ~$10/year |
| Backend for real shared counter (optional, later) | $0-5/mo |

Total to ship to friends today: **$0.**

Total to ship with a custom domain: **~$10/year.**

Total to ship as a real shared community app: **~$10/year + 1-2 hours of backend wiring.**

---

🍻 Now go pour the first one.
