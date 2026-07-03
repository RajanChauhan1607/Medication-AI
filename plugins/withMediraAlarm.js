// plugins/withMediraAlarm.js — native alarm behaviour for Medication AI.
//
// Two things this plugin does, both required for a medicine alarm that behaves like a
// real alarm clock for elderly users:
//
// 1) Full-screen over the lock screen: MainActivity gets showWhenLocked / turnScreenOn
//    so the alarm wakes the screen and shows over the lock screen when it fires.
//
// 2) RINGS EVEN ON SILENT / VIBRATE: notification-channel sounds are muted by the
//    ringer's silent/vibrate mode. To ring at full volume regardless, the sound must play
//    on the ANDROID ALARM STREAM (AudioAttributes USAGE_ALARM) — the same stream clock
//    alarms use. Notifee (9.x) can't set channel audio attributes from JS, so we PRE-CREATE
//    the medicine-alarm channels natively in MainApplication.onCreate() with USAGE_ALARM.
//    Android locks a channel's sound at creation, so Notifee's later createChannel() calls
//    (same ids) can't downgrade them back to the notification stream.
//
// ⚠️ ALARM_CHANNEL_VER + TUNES must stay in sync with src/backend/alarm.js (CHANNEL_VER)
//    and src/state/tunes.js. Bump the version on both sides to force fresh channels.

const { withAndroidManifest, withMainApplication } = require('@expo/config-plugins');

const ALARM_CHANNEL_VER = 'v4';
const TUNES = ['classic', 'siren', 'urgent', 'chirp', 'doorbell', 'arcade', 'chime', 'marimba', 'bells', 'sunrise', 'pulse'];
const MARKER = 'Medira alarm channels';

// Kotlin injected into MainApplication.onCreate — creates each med-alarm channel on the
// ALARM stream. Fully-qualified names so no imports need to be added. Idempotent + wrapped
// in try/catch so it can never crash app startup.
function alarmChannelKotlin() {
  const tunesList = TUNES.map((t) => `"${t}"`).join(', ');
  return `
    // >>> ${MARKER} (ring on silent/mute via USAGE_ALARM) >>>
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
      try {
        val medNm = getSystemService(android.app.NotificationManager::class.java)
        val medAttrs = android.media.AudioAttributes.Builder()
          .setUsage(android.media.AudioAttributes.USAGE_ALARM)
          .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
          .build()
        val medTunes = listOf(${tunesList})
        for (medT in medTunes) {
          val medSoundId = resources.getIdentifier(medT, "raw", packageName)
          if (medSoundId == 0) continue
          val medUri = android.net.Uri.parse("android.resource://" + packageName + "/" + medSoundId)
          val medCh = android.app.NotificationChannel(
            "med-alarm-${ALARM_CHANNEL_VER}-" + medT,
            "Medicine alarm · " + medT,
            android.app.NotificationManager.IMPORTANCE_HIGH
          )
          medCh.setSound(medUri, medAttrs)
          medCh.enableVibration(true)
          medCh.setBypassDnd(true)
          medCh.lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
          medNm.createNotificationChannel(medCh)
        }
      } catch (medE: Exception) { /* never block startup */ }
    }
    // <<< ${MARKER} <<<
`;
}

// 1) lock-screen / wake behaviour on MainActivity
function withLockScreenActivity(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application && cfg.modResults.manifest.application[0];
    if (app && Array.isArray(app.activity)) {
      const main = app.activity.find((a) => a.$ && /\.MainActivity$/.test(a.$['android:name'] || ''));
      if (main && main.$) {
        main.$['android:showWhenLocked'] = 'true';
        main.$['android:turnScreenOn'] = 'true';
      }
    }
    return cfg;
  });
}

// 2) alarm-stream channels created at app startup
function withAlarmChannels(config) {
  return withMainApplication(config, (cfg) => {
    let src = cfg.modResults.contents;
    if (src.includes(MARKER)) return cfg; // idempotent — already injected

    // insert right after React Native is loaded in onCreate()
    const anchor = 'loadReactNative(this)';
    if (src.includes(anchor)) {
      src = src.replace(anchor, `${anchor}\n${alarmChannelKotlin()}`);
    } else if (/super\.onCreate\(\)/.test(src)) {
      // fallback: after super.onCreate()
      src = src.replace(/super\.onCreate\(\)/, `super.onCreate()\n${alarmChannelKotlin()}`);
    }
    cfg.modResults.contents = src;
    return cfg;
  });
}

module.exports = function withMedicationAlarm(config) {
  return withAlarmChannels(withLockScreenActivity(config));
};
