// services/doctorVisit.js — "your medicine is running out, see your doctor" helpers.
//
// Computes when a course runs out (from its duration + start date), schedules a local
// reminder a couple of days before, and optionally drops the visit on the phone calendar.
//
// ⚠️ expo-calendar is a native module — it needs the EAS dev build, so it's lazy-required
//    (the rest of the app still loads in Expo Go; only "Add to calendar" needs the build).

import * as Notifications from 'expo-notifications';
import { ensurePermission } from './notifications';

const DAY = 86400000;

// "5 days" / "2 weeks" / "1.4 weeks" / "1 month" -> number of days (null if ongoing/unknown)
export function durationDays(text) {
  const s = String(text || '').toLowerCase().trim();
  if (!s || /ongoing/.test(s)) return null;
  const m = /([\d.]+)\s*(day|week|month|year)/.exec(s);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const u = m[2];
  if (u.startsWith('day')) return n;
  if (u.startsWith('week')) return n * 7;
  if (u.startsWith('month')) return n * 30;
  return n * 365;
}

export function runOutDate(med) {
  const days = durationDays(med?.duration);
  if (days == null) return null;
  const start = med?.startedAt || Date.now();
  return new Date(start + days * DAY);
}

export function daysLeft(med) {
  const ro = runOutDate(med);
  return ro ? Math.ceil((ro.getTime() - Date.now()) / DAY) : null;
}

// pick when to nudge: 2 days before run-out at 10:00, but never in the past
function reminderFireDate(runOut) {
  const when = new Date(runOut.getTime() - 2 * DAY);
  when.setHours(10, 0, 0, 0);
  const now = new Date();
  if (when > now) return when;
  const tomorrow = new Date(now.getTime() + DAY);
  tomorrow.setHours(10, 0, 0, 0);
  return tomorrow;
}

// schedule a one-time local notification to book a doctor visit before the meds run out
export async function scheduleVisitReminder(med, runOut) {
  const ok = await ensurePermission();
  const fireDate = reminderFireDate(runOut);
  if (!ok) return { fireDate, granted: false };
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to see your doctor',
      body: `Your ${med.name} runs out around ${runOut.toLocaleDateString()}. Book a visit for a repeat prescription.`,
      sound: 'default',
      data: { kind: 'doctor-visit', medId: med.id },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireDate },
  });
  return { fireDate, granted: true };
}

function loadCalendar() {
  try { return require('expo-calendar'); }
  catch (_e) { return null; }
}

// add the doctor visit to the phone's calendar (needs the dev build + permission)
export async function addVisitToCalendar(med, runOut) {
  const Calendar = loadCalendar();
  if (!Calendar) throw new Error('Calendar needs the dev build — not available in Expo Go.');
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') throw new Error('Calendar permission denied');
  const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable = cals.find((c) => c.allowsModifications) || cals[0];
  if (!writable) throw new Error('No writable calendar found');
  const start = new Date(runOut); start.setHours(10, 0, 0, 0);
  const end = new Date(start.getTime() + 30 * 60000);
  await Calendar.createEventAsync(writable.id, {
    title: `Doctor visit — ${med.name} refill`,
    notes: `Your ${med.name} course ends around now. See your doctor for a repeat prescription.`,
    startDate: start, endDate: end,
    alarms: [{ relativeOffset: -2 * 24 * 60 }], // alert 2 days before
  });
  return start;
}
