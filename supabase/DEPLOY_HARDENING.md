# Deploy the hardened backend (Track 3)

Two artifacts, applied to the Supabase project (DawaiSaathi · `fvgeqvsceslwbdjybmff`):

## 1. Create the usage/rate-limit table
Supabase dashboard → **SQL Editor** → paste & run `migrations/0002_scan_events.sql`.

## 2. Update the Edge Function
Dashboard → **Edge Functions → extract-prescription → Edit** → replace the code with
`functions/extract-prescription/index.ts` → **Deploy**.
- Keep **"Verify JWT"** OFF (the mobile app calls it with only the publishable key for now).
- No new secrets needed — `GEMINI_API_KEY` already set; `SUPABASE_SERVICE_ROLE_KEY` is
  injected automatically.

(Or just tell me when the Supabase tools reconnect and I'll deploy both in one step.)

## What changes for users / the app
- **Nothing breaks.** Same request/response shape; the app needs no changes.
- New protections: max **40 scans/day per user/device**, oversized images rejected, every
  scan logged to `scan_events` for monitoring + cost visibility.
- When login lands (Track 4), scans automatically attribute to the signed-in user instead
  of their IP — no further backend work needed.

## Verify after deploy
- Scan a test image → still returns medicines.
- Check `select count(*), max(created_at) from scan_events;` → rows appear.
- The 41st scan within 24h from the same device → returns a friendly "limit reached" message.
