// state/store.js — Medication AI global store + actions + time helpers.
// Direct port of the prototype's pub/sub store; exposes a `useReka()` hook
// that re-renders subscribers on any state change.

import React from 'react';
import { MED_COLORS } from '../ui/theme/colors';

// client-side uuid (v4) so medicine ids line up with the DB's uuid columns
export function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0; const v = c === 'x' ? r : (r & 0x3) | 0x8; return v.toString(16);
  });
}
// "08:00:00" (Postgres time) -> "8:00 AM"
function sqlToAmpm(t) {
  if (!t) return null;
  const [H, M] = String(t).split(':');
  let h = +H; const ap = h >= 12 ? 'PM' : 'AM'; let h12 = h % 12; if (h12 === 0) h12 = 12;
  return `${h12}:${M} ${ap}`;
}

// ── time helpers ─────────────────────────────────────────────
export function toMins(s) {
  const m = String(s).match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return 0;
  let h = +m[1] % 12;
  if (/PM/i.test(m[3])) h += 12;
  return h * 60 + +m[2];
}
export function fromMins(x) {
  let h = Math.floor(x / 60) % 24;
  const mm = x % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(mm).padStart(2, '0')} ${ap}`;
}
// live "current time" in minutes since midnight (real device clock)
export function nowMins() { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
export function plusMin(timeStr, n) { return fromMins(toMins(timeStr) + n); }
export function afterMealTimes(meals, offset = 30) {
  return [meals.breakfast, meals.lunch, meals.dinner].filter(Boolean).map((t) => plusMin(t, offset));
}
// before-food reminders: ring `offset` minutes BEFORE each meal (wraps safely past midnight).
export function beforeMealTimes(meals, offset = 30) {
  return [meals.breakfast, meals.lunch, meals.dinner].filter(Boolean).map((t) => fromMins((toMins(t) - offset + 1440) % 1440));
}

// ── doses are derived from a medicine's times ────────────────
// If the course STARTED later today (e.g. you scanned the prescription at 2pm, after lunch),
// the dose slots BEFORE that start time are EXCLUDED for that day — they are not shown and
// not counted in adherence. The schedule simply begins at the next slot (e.g. dinner). From
// the next day, the full schedule applies. Derived from startedAt so it stays correct across
// app reloads (not only at the moment of scanning).
function isSameDay(ts) {
  const d = new Date(ts); const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}
function makeDoses(med) {
  const now = nowMins();
  const startMins = (med.startedAt && isSameDay(med.startedAt))
    ? new Date(med.startedAt).getHours() * 60 + new Date(med.startedAt).getMinutes()
    : 0;
  return (med.times || [])
    .map((tm, i) => {
      const t = toMins(tm);
      return {
        id: `${med.id}-${i}-${Date.now()}-${Math.round(Math.random() * 1e4)}`,
        medId: med.id, med: med.name, strength: med.strength, time: tm, mins: t,
        note: med.instruction || '',
        status: t > now ? 'upcoming' : 'due',
        icon: med.instrIcon || med.icon || 'pill', color: med.color,
      };
    })
    .filter((d) => d.mins >= startMins); // exclude slots before the scan time on the start day
}

// ── initial state: empty. The user's data loads from the cloud on login
//    (services/cloudsync.js → actions.hydrate), and changes mirror back to the DB. ──
let state = {
  meds: [],
  doses: [],
  history: [],
  hydrated: false, // true once the user's cloud data has loaded (gates the onboarding decision)
  dosesDate: null, // toDateString() the current doses were built for (for day-aware refresh)
  settings: {
    name: '', phone: '', age: '', gender: '', loggedIn: false,
    defaultTune: 'chime', snoozeMin: 30,
    meals: { breakfast: '8:00 AM', lunch: '1:00 PM', dinner: '7:30 PM' },
    sos: [
      { id: 'doc', kind: 'doctor', name: '', relation: '', phone: '', color: '#DC7A57', primary: true },
      { id: 'c2', kind: 'family', name: '', relation: '', phone: '', color: '#6E9B6B', primary: false },
      { id: 'c3', kind: 'family', name: '', relation: '', phone: '', color: '#5B7FB0', primary: false },
    ],
  },
};

// ── pub/sub ──────────────────────────────────────────────────
const listeners = new Set();
function emit() { listeners.forEach((l) => l()); }
function set(updater) {
  state = { ...state, ...(typeof updater === 'function' ? updater(state) : updater) };
  emit();
}

// ── actions ──────────────────────────────────────────────────
export const actions = {
  markTaken: (id) => set((s) => ({ doses: s.doses.map((d) => (d.id === id ? { ...d, status: 'taken' } : d)) })),
  skip: (id) => set((s) => ({ doses: s.doses.map((d) => (d.id === id ? { ...d, status: 'skipped' } : d)) })),
  undo: (id) => set((s) => ({ doses: s.doses.map((d) => (d.id === id ? { ...d, status: d.mins <= nowMins() ? 'due' : 'upcoming' } : d)) })),
  snooze: (id, min = 15) => set((s) => ({
    doses: s.doses.map((d) => (d.id === id ? { ...d, mins: d.mins + min, time: fromMins(d.mins + min), status: 'upcoming' } : d)).sort((a, b) => a.mins - b.mins),
  })),
  // Called when the user taps Snooze on a grouped reminder alarm — bump EVERY medicine in
  // that alarm by the snooze interval. "Taken" is handled in the UI by opening the Home
  // screen, where the user marks each dose taken, so it does not change dose state here.
  reminderAction: (action, data = {}) => set((s) => {
    if (action !== 'snooze') return {};
    const ids = new Set(String(data.medIds || data.medId || '').split(',').filter(Boolean));
    if (!ids.size) return {};
    const snz = s.settings.snoozeMin || 30;
    const doses = s.doses
      .map((d) => (
        ids.has(d.medId) && (d.status === 'due' || d.status === 'upcoming') && (!data.time || d.time === data.time)
          ? { ...d, mins: d.mins + snz, time: fromMins(d.mins + snz), status: 'upcoming' }
          : d
      ))
      .sort((a, b) => a.mins - b.mins);
    return { doses };
  }),
  requestRefill: (medId) => set((s) => ({ meds: s.meds.map((m) => (m.id === medId ? { ...m, left: m.left + 30 } : m)) })),
  setMedTune: (medId, tune) => set((s) => ({ meds: s.meds.map((m) => (m.id === medId ? { ...m, tune } : m)) })),
  toggleReminders: (medId, on) => set((s) => ({ meds: s.meds.map((m) => (m.id === medId ? { ...m, remindersOn: on } : m)) })),
  setMedTimes: (medId, times) => set((s) => ({
    meds: s.meds.map((m) => (m.id === medId ? { ...m, times } : m)),
    doses: [...s.doses.filter((d) => d.medId !== medId), ...makeDoses({ ...s.meds.find((m) => m.id === medId), times })].sort((a, b) => a.mins - b.mins),
  })),
  setDefaultTune: (tune) => set((s) => ({ settings: { ...s.settings, defaultTune: tune } })),
  setSnooze: (min) => set((s) => ({ settings: { ...s.settings, snoozeMin: min } })),
  setName: (name) => set((s) => ({ settings: { ...s.settings, name } })),
  setProfile: (partial) => set((s) => ({ settings: { ...s.settings, ...partial } })),
  setMeals: (meals) => set((s) => ({ settings: { ...s.settings, meals: { ...s.settings.meals, ...meals } } })),
  setSosContact: (id, partial) => set((s) => ({ settings: { ...s.settings, sos: s.settings.sos.map((c) => (c.id === id ? { ...c, ...partial } : c)) } })),
  setSosPrimary: (id) => set((s) => ({ settings: { ...s.settings, sos: s.settings.sos.map((c) => ({ ...c, primary: c.id === id })) } })),
  applyMealReminders: () => set((s) => {
    const after = afterMealTimes(s.settings.meals);
    const before = beforeMealTimes(s.settings.meals);
    const meds = s.meds.map((m) => {
      const instr = (m.instruction || '').toLowerCase();
      const isAfter = /after\s*food/.test(instr);
      const isBefore = /before\s*food/.test(instr);
      if (!isAfter && !isBefore) return m;
      const slots = isBefore ? before : after;   // before-food meds ring ahead of the meal
      const times = slots.slice(0, Math.max(1, (m.times || []).length || slots.length));
      return { ...m, times, mealLinked: true };
    });
    const foodIds = meds.filter((m) => m.mealLinked).map((m) => m.id);
    const doses = [
      ...s.doses.filter((d) => !foodIds.includes(d.medId)),
      ...meds.filter((m) => m.mealLinked).flatMap((m) => makeDoses(m)),
    ].sort((a, b) => a.mins - b.mins);
    return { meds, doses };
  }),
  // pass med.startedAt (e.g. the scan time) so today's pre-start slots count as taken.
  addMed: (med) => set((s) => {
    const id = uuid();
    const full = {
      id, form: 'Tablet', purpose: med.purpose || 'Added manually', courseDay: null, courseTotal: null,
      left: med.left || 30, color: med.color || MED_COLORS[s.meds.length % MED_COLORS.length], icon: 'pill',
      from: 'Manual entry', scanned: 'Today', adherence: 1, freqShort: '', duration: med.duration || 'Ongoing',
      startedAt: med.startedAt || Date.now(),
      instrIcon: med.instrIcon || 'pill', tune: med.tune || s.settings.defaultTune, remindersOn: true,
      schedule: `${(med.times || []).length}× daily`, ...med, id,
    };
    return { meds: [...s.meds, full], doses: [...s.doses, ...makeDoses(full)].sort((a, b) => a.mins - b.mins) };
  }),
  // record a completed scan into the History list (newest first)
  addScanRecord: (rec) => set((s) => ({ history: [rec, ...(s.history || [])] })),
  // mark the store as loading the next user's data (gates onboarding/Main until hydrate)
  beginLoad: () => set({ hydrated: false }),
  // replace the store from cloud data on login/refresh; rebuilds today's doses from medicines.
  // Preserves TODAY's taken/skipped marks across a refresh (doses are derived, so a naive
  // refetch would wipe them); on a new day it starts fresh.
  hydrate: ({ meds, profile, sos, history }) => set((s) => {
    const today = new Date().toDateString();
    const keep = {};
    if (s.dosesDate === today) {
      (s.doses || []).forEach((d) => {
        if (d.status === 'taken' || d.status === 'skipped') keep[`${d.medId}|${d.time}`] = d.status;
      });
    }
    const next = { meds: meds || [], history: history || [], hydrated: true, dosesDate: today, settings: { ...s.settings } };
    next.doses = (meds || []).flatMap((m) => makeDoses(m))
      .map((d) => { const k = keep[`${d.medId}|${d.time}`]; return k ? { ...d, status: k } : d; })
      .sort((a, b) => a.mins - b.mins);
    if (profile) {
      next.settings.name = profile.full_name || '';
      next.settings.phone = profile.phone || s.settings.phone;
      next.settings.age = profile.age != null ? String(profile.age) : '';
      next.settings.gender = profile.gender || '';
      next.settings.defaultTune = profile.default_tune || 'chime';
      next.settings.snoozeMin = profile.snooze_min || 30;
      next.settings.meals = {
        breakfast: sqlToAmpm(profile.breakfast) || s.settings.meals.breakfast,
        lunch: sqlToAmpm(profile.lunch) || s.settings.meals.lunch,
        dinner: sqlToAmpm(profile.dinner) || s.settings.meals.dinner,
      };
    } else {
      // logout / fresh user — clear identity so one account never inherits another's details
      next.settings.name = '';
      next.settings.age = '';
      next.settings.gender = '';
    }
    if (sos && sos.length) next.settings.sos = sos;
    return next;
  }),
};

export function getState() { return state; }

// subscribe to any store change; returns an unsubscribe fn (used by cloud sync)
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

// React hook — subscribe to the store, returns [state, actions]
export function useReka() {
  const [, force] = React.useState(0);
  React.useEffect(() => {
    const l = () => force((x) => x + 1);
    listeners.add(l);
    return () => listeners.delete(l);
  }, []);
  return [state, actions];
}
