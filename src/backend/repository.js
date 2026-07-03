// services/repository.js — persistence layer: maps the in-memory store <-> the medira DB.
// Loads the user's medicines / profile / SOS on login, and mirrors changes back to the
// cloud (RLS keeps every row scoped to the signed-in user). Doses are derived from the
// medicines' times, so the daily schedule is rebuilt locally on load.

import { supabase } from './supabase';

// ---- time format: "8:00 AM" <-> "08:00:00" (Postgres time) ----
function ampmToSql(t) {
  const m = String(t || '').match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return null;
  let h = +m[1] % 12;
  if (/PM/i.test(m[3])) h += 12;
  return `${String(h).padStart(2, '0')}:${m[2].padStart(2, '0')}:00`;
}
function sqlToAmpm(t) {
  if (!t) return null;
  const [H, M] = String(t).split(':');
  let h = +H; const ap = h >= 12 ? 'PM' : 'AM'; let h12 = h % 12; if (h12 === 0) h12 = 12;
  return `${h12}:${M} ${ap}`;
}

const FORMS = new Set(['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'other']);
const normForm = (f) => { const x = String(f || '').toLowerCase(); return FORMS.has(x) ? x : 'tablet'; };
const isUuid = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s || ''));

// ---- medicine <-> row ----
function medToRow(uid, m) {
  return {
    id: m.id, user_id: uid, name: m.name, strength: m.strength || null,
    form: normForm(m.form), instruction: m.instruction || null,
    color: m.color || null, icon: m.icon || m.instrIcon || 'pill',
    per_day: m.per_day || '', times: m.times || [],
    duration_text: m.duration || null, stock_weeks: m.stock_weeks ?? null,
    course_day: m.courseDay ?? null, course_total: m.courseTotal ?? null,
    source: m.source === 'scan' ? 'scan' : 'manual',
    reminders_on: m.remindersOn !== false, tune: m.tune || null, active: m.active !== false,
  };
}
function rowToMed(r) {
  return {
    id: r.id, name: r.name, strength: r.strength || '', form: r.form,
    instruction: r.instruction || '', color: r.color || '#0E7C86',
    icon: r.icon || 'pill', instrIcon: r.icon || 'pill',
    per_day: r.per_day || '', times: r.times || [],
    duration: r.duration_text || 'Ongoing', stock_weeks: r.stock_weeks,
    courseDay: r.course_day, courseTotal: r.course_total,
    left: 30, startedAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
    from: r.source === 'scan' ? 'Scanned' : 'Manual entry', scanned: 'Saved',
    adherence: 1, remindersOn: r.reminders_on, tune: r.tune || 'chime', source: r.source,
    schedule: `${(r.times || []).length}× daily`, frequency: '', freqShort: '', dose: '', purpose: '',
  };
}

// ---- loads ----
export async function fetchMedicines(uid) {
  const { data, error } = await supabase.from('medicines').select('*').eq('user_id', uid).eq('active', true);
  if (error) throw error;
  return (data || []).map(rowToMed);
}
export async function fetchProfile(uid) {
  const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
  return data || null;
}
export async function fetchSos(uid) {
  const { data } = await supabase.from('sos_contacts').select('*').eq('user_id', uid).order('sort');
  return (data || []).map((c) => ({
    id: c.id, kind: c.kind, name: c.name || '', relation: c.relation || '',
    phone: c.phone || '', primary: c.is_primary, color: '#0E7C86',
  }));
}
// ---- prescriptions (scan history) ----
function fmtDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
function rowToHistory(r) {
  const ms = r.scanned_at ? new Date(r.scanned_at).getTime() : Date.now();
  return {
    id: r.id,
    title: r.clinic || r.doctor || 'Prescription',
    doctor: r.doctor || '',
    date: fmtDate(ms),
    meds: r.med_count || 0,
    detected: r.raw_json || null,
    scannedAt: ms,
  };
}
export async function fetchPrescriptions(uid) {
  const { data } = await supabase.from('prescriptions').select('*').eq('user_id', uid).order('scanned_at', { ascending: false });
  return (data || []).map(rowToHistory);
}
export async function savePrescription(uid, p) {
  const row = {
    user_id: uid,
    doctor: p.doctor || null,
    clinic: p.clinic || null,
    med_count: p.medCount ?? (Array.isArray(p.detected) ? p.detected.length : 0),
    raw_json: p.detected || null,
    scanned_at: p.scannedAt ? new Date(p.scannedAt).toISOString() : new Date().toISOString(),
  };
  const { data, error } = await supabase.from('prescriptions').insert(row).select().single();
  if (error) throw error;
  return rowToHistory(data);
}
// resolves the signed-in user itself (guest or Google) — no-op for logged-out
export async function persistScan(scan) {
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user?.id;
  if (!uid) return null;
  return savePrescription(uid, scan);
}

export async function fetchAll(uid) {
  const [meds, profile, sos, history] = await Promise.all([
    fetchMedicines(uid), fetchProfile(uid), fetchSos(uid), fetchPrescriptions(uid),
  ]);
  return { meds, profile, sos, history };
}

// ---- saves (mirror current state) ----
export async function saveMedicines(uid, meds) {
  const rows = (meds || []).map((m) => medToRow(uid, m));
  if (rows.length) {
    const { error } = await supabase.from('medicines').upsert(rows);
    if (error) throw error;
  }
  // deactivate any DB medicine no longer in the store
  const ids = (meds || []).map((m) => m.id).filter(isUuid);
  let q = supabase.from('medicines').update({ active: false }).eq('user_id', uid).eq('active', true);
  if (ids.length) q = q.not('id', 'in', `(${ids.join(',')})`);
  await q;
}
export async function upsertProfile(uid, settings) {
  const meals = settings.meals || {};
  const age = parseInt(settings.age, 10);
  await supabase.from('profiles').upsert({
    id: uid,
    full_name: settings.name || null,
    phone: settings.phone || null,
    age: Number.isFinite(age) ? age : null,
    gender: settings.gender || null,
    breakfast: ampmToSql(meals.breakfast),
    lunch: ampmToSql(meals.lunch),
    dinner: ampmToSql(meals.dinner),
    default_tune: settings.defaultTune || 'chime',
    snooze_min: settings.snoozeMin || 30,
  });
}
export async function saveSos(uid, contacts) {
  const rows = (contacts || [])
    .filter((c) => (c.name || '').trim() || (c.phone || '').trim())
    .map((c, i) => ({
      user_id: uid, name: c.name || null, relation: c.relation || null,
      phone: c.phone || null, kind: c.kind || 'family', is_primary: !!c.primary, sort: i,
    }));
  await supabase.from('sos_contacts').delete().eq('user_id', uid);
  if (rows.length) await supabase.from('sos_contacts').insert(rows);
}

export async function saveAll(uid, state) {
  await Promise.all([
    saveMedicines(uid, state.meds),
    upsertProfile(uid, state.settings),
    saveSos(uid, state.settings?.sos),
  ]);
}

// expose the format helper for hydrate
export { sqlToAmpm };
