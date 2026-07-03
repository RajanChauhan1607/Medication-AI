# Medication AI — Supabase backend (new project)

Rebuilt from scratch as a clean, efficient schema. Replaces the old `DawaiSaathi` project.

## Project
- **Name:** medira
- **Ref / project id:** `bjxhnkwgtnkxyotzdzcw`
- **Region:** ap-south-1 (Mumbai)
- **URL:** https://bjxhnkwgtnkxyotzdzcw.supabase.co
- **Publishable key:** `sb_publishable_ZXkAUu3AaCNGc1qXaMCR1w_LDC_lrfn`
- App is already pointed here (`PrescriptionDetection-1/expo/src/services/extract.js`).

## What's deployed
- **Schema** (one migration): `profiles, medicines, doses, prescriptions, sos_contacts, scan_events`
  with enums, indexes, RLS on every table, `updated_at` triggers, **auto-create profile on
  signup**, and a `v_adherence_14d` view. (Full SQL: `migrations/medira_core_schema.sql`.)
- **Storage:** private `prescriptions` bucket with per-user-folder RLS.
- **Edge Function** `extract-prescription` (Track-3 hardened: rate limit 40/day, usage log,
  size cap, per-user identity). Verified reachable. `verify_jwt` OFF (keyless inline flow).

## ⚠️ Two manual steps to finish (dashboard)
1. **Set the Gemini key** → Project Settings → Edge Functions → **Secrets** → add
   `GEMINI_API_KEY` = (same value as `secrets/gemini_key_pro.txt`). The function returns
   `"GEMINI_API_KEY secret is not set"` until this is done.
2. **Phone OTP login** (for Track 4) → Authentication → Providers → enable **Phone**, then
   add an SMS provider (Twilio or MSG91) with its credentials. Needed before OTP can send SMS.

## Verify after step 1
Scan a prescription in the app → medicines come back, and `select count(*) from scan_events;`
shows a logged row.
