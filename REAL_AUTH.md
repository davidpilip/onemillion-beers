# 📱 Enable Real SMS Auth (5-minute setup)

By default the app runs in **demo mode** — any 6-digit code works. To turn on REAL SMS verification (so people are tracked across devices, can't fake numbers, and you can text them later), follow these steps.

## What you'll need
- A **Twilio account** (free trial gives you ~$15 credit, ~2,000 SMS)
- Your existing **Supabase project**
- 5 minutes

## Cost after free trial
- **~$0.0079 per SMS** sent via Twilio (US numbers)
- **$1.15/month** for a Twilio phone number
- Supabase Auth itself is **free** (50,000 monthly active users on the free tier)
- 📊 If you have 100 active friends signing up once each = **$0.80 total**
- 📊 If you have 10,000 users = **~$80 total** + Supabase Pro ($25/mo) if needed

## Step 1: Sign up for Twilio (2 min)

1. Go to **https://www.twilio.com/try-twilio**
2. Sign up → verify your own phone (it's their first SMS to you, free)
3. Once in the console, click **Get a Twilio Phone Number** → choose a US number (free with trial credit)
4. Copy these three values from the dashboard:
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (the masked one — click "Show")
   - **Phone number** (in `+1XXXXXXXXXX` format)

## Step 2: Wire Twilio into Supabase Auth (2 min)

1. Go to **https://supabase.com/dashboard/project/kgclkfzsditawbhhmrix/auth/providers**
2. Scroll to **Phone** → click the toggle to enable
3. Set **SMS Provider** = **Twilio**
4. Paste your three Twilio values:
   - Twilio Account SID
   - Twilio Auth Token
   - Twilio Phone Number (with `+1` prefix)
5. Click **Save**

That's it on the Supabase side. They'll handle the SMS delivery.

## Step 3: Flip the switch in the app (30 seconds)

1. Open **`1M Beers App.html`** in any text editor
2. Find this block near the top:

```js
window.__1MB_CONFIG = {
  supabaseUrl: "...",
  supabaseAnonKey: "...",
  smsEnabled: false,  // ← change this
};
```

3. Change `false` to `true`:
```js
  smsEnabled: true,
```

4. Save the file → re-deploy to Cloudflare (drag the folder into your Pages project again)

## Step 4: Test it

1. Open your live URL → run onboarding
2. Enter your real phone number
3. You'll get an actual SMS with a 6-digit code from your Twilio number
4. Enter the code → verified ✅

You'll see in Supabase → **Authentication** → **Users**: real user rows with verified phone numbers and stable `auth.uid()`s.

## Why this matters

- **One person = one identity across devices**: If they switch from phone to laptop, they sign in with the same number and see their same log history
- **Trust + accountability**: Toasts are tied to a verified phone (you can ban abusers)
- **Future-proof**: Once you have `auth.uid()`, you can lock down Row-Level Security to "only see your own personal rows" instead of the current trust-the-client_id model

## Troubleshooting

**"Failed to send sms"** → Twilio Auth Token has a typo, or the number isn't verified on Twilio's trial. In Twilio console, verify each test recipient under **Phone Numbers → Verified Caller IDs**.

**"Invalid OTP"** → Code expired (60 sec default). Tap "Resend in 30s" to get a new one.

**"Provider not enabled"** → You forgot to flip the Phone toggle in Supabase Auth providers.

🍻 Once it's working, your app is feature-complete for real launch.
