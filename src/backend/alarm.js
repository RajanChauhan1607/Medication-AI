// services/alarm.js — loud, looping medicine ALARMS via Notifee.
//
// Unlike a plain notification, these:
//   • play on a HIGH-importance alarm channel that BYPASSES Do Not Disturb,
//   • LOOP the sound + vibration until the user acts (loopSound + ongoing),
//   • use a full-screen action so they wake the screen on the lock screen,
//   • STOP the moment the user taps “✓ Taken” or “Snooze” (we cancel the notification),
//   • survive a background/cold tap via a small pending-action queue applied on foreground.
//
// ⚠️ Native (Notifee) — runs only in the EAS dev/preview/production build, not Expo Go.

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, {
  AndroidImportance, AndroidVisibility, AndroidCategory, AndroidStyle,
  TriggerType, RepeatFrequency, EventType,
} from '@notifee/react-native';
import { tuneById } from '../state/tunes';
import { parseTime } from './notifications';

const PENDING_KEY = 'medira.pendingActions';
const BATTERY_PROMPTED_KEY = 'medira.batteryPrompted';

function reminderBody(med) {
  const parts = [med.strength, med.instruction].filter(Boolean).join(' · ');
  return parts ? `${parts} — tap “✓ Taken” when done` : 'Tap “✓ Taken” once you’ve taken your medicine';
}

// group every active medicine's dose times so meds sharing a time ring in ONE alarm.
// returns Map<timeString, med[]>
function groupByTime(meds = []) {
  const map = new Map();
  for (const med of meds) {
    if (med.remindersOn === false) continue;
    for (const tm of med.times || []) {
      if (!map.has(tm)) map.set(tm, []);
      map.get(tm).push(med);
    }
  }
  return map;
}

// one bullet line per medicine due at this time (shown via BIGTEXT when the alarm expands)
function groupBody(group) {
  return group
    .map((m) => {
      const extra = [m.strength, m.instruction].filter(Boolean).join(' · ');
      return extra ? `• ${m.name} — ${extra}` : `• ${m.name}`;
    })
    .join('\n');
}

// expo-style pattern [wait, on, off, …] → Notifee pattern [on, off, …] (even length, ≥2)
function notifeePattern(arr) {
  const p = (arr || []).slice(1);
  if (!p.length) return [400, 200];
  if (p.length % 2 !== 0) p.push(300);
  return p;
}

// bump the suffix whenever channel settings (sound/vibration) change — Android LOCKS a
// channel's settings after first creation, so a new id is the only way to apply them.
// NOTE: keep this in sync with plugins/withMediraAlarm.js (ALARM_CHANNEL_VER) — the native
// plugin pre-creates these channel ids on the ALARM audio stream so they ring on silent/mute.
const CHANNEL_VER = 'v4';
async function ensureChannel(tune) {
  const t = tuneById(tune);
  const id = `med-alarm-${CHANNEL_VER}-${t.id}`;
  await notifee.createChannel({
    id,
    name: `Medicine alarm · ${t.name}`,
    importance: AndroidImportance.HIGH,
    sound: t.sound || 'default',   // bundled alarm tone in res/raw (assets/sounds/<id>.wav)
    vibration: true,
    vibrationPattern: notifeePattern(t.vibration),
    bypassDnd: true,
    visibility: AndroidVisibility.PUBLIC,
  });
  return id;
}

function alarmAndroid(channelId, bigText) {
  return {
    channelId,
    category: AndroidCategory.ALARM,
    importance: AndroidImportance.HIGH,
    loopSound: true,         // keep ringing until dismissed
    autoCancel: false,
    ongoing: true,
    // expandable body listing every medicine in this alarm (when more than one)
    ...(bigText ? { style: { type: AndroidStyle.BIGTEXT, text: bigText } } : {}),
    fullScreenAction: { id: 'default' }, // wake the screen / show over lock screen
    pressAction: { id: 'default', launchActivity: 'default' },
    actions: [
      { title: '✓ Taken', pressAction: { id: 'taken', launchActivity: 'default' } },
      { title: 'Snooze', pressAction: { id: 'snooze', launchActivity: 'default' } },
    ],
  };
}

// next clock occurrence of "8:00 AM" as a Date (today if still ahead, else tomorrow)
function nextOccurrence(tm) {
  const m = parseTime(tm);
  if (!m) return null;
  const now = Date.now();
  const d = new Date();
  d.setHours(m.hour, m.minute, 0, 0);
  if (d.getTime() <= now + 1000) d.setDate(d.getDate() + 1);
  return d;
}

export async function requestAlarmPermission() {
  try { await notifee.requestPermission(); } catch (_e) { /* */ }
}

// (re)schedule ONE daily alarm per dose time, listing every medicine due then.
// Meds sharing a time are merged into a single looping alarm instead of separate ones.
export async function scheduleAllAlarms(meds = [], snoozeMin = 30, defaultTune = 'chime') {
  await notifee.cancelTriggerNotifications();
  let count = 0;
  for (const [tm, group] of groupByTime(meds)) {
    const when = nextOccurrence(tm);
    if (!when) continue;
    const tune = group[0].tune || defaultTune;   // one tone per alarm (first med's tune)
    const channelId = await ensureChannel(tune);
    const names = group.map((m) => m.name).filter(Boolean);
    const body = groupBody(group);
    await notifee.createTriggerNotification(
      {
        id: `med-time-${String(tm).replace(/\W/g, '')}`,
        title: names.length === 1 ? `💊 Time to take ${names[0]}` : `💊 Time for your ${names.length} medicines`,
        body,
        android: alarmAndroid(channelId, names.length > 1 ? body : undefined),
        data: {
          medIds: group.map((m) => m.id).join(','),
          medNames: names.join(', '),
          tune, snoozeMin: String(snoozeMin), time: String(tm),
        },
      },
      { type: TriggerType.TIMESTAMP, timestamp: when.getTime(), repeatFrequency: RepeatFrequency.DAILY, alarmManager: { allowWhileIdle: true } },
    );
    count += 1;
  }
  return count;
}

