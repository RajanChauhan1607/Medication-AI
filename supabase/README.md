# Medication AI — backend source (Supabase)

This folder is the **source of truth** for the Medication AI backend. The backend itself runs in
the cloud (Supabase project `bjxhnkwgtnkxyotzdzcw`); these files let you recreate or redeploy it.

```
supabase/
├─ functions/extract-prescription/index.ts   the Edge Function (Gemini OCR + rate limit + JWT verify)
├─ migrations/medira_core_schema.sql          full DB schema (tables, RLS, storage, triggers, view)
├─ migrations/0002_scan_events.sql            later migration(s)
├─ DEPLOY_HARDENING.md, NEW_PROJECT_medira.md, SETUP_GOOGLE.md   setup notes
```

## Deploy / update the Edge Function
The currently deployed version (v9) matches `functions/extract-prescription/index.ts`. To
redeploy after editing it:

```bash
# from the repo's expo/ folder (which contains this supabase/ dir)
supabase functions deploy extract-prescription \
  --project-ref bjxhnkwgtnkxyotzdzcw \
  --no-verify-jwt
```
`--no-verify-jwt` is intentional: the gateway stays open (so guest scans work) and the
function verifies the JWT **internally** (see `resolveIdentity`).

Required function secret (set once in the dashboard → Edge Functions → Secrets):
`GEMINI_API_KEY` (the server-side Gemini key). `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

## Recreate the database (only for a brand-new project)
Run `migrations/medira_core_schema.sql` then `migrations/0002_scan_events.sql` in the SQL
editor. This sets up all tables, **RLS policies**, the private `prescriptions` storage
bucket, triggers, and the adherence view.

## Notes
- Secrets (Gemini / service-role keys) are **never** committed — they live in Supabase.
- After any schema change, run the Supabase **Security Advisors** to confirm RLS.
