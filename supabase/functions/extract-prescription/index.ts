// extract-prescription — hardened + richer extraction
// (header doctor/clinic + per-medicine name, strength, form, per_day, instruction, duration).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const DAILY_LIMIT = 40;
const MAX_B64_CHARS = 9_000_000;

// ── request validation ────────────────────────────────────────────────
// Strict server-side checks on everything the client sends. All failures return
// the same generic 400 so callers can't probe which rule tripped.
const GENERIC_400 = "Invalid request.";
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const B64_RE = /^[A-Za-z0-9+/]+={0,2}$/;                       // raw base64, no data: prefix
const PATH_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[A-Za-z0-9._-]{1,128}$/i; // "<uid>/<file>", no traversal

type Body = { path?: string; image_b64?: string; mime?: string };
function validateBody(raw: unknown): { ok: true; body: Body } | { ok: false; reason: string } {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return { ok: false, reason: "body_not_object" };
  const { path, image_b64, mime } = raw as Record<string, unknown>;
  if (image_b64 === undefined && path === undefined) return { ok: false, reason: "no_image_or_path" };
  if (mime !== undefined && (typeof mime !== "string" || !ALLOWED_MIME.has(mime))) return { ok: false, reason: "bad_mime" };
  if (image_b64 !== undefined) {
    if (typeof image_b64 !== "string" || image_b64.length < 100) return { ok: false, reason: "b64_not_string" };
    if (image_b64.length > MAX_B64_CHARS) return { ok: false, reason: "b64_too_large" };
    if (!B64_RE.test(image_b64)) return { ok: false, reason: "b64_bad_charset" };
  }
  if (path !== undefined && (typeof path !== "string" || !PATH_RE.test(path))) return { ok: false, reason: "bad_path" };
  return { ok: true, body: { path, image_b64, mime } as Body };
}

const PROMPT = `You are a meticulous clinical pharmacist who reads handwritten and printed medical
prescriptions, including Indian clinical shorthand (Rx, Tab, Cap, Syp, OD/BD/TDS/QID,
p.c./a.c., h.s., SOS, stat) and Hindi/Devanagari notes. Your job is to convert the
prescription into STRUCTURED JSON that a medication-reminder app can turn into alarms.

CORE RULES
- Be literal and faithful: report ONLY what is actually written. NEVER invent a medicine,
  strength, frequency, or duration that is not on the page.
- Read the medicine list TOP TO BOTTOM and output one object per distinct drug line, in the
  same order. A single line with a "+"/combination (e.g. "Steam + Salt gargle") is ONE entry.
- If a field is genuinely not written or unreadable, use "" (empty string) — do not guess.
- Prefer legibility of the drug NAME over everything: if unsure between two readings, pick the
  most clinically plausible real medicine name.

STEP 1 — HEADER (letterhead), if visible:
- "doctor" — prescribing doctor's name, e.g. "Dr. A. Mehta". "" if absent.
- "clinic" — clinic / hospital / practice name. "" if absent.

STEP 2 — for EACH medicine output these fields EXACTLY:

1. "name" — the medicine NAME ONLY. No strength, no form word, no dosing. Brand
   (e.g. "Crocin") OR generic/active ingredient (e.g. "Paracetamol") are both fine. Keep
   combination names joined with " + " (e.g. "Steam Inhalation + Salt water gargle").

2. "strength" — strength written with it: "500 mg", "40 mg", "5 ml", "650 mg", "40/5 mg".
   Normalise spacing to "<number> <unit>". "" if none.

3. "form" — EXACTLY one of: "tablet","capsule","syrup","injection","drops","cream","other".
   Tab/T→tablet, Cap/C→capsule, Syp/Syr→syrup, Inj→injection, Gtt/drops→drops,
   Oint/gel/cream→cream. Non-drug measures (steam, gargle, powder, nebulisation)→"other".
   Default "tablet" only when a pill is clearly implied.

4. "per_day" — the dosing schedule as MORNING-AFTERNOON-NIGHT counts, three numbers joined
   by hyphens, e.g. "1-0-1" = 1 morning + 0 afternoon + 1 night. This drives the alarms, so
   be precise:
   - "OD"/once daily → "1-0-0"   • "BD"/twice → "1-0-1"   • "TDS"/thrice → "1-1-1"
   - "QID"/4× a day → "1-1-1" (app supports 3 slots; capture as thrice + night if unsure)
   - A written grid like "1-1-1", "1-0-1", "0-0-1", "½-0-½" → use it as-is (round ½ up to 1).
   - More than one unit per dose → use that count (2 tabs at night → "0-0-2").
   - Explicit clock times → map to the nearest slot: morning (5am–11am), afternoon
     (12pm–4pm), night (5pm–4am). e.g. "8am & 9pm" → "1-0-1".
   - "when required"/PRN/SOS/"if needed" → exactly "SOS".
   - "stat"/single immediate dose → "1-0-0".
   - Not a fixed daily schedule (once a week, every 6 hours, alternate days) → write the
     phrase literally (e.g. "once a week").
   - Frequency not written → "".

5. "instruction" — timing vs food/sleep. EXACTLY one of: "after food","before food",
   "empty stomach","at bedtime","with water", or "".
   Map: p.c. / "after meals" / बाद में → "after food";  a.c. / "before meals" / पहले →
   "before food";  खाली पेट / "empty stomach" → "empty stomach";  h.s. / "at night" / रात
   → "at bedtime". Before-food and empty-stomach meds are alarmed BEFORE the meal, so read
   these carefully.

6. "duration" — TOTAL course length. Express in WEEKS (7 days = 1 week, 1 month ≈ 4 weeks,
   1 year = 52 weeks; decimals ok, e.g. "1.4 weeks"). EXCEPTION: 7 days or fewer → give DAYS
   ("5 days"). "Continue"/"ongoing"/lifelong → "". "" if not written.

Ignore diagnoses, investigations, tests, diet, and lifestyle advice — medicines only.

EXAMPLE (illustrative — do not copy its contents):
Input shows: "Dr. R. Sharma, City Clinic. 1) Tab Augmentin 625mg 1-0-1 x 5 days p.c.
2) Cap Becosules OD after food. 3) Crocin 650 SOS."
Output:
{"doctor":"Dr. R. Sharma","clinic":"City Clinic","medicines":[
{"name":"Augmentin","strength":"625 mg","form":"tablet","per_day":"1-0-1","instruction":"after food","duration":"5 days"},
{"name":"Becosules","strength":"","form":"capsule","per_day":"1-0-0","instruction":"after food","duration":""},
{"name":"Crocin","strength":"650 mg","form":"tablet","per_day":"SOS","instruction":"","duration":""}]}

Return ONLY valid minified JSON in exactly this shape, nothing else:
{"doctor":"","clinic":"","medicines":[{"name":"","strength":"","form":"","per_day":"","instruction":"","duration":""}]}`;