// one-off alarm after the user's snooze interval (re-rings the same grouped reminder)
export async function scheduleSnoozeAlarm(data) {
  const mins = Number(data?.snoozeMin) || 30;
  const channelId = await ensureChannel(data?.tune);
  const names = data?.medNames || data?.medName || 'your medicines';
  await notifee.createTriggerNotification(
    {
      title: `💊 Snoozed — time for ${names}`,
      body: `Tap “✓ Taken” when you’ve taken: ${names}`,
      android: alarmAndroid(channelId),
      data: { ...data },
    },
    { type: TriggerType.TIMESTAMP, timestamp: Date.now() + Math.max(60, mins * 60) * 1000, alarmManager: { allowWhileIdle: true } },
  );
}

export async function cancelAllAlarms() {
  try { await notifee.cancelTriggerNotifications(); } catch (_e) { /* */ }
  try { await notifee.cancelDisplayedNotifications(); } catch (_e) { /* */ }
}

// fire a sample alarm now (preview). Auto-stops after a few seconds so it isn't annoying.
export async function previewAlarm(tune) {
  const channelId = await ensureChannel(tune);
  const id = 'med-alarm-preview';
  await notifee.displayNotification({
    id,
    title: '🔔 Alarm preview',
    body: 'This is how your medicine alarm will sound and feel.',
    android: { ...alarmAndroid(channelId), timeoutAfter: 4000, actions: undefined, fullScreenAction: undefined },
  });
  setTimeout(() => { notifee.cancelNotification(id).catch(() => {}); }, 4000);
}

// Stop the ringing + reschedule on snooze. Store updates go through a queue so they survive
// a background/cold tap; the app drains the queue when it’s next in the foreground.
async function processEvent(type, detail) {
  if (type !== EventType.ACTION_PRESS && type !== EventType.PRESS) return;
  const { notification, pressAction } = detail || {};
  const actionId = (pressAction && pressAction.id) || 'default';
  if (notification?.id) { try { await notifee.cancelNotification(notification.id); } catch (_e) { /* */ } } // STOP sound
  const data = notification?.data || {};
  if (actionId === 'snooze') { try { await scheduleSnoozeAlarm(data); } catch (_e) { /* */ } }
  if (actionId === 'taken' || actionId === 'snooze') {
    try {
      const raw = await AsyncStorage.getItem(PENDING_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      arr.push({ action: actionId, data });
      await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(arr));
    } catch (_e) { /* */ }
  }
}

// apply any queued Taken/Snooze actions into the store (call on app foreground)
export async function drainPendingActions(onAction) {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    if (!raw) return;
    await AsyncStorage.removeItem(PENDING_KEY);
    const arr = JSON.parse(raw) || [];
    for (const item of arr) if (onAction) onAction(item.action, item.data);
  } catch (_e) { /* */ }
}

// register ONCE at app-entry module scope (handles taps while app is backgrounded/killed)
export function registerAlarmBackgroundHandler() {
  try { notifee.onBackgroundEvent(async ({ type, detail }) => { await processEvent(type, detail); }); }
  catch (_e) { /* native missing (Expo Go) — ignore */ }
}

// foreground handler — stops sound, reschedules snooze, then drains into the store
export function registerAlarmForegroundHandler(onAction) {
  try {
    return notifee.onForegroundEvent(async ({ type, detail }) => {
      await processEvent(type, detail);
      await drainPendingActions(onAction);
    });
  } catch (_e) { return () => {}; }
}

// ── battery optimisation (so alarms aren't delayed/killed on aggressive Android OEMs) ──
// Returns { show, optimized, powerManager } — whether to show the one-time prompt.
export async function getBatteryGuidance() {
  if (Platform.OS !== 'android') return { show: false };
  try {
    const prompted = await AsyncStorage.getItem(BATTERY_PROMPTED_KEY);
    if (prompted) return { show: false };
    const optimized = await notifee.isBatteryOptimizationEnabled();
    let powerManager = null;
    try { powerManager = await notifee.getPowerManagerInfo(); } catch (_e) { /* */ }
    const hasOem = !!(powerManager && powerManager.activity);
    return { show: !!optimized || hasOem, optimized: !!optimized, powerManager };
  } catch (_e) { return { show: false }; }
}
export async function markBatteryPrompted() {
  try { await AsyncStorage.setItem(BATTERY_PROMPTED_KEY, '1'); } catch (_e) { /* */ }
}
export async function openBatteryOptimizationSettings() {
  try { await notifee.openBatteryOptimizationSettings(); } catch (_e) { /* */ }
}
export async function openPowerManagerSettings() {
  try { await notifee.openPowerManagerSettings(); } catch (_e) { /* */ }
}
