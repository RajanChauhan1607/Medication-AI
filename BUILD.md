# Building Medication AI into a real installable app (EAS)

No Android Studio needed — EAS builds in the cloud and gives you an APK to install.

## One-time: make a free Expo account
Go to https://expo.dev → sign up (free). That's the only account needed for builds.

## Build a testable APK
From this folder (`PrescriptionDetection-1/expo`):

```powershell
npx eas-cli login                                          # enter your Expo email + password
npx eas-cli build --platform android --profile preview     # ~10–20 min in the cloud
```

First run will ask:
- "Create an EAS project?" → **Yes**
- "Generate a new Android Keystore?" → **Yes** (EAS stores it for you — no manual keystore)

When it finishes you get a URL with an **APK**. Open it on your phone, download, install
(allow "install from unknown sources"), and launch. This standalone build is where
**reminders and the camera actually work** (they can't in Expo Go).

## Build profiles (in eas.json)
- **preview** → standalone APK, install-and-run. Best for testing + sharing with testers.
- **development** → dev client APK (`npx expo start --dev-client` for live reload).
- **production** → `.aab` App Bundle for the Play Store (used later in Phase F).

## Notes
- Package name is currently `com.example.medira` — fine for testing. We lock the final
  package (with the chosen brand) before the production/Play-Store build.
- No custom app icon yet — uses a default; the real icon comes with the professional branding.