const KNOWN = ["crocin","meftal","allegra","ambrolite","ascoril","nasivion","augmentin","moxikind",
"mahacef","moflox","rantac","sompraz","esotrab","famocid","ondem","folvite","celin","shelcal",
"calcimax","supracal","calcirol","corcal","depura","uprise","lumia","arachitol","lupi","thyronorm",
"volini","dynapar","aceproxyvon","zerodol","acedal","altraday","nexito","naxdom","becosules",
"glycomet","janumet","volix","pregalin","montek","ventolin","levolin","rifagut","atorvas","dilzem",
"ursocol","voricon","betadine","sporlac","bifilac","vizylac","chymoral","rejunex","cartigen",
"nutrolin","karvol","paracetamol","amoxicillin","ondansetron","cefixime","ofloxacin","metformin",
"vertin","unienzym","udiliv","mucaine","spasrin","vomisa","gutbilee","enerzal","bortezomib",
"cabergoline","unidol","normaxin","neopride","clonazepam","haptob","hadjod","nerviday","pantoprazole","ibuprofen"];

const FORM_WORDS = new Set(["tab","tabs","tablet","tablets","cap","caps","capsule","capsules",
"syp","syr","syrup","inj","injection","oint","ointment","gel","cream","drops","drop","t","c","powder","sachet","neb","nebulization"]);

type Parsed = { medicines: Record<string, string>[]; doctor: string; clinic: string };
function parseJson(text: string): Parsed {
  const empty: Parsed = { medicines: [], doctor: "", clinic: "" };
  const t = (text ?? "").trim().replace(/^```(json)?/, "").replace(/```$/, "").trim();
  const pick = (s: string): Parsed | null => {
    try {
      const d = JSON.parse(s);
      if (d && Array.isArray(d.medicines)) {
        return { medicines: d.medicines, doctor: typeof d.doctor === "string" ? d.doctor : "", clinic: typeof d.clinic === "string" ? d.clinic : "" };
      }
    } catch (_e) { /* */ }
    return null;
  };
  return pick(t) ?? pick((t.match(/\{[\s\S]*\}/) || [""])[0]) ?? empty;
}
function confidence(name: string) {
  const words = (name ?? "").toLowerCase().replace(/[^a-z ]/g, " ").split(/\s+/).filter((w) => w && !FORM_WORDS.has(w));
  const root = words[0] ?? "";
  if (!root || root.length < 3) return "low";
  return KNOWN.some((k) => k.includes(root) || root.includes(k) || (root.length > 3 && k.startsWith(root.slice(0, 4)))) ? "high" : "low";
}
// Resolve a TRUSTWORTHY identity: VERIFY the JWT via the auth server (not just decode it),
// so a forged token can't impersonate a user or get a fresh rate-limit bucket. Unverified /
// anonymous callers fall back to their IP, which is then rate-limited the same way.
async function resolveIdentity(req: Request, admin: ReturnType<typeof createClient>) {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  let userId: string | null = null;
  if (token && token.split(".").length === 3) {
    try {
      const { data } = await admin.auth.getUser(token); // validates signature + expiry server-side
      userId = data.user?.id ?? null;
    } catch (_e) { /* invalid/expired → treat as anonymous */ }
  }
  return { userId, identity: userId ? ("user:" + userId) : ("ip:" + ip) };
}

