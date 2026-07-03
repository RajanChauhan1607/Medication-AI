// services/extract.js — the real AI scan pipeline for Medication AI.
// Pick a photo -> POST it to the Supabase `extract-prescription` Edge Function
// (Gemini 3.5 Flash, 89.4% benchmark) -> map the {name, per_day, stock} result
// into the app's detection-card shape consumed by the Results screen.
//
// The Gemini API key lives ONLY in the Edge Function (server-side). The app calls
// the function with the project's publishable anon key — nothing secret ships in the APK.

import * as ImagePicker from 'expo-image-picker';
import { MED_COLORS } from '../ui/theme/colors';
import { afterMealTimes, beforeMealTimes } from '../state/store';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';

const FN_URL = `${SUPABASE_URL}/functions/v1/extract-prescription`;

// ── 1. capture / pick an image, downscaled, as base64 ───────────────
export async function pickPrescriptionImage(fromCamera) {
  const opts = {
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.85,
    base64: true,
    allowsEditing: false,
  };
  let res;
  if (fromCamera) {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new Error('Camera permission denied');
    res = await ImagePicker.launchCameraAsync(opts);
  } else {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) throw new Error('Photo library permission denied');
    res = await ImagePicker.launchImageLibraryAsync(opts);
  }
  if (res.canceled || !res.assets || !res.assets[0]) return null;
  const asset = res.assets[0];
  return { uri: asset.uri, base64: asset.base64, mime: asset.mimeType || 'image/jpeg' };
}

// ── 2. send to the Edge Function, get structured medicines back ─────
export async function extractFromBase64(base64, mime = 'image/jpeg') {
  const headers = { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' };
  // when signed in, send the user's token so the scan attributes to them (per-user rate limit)
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

  const resp = await fetch(FN_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ image_b64: base64, mime }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || data.error) {
    throw new Error(data.error || `Server error ${resp.status}`);
  }
  return { medicines: data.medicines || [], doctor: data.doctor || '', clinic: data.clinic || '' };
}

// ── 3. map the AI output to the app's detection-card shape ──────────
const SLOT_NAMES = ['Morning', 'Afternoon', 'Night'];

function gridParts(per) {
  const m = /^(\d+)-(\d+)-(\d+)$/.exec((per || '').trim());
  return m ? [+m[1], +m[2], +m[3]] : null;
}
function freqShort(g) {
  const n = g.filter((x) => x > 0).length;
  return n === 1 ? 'OD' : n === 2 ? 'BD' : n === 3 ? 'TDS' : `${n}×`;
}
function detectForm(name) {
  const s = (name || '').toLowerCase();
  if (/\b(cap|caps|capsule)/.test(s)) return 'Capsule';
  if (/\b(syp|syr|syrup)/.test(s)) return 'Syrup';
  if (/\b(inj|injection)/.test(s)) return 'Injection';
  if (/\b(gel|cream|oint)/.test(s)) return 'Cream';
  if (/\b(drop|drops)/.test(s)) return 'Drops';
  return 'Tablet';
}
function cleanName(name) {
  // strip a leading form prefix like "Tab." / "Cap." / "Syp." for a tidy title
  return (name || '')
    .replace(/^\s*(tab|tabs|tablet|cap|caps|capsule|syp|syr|syrup|inj|injection|t|c)\.?\s+/i, '')
    .trim() || name;
}
function strengthOf(name) {
  const m = /(\d+(?:\.\d+)?)\s*(mg|mcg|ml|g|gm|iu|k)\b/i.exec(name || '');
  return m ? `${m[1]} ${m[2]}` : '';
}
function durationOf(stock) {
  const s = (stock || '').trim();
  if (!s) return 'Ongoing';
  const m = /([\d.]+)\s*(day|days|week|weeks)/i.exec(s);
  if (!m) return s;
  return `${m[1]} ${m[2].toLowerCase().startsWith('day') ? 'days' : 'weeks'}`;
}

const FORM_DISPLAY = { tablet: 'Tablet', capsule: 'Capsule', syrup: 'Syrup', injection: 'Injection', drops: 'Drops', cream: 'Cream' };
function formOf(m) {
  const f = String(m.form || '').toLowerCase();
  return FORM_DISPLAY[f] || detectForm(m.name); // prefer Gemini's form, else infer from the name
}
// food/sleep timing -> display text + the icon used on dose rows
function instructionOf(m, isSos) {
  const t = {
    'after food': { text: 'After food', icon: 'food' },
    'before food': { text: 'Before food', icon: 'food' },
    'empty stomach': { text: 'Empty stomach', icon: 'food' },
    'at bedtime': { text: 'At bedtime', icon: 'clock' },
    'with water': { text: 'With water', icon: 'drop' },
  }[String(m.instruction || '').toLowerCase()];
  if (t) return t;
  if (isSos) return { text: 'When needed', icon: 'pill' };
  return { text: 'As prescribed', icon: 'pill' };
}

/**
 * @param meds  array of {name, strength, form, per_day, instruction, duration, confidence} from the function
 * @param meals settings.meals ({breakfast,lunch,dinner}) so doses land after meals
 */
export function mapToCards(meds, meals) {
  const afterTimes = afterMealTimes(meals || {});   // [b+30, l+30, d+30] — after-food default
  const beforeTimes = beforeMealTimes(meals || {}); // [b-30, l-30, d-30] — before-food ring ahead
  return meds.map((m, i) => {
    const g = gridParts(m.per_day);
    const isSos = /sos/i.test(m.per_day || '');
    const conf = m.confidence === 'high' ? 0.95 : 0.74;
    const color = MED_COLORS[i % MED_COLORS.length];
    const nm = cleanName(m.name);
    const ins = instructionOf(m, isSos);
    // before-food meds should alarm before the meal; everything else lands after the meal
    const isBeforeFood = /before\s*food/i.test(m.instruction || '');
    const slotTimes = isBeforeFood ? beforeTimes : afterTimes;
    const fallback = isBeforeFood ? ['7:30 AM', '12:30 PM', '7:00 PM'] : ['8:00 AM', '2:00 PM', '8:00 PM'];

    let times = [];
    let frequency = m.per_day || '';
    let fShort = '';
    let dose = '1 dose';
    if (g) {
      times = [0, 1, 2].filter((k) => g[k] > 0).map((k) => slotTimes[k] || fallback[k]);
      fShort = freqShort(g);
      const total = g.reduce((a, b) => a + b, 0);
      frequency = `${times.length}× daily`;
      dose = total > times.length ? `${Math.max(...g)} per dose` : '1 dose';
    } else if (isSos) {
      frequency = 'As needed';
      fShort = 'SOS';
      times = []; // no fixed reminders for SOS meds
    } else if (m.per_day) {
      times = [slotTimes[0] || fallback[0]]; // literal phrase like "once a week" — remind once
    }

    return {
      id: (nm || 'med').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6) + i,
      name: nm,
      strength: m.strength || strengthOf(m.name),  // prefer Gemini's strength
      form: formOf(m),
      dose,
      frequency,
      freqShort: fShort,
      duration: durationOf(m.duration || m.stock),
      instruction: ins.text,
      instrIcon: ins.icon,
      purpose: 'From your prescription',
      per_day: m.per_day || '',
      source: 'scan',
      confidence: conf,
      times,
      raw: [m.name, m.strength, m.per_day, m.duration].filter(Boolean).join(' · '),
      color,
    };
  });
}
