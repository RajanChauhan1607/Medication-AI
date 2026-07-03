// services/notifications.js — local medication reminders (the core of the app).
//
// UI-INDEPENDENT. The redesigned UI consumes this with ONE line:
//
//     import { useReminders } from '../services/notifications';
//     useReminders(meds);          // mount once near the app root; reschedules on change
//
// What it does: schedules a DAILY repeating local notification for every dose time of
// every active medicine, with "Taken" / "Snooze 10m" action buttons. No server, no push —
// works offline on the device.
//
// ⚠️ Testing requires an EAS **dev build** — scheduled notifications no longer fire in
// Expo Go on modern Android. The code is correct; it just needs the real build to run.

import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { TUNES, tuneById } from '../state/tunes';

const CATEGORY_ID = 'dose';

// Bump this whenever channel settings (sound/vibration) change — Android LOCKS a channel's
// settings after first creation, so a new id is the only way to apply new sound/vibration
// without a reinstall.
const CHANNEL_VER = 'v3';

// one Android notification channel per tune, so each medicine vibrates with its pattern
export function medChannelId(tune) { return `med-rem-${CHANNEL_VER}-${tuneById(tune).id}`; }

// ── 1. one-time setup (handler + Android channel + action buttons) ──
let configured = false;
export async function configureNotifications() {
  if (configured) return;
  configured = true;

  // show reminders even when the app is in the foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    // a channel per tune — Android ties the sound + vibration pattern to the channel
    for (const t of TUNES) {
      await Notifications.setNotificationChannelAsync(medChannelId(t.id), {
        name: `Reminders · ${t.name}`,
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',            // play the device's notification sound
        enableVibrate: true,
        vibrationPattern: t.vibration,
        enableLights: true,
        lightColor: '#DC7A57',
        bypassDnd: true,             // ring through Do Not Disturb
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }
  }

  // "Taken" / "Snooze" buttons. opensAppToForeground:true so the action ALWAYS runs our
  // handler — even if the app was killed (a no-open action can't wake JS reliably on Android).
  await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
    { identifier: 'taken', buttonTitle: '✓ Taken', options: { opensAppToForeground: true } },
    { identifier: 'snooze', buttonTitle: 'Snooze', options: { opensAppToForeground: true } },
  ]);
}

// body text shared by the daily reminder and its snoozed copy
function reminderBody(med) {
  const parts = [med.strength, med.instruction].filter(Boolean).join(' · ');
  return parts ? `${parts} — tap “✓ Taken” once you’ve taken it` : 'Tap “✓ Taken” once you’ve taken your medicine';
}

// ── 2. permission ──
export async function ensurePermission() {
  if (!Device.isDevice) return false; // simulators can't show real notifications
  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  return status === 'granted';
}

// ── 3. time parsing: "8:00 AM" -> { hour, minute } (24h) ──
export function parseTime(s) {
  const m = String(s).match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return null;
  let hour = (+m[1]) % 12;
  if (/PM/i.test(m[3])) hour += 12;
  return { hour, minute: +m[2] };
}

// ── 4. (re)schedule every reminder from the current medicines ──
// meds: array from the store. Each: { id, name, strength, times: ['8:00 AM', ...],
//        instruction, remindersOn (default true) }. SOS meds (no times) are skipped.
export async function syncFromMeds(meds = [], snoozeMin = 30) {
  const ok = await ensurePermission();
  if (!ok) return { scheduled: 0, granted: false };

  await Notifications.cancelAllScheduledNotificationsAsync();

  let scheduled = 0;
  for (const med of meds) {
    if (med.remindersOn === false) continue;
    for (const t of med.times || []) {
      const hm = parseTime(t);
      if (!hm) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `💊 Time to take ${med.name}`,
          body: reminderBody(med),
          categoryIdentifier: CATEGORY_ID,
          // everything the action handler needs (the handler may run from a cold start)
          data: { medId: med.id, medName: med.name, strength: med.strength || '', instruction: med.instruction || '', tune: med.tune || 'chime', snoozeMin, time: t },
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hm.hour,
          minute: hm.minute,
          channelId: medChannelId(med.tune),
        },
      });
      scheduled += 1;
    }
  }
  return { scheduled, granted: true };
}

// re-fire a reminder after the user's snooze interval (one-off)
async function scheduleSnoozeNotification(data) {
  const mins = Number(data?.snoozeMin) || 30;
  const med = { name: data?.medName || 'your medicine', strength: data?.strength, instruction: data?.instruction };
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `💊 Snoozed — time to take ${med.name}`,
      body: reminderBody(med),
      categoryIdentifier: CATEGORY_ID,
      data: { ...data },
      sound: 'default',
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(60, mins * 60), channelId: medChannelId(data?.tune) },
  });
}

export async function cancelAll() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// fire a one-off reminder right now so the user can hear the sound + feel the vibration
// for a given tune exactly as a real reminder would (used by the preview screen).
export async function previewTune(tune) {
  await configureNotifications();
  const ok = await ensurePermission();
  if (!ok) return false;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔔 Reminder preview',
      body: 'This is how your medicine reminder will sound and feel.',
      sound: 'default',
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1, channelId: medChannelId(tune) },
  });
  return true;
}

export async function listScheduled() {
  return Notifications.getAllScheduledNotificationsAsync();
}

// ── 5. the one-liner the UI mounts ──────────────────────────────────
// Configures once, then reschedules whenever the medicines (or snooze length) change.
// `onAction(actionId, data)` is called when the user taps Taken / Snooze — wire it to the
// store (markTaken / snooze). Handles taps from foreground, background AND a cold start.
export function useReminders(meds, onAction, snoozeMin = 30) {
  const lastKey = useRef('');
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;            // always call the latest handler
  const handledRef = useRef(new Set());

  useEffect(() => {
    configureNotifications();

    const handle = async (resp) => {
      if (!resp) return;
      const reqId = resp.notification.request.identifier;
      const action = resp.actionIdentifier;  // 'taken' | 'snooze' | default tap
      const dedupe = `${reqId}:${action}`;
      if (handledRef.current.has(dedupe)) return; // listener + cold-start can both deliver it
      handledRef.current.add(dedupe);

      const data = resp.notification.request.content.data || {};
      try { await Notifications.dismissNotificationAsync(reqId); } catch (_e) { /* already gone */ }
      if (action === 'snooze') { try { await scheduleSnoozeNotification(data); } catch (_e) { /* */ } }
      if (onActionRef.current) onActionRef.current(action, data);
    };

    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    // a tap that COLD-STARTED the app is delivered here, not to the listener
    Notifications.getLastNotificationResponseAsync().then(handle).catch(() => {});
    return () => sub.remove();
  }, []);

  useEffect(() => {
    // reschedule when schedule-relevant fields OR the snooze length change
    const key = JSON.stringify({
      meds: (meds || []).map((m) => [m.id, m.remindersOn !== false, (m.times || []).join('|'), m.tune, m.strength, m.instruction]),
      snoozeMin,
    });
    if (key === lastKey.current) return;
    lastKey.current = key;
    syncFromMeds(meds || [], snoozeMin);
  }, [meds, snoozeMin]);
}
