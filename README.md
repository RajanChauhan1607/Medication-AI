# Medication AI — React Native + Expo (JavaScript)

A React Native / Expo port of the **Medication AI** prescription-detection prototype:
scan a handwritten prescription into a structured plan, meal-time–based
reminders, dose tracking, and an emergency SOS that cascades through three
contacts — in the medical-teal palette with Outfit / Figtree / Caveat type.

> Language: **JavaScript** · Framework: **React Native + Expo (SDK 51)** ·
> Navigation: **React Navigation** · Vector UI: **react-native-svg**

## Screens included

- **Onboarding** — Login (name / phone / "Continue with Google") → Profile
  (age + gender) → Meal times (reminders auto-set 30 min after each meal) → Welcome
- **Today (Home)** — greeting, progress ring, up-next dose, dotted timeline, SOS
- **Meds** — 2-column grid → **Med detail** (hero, course ring, details, source)
- **Schedule** — week strip + doses grouped Morning / Afternoon / Evening
- **History** — 14-day adherence bars + past scans
- **Scan → Processing → Results** — camera mock, animated read steps, detection
  cards with confidence + "Plan added!" celebration
- **Manual entry**, **Alarm sound** picker, **Edit reminders**, **Settings**
- **SOS call** (auto-cascade through contacts) + **SOS contacts** manager

## File map

```
expo/
├── App.js                         NavigationContainer → onboarding stack + tabs
├── index.js  app.json  babel.config.js  package.json
└── src/
    ├── theme/colors.js            design tokens (1:1 with the prototype's CSS vars)
    ├── data/mockData.js           RX_SOURCE, DETECTED, TODAY, MEDS, HISTORY, …
    ├── state/
    │   ├── store.js               pub/sub store + actions + time helpers (useReka)
    │   └── tunes.js               alarm-tune metadata + playback stub
    ├── components/
    │   ├── Icon.js                line-icon set (react-native-svg)
    │   ├── ui.js                  Ring, Chip, Button, Card, MedBadge, Toast, …
    │   ├── common.js              Logo, DeepHeader, Avatar, TopBar, PageHeader
    │   └── RxPad.js               handwritten prescription pad
    ├── navigation/MainTabs.js     bottom tabs + frosted-glass floating dock + FAB
    └── screens/                   one file per screen (+ onboardingBits, formBits)
```

## Run it

You need Node 18+ and the Expo tooling. From this folder:

```bash
cd expo
npm install        # or: yarn
npx expo start     # press i (iOS sim), a (Android), or scan the QR in Expo Go
```

(There are no platform `ios/` or `android/` folders — Expo manages them. Run
`npx expo prebuild` only if you need native config.)

## Notes & honest caveats

- **Not run/compiled here.** This was authored in an HTML-oriented workspace, so
  it hasn't been through `expo start` / a Metro build. It's written to idiomatic
  RN standards; expect to fix the occasional small thing on first install (a
  version nudge from `expo install`, etc).
- **Data is mock & in-memory.** State lives in `src/state/store.js` and resets on
  reload. Wire persistence (AsyncStorage / SQLite) and a real backend for production.
- **Scan/OCR is simulated.** The camera screen is a styled mock and "detection"
  returns fixed sample data. For real capture, add `expo-camera`; for real OCR,
  send the photo to an OCR/vision service and map the result into `DETECTED`.
- **Alarm sounds are stubbed.** `tunes.js` keeps the tune metadata; bundle short
  audio files and play them with `expo-av` (see the commented snippet there).
  For real reminders, schedule them with `expo-notifications`.
- **Time pickers** use simple ± steppers to stay dependency-light. Swap in
  `@react-native-community/datetimepicker` for a native wheel.
- **Fonts** load at runtime via `@expo-google-fonts` (Outfit + Figtree + Caveat).
- The original web prototype is unchanged — see
  `Medication AI - Prescription Detection.html` at the project root.
```