Deno.serve(async (req: Request) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

  const t0 = Date.now();
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { userId, identity } = await resolveIdentity(req, admin);

  try {
    const key = Deno.env.get("GEMINI_API_KEY");
    if (!key) {
      console.error("config_error: GEMINI_API_KEY secret is not set");
      return json({ error: "The scan service is temporarily unavailable. Please try again later." }, 500);
    }

    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count } = await admin.from("scan_events")
      .select("id", { count: "exact", head: true })
      .eq("identity", identity).gte("created_at", since);
    if ((count ?? 0) >= DAILY_LIMIT) return json({ error: "Daily scan limit reached. Please try again tomorrow." }, 429);

    const rawBody = await req.json().catch(() => null);
    const v = validateBody(rawBody);
    if (!v.ok) {
      // log the failure server-side for monitoring; the caller only sees the generic message
      console.warn(`validation_failed reason=${v.reason} identity=${identity}`);
      admin.from("scan_events").insert({ user_id: userId, identity, ok: false, med_count: 0, ms: Date.now() - t0 }).then(() => {});
      return json({ error: GENERIC_400 }, 400);
    }
    const { path, image_b64, mime } = v.body;
    let b64 = "";
    let mediaType = mime || "image/jpeg";
    if (image_b64) {
      b64 = image_b64;
    } else if (path) {
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
      const { data: blob, error: dlErr } = await userClient.storage.from("prescriptions").download(path);
      if (dlErr || !blob) {
        console.warn(`download_failed identity=${identity} err=${dlErr?.message ?? "not found"}`);
        return json({ error: GENERIC_400 }, 400);
      }
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let bin = ""; const CHUNK = 0x8000;
      for (let i = 0; i < bytes.length; i += CHUNK) bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
      b64 = btoa(bin); mediaType = "image/jpeg";
    } else {
      return json({ error: GENERIC_400 }, 400); // unreachable — validateBody guarantees one input
    }

    const body = {
      contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: mediaType, data: b64 } }] }],
      generationConfig: { response_mime_type: "application/json" },
    };

    let parsed: Parsed = { medicines: [], doctor: "", clinic: "" };
    let lastErr = "";
    for (let attempt = 0; attempt < 4; attempt++) {
      const r = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
        { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key }, body: JSON.stringify(body) });
      if (r.ok) { const j = await r.json(); parsed = parseJson(j?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""); lastErr = ""; break; }
      lastErr = `gemini ${r.status}: ${(await r.text()).slice(0, 200)}`;
      if (attempt < 3) await new Promise((res) => setTimeout(res, 3000 * (attempt + 1)));
    }

    const out = (lastErr ? [] : parsed.medicines).map((m) => ({
      name: m.name ?? "",
      strength: m.strength ?? "",
      form: m.form ?? "",
      per_day: m.per_day ?? "",
      instruction: m.instruction ?? "",
      duration: m.duration ?? m.stock ?? "",
      confidence: confidence(m.name ?? ""),
    })).filter((m) => m.name.trim().length > 0);

    admin.from("scan_events").insert({ user_id: userId, identity, ok: !lastErr, med_count: out.length, ms: Date.now() - t0 }).then(() => {});
    if (lastErr) {
      console.error(`gemini_failed identity=${identity} ${lastErr}`);
      return json({ error: "We couldn't read that photo right now. Please try again in a moment." }, 502);
    }
    return json({ medicines: out, doctor: parsed.doctor, clinic: parsed.clinic });
  } catch (e) {
    console.error(`unhandled identity=${identity} ${String(e)}`);
    admin.from("scan_events").insert({ user_id: userId, identity, ok: false, med_count: 0, ms: Date.now() - t0 }).then(() => {});
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
