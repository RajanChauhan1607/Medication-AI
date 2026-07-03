# Google Sign-In setup (Medication AI)

The code is done. These are the one-time console steps to make it work. Native Google
sign-in needs an **EAS dev build** — it won't run in Expo Go (use "Continue as guest" there).

## 1. Google Cloud Console — create OAuth clients
https://console.cloud.google.com → create/select a project.

1. **OAuth consent screen** → User type **External** → app name **Medication AI**, your support email,
   developer email → Save. While it's in "Testing", add your own Google account under **Test users**.
2. **Credentials → Create credentials → OAuth client ID**, make **two**:
   - **Web application** → name "Medication AI Web" → **copy the Client ID** → this is `GOOGLE_WEB_CLIENT_ID`.
   - **Android** → name "Medication AI Android" → **Package name:** `com.adityavalaki.medira` →
     **SHA-1 fingerprint:** (get it in step 2 below).

## 2. Get the Android SHA-1 (from EAS, which holds the keystore)
```powershell
cd "G:\prescription-project\PrescriptionDetection-1\expo"
npx eas-cli credentials
```
→ choose **Android** → your build profile (development/preview) → **Keystore** → copy the
**SHA-1 Fingerprint**. Paste it into the Android OAuth client from step 1.

## 3. Supabase — enable Google
Dashboard → **Authentication → Sign In / Providers → Google** → **Enable**.
- In **"Client IDs"** (the native / "Authorized Client IDs" field) paste **both** IDs,
  comma-separated: the **Web client ID** and the **Android client ID**.
- Save.

## 4. Put the Web client ID in the app
Edit `src/backend/auth.js`:
```js
export const GOOGLE_WEB_CLIENT_ID = '...your web client id...apps.googleusercontent.com';
```

## 5. Build & test
```powershell
npx eas-cli build --profile development --platform android
```
Install the resulting APK → **Continue with Google** works. (Guest works everywhere, incl. Expo Go.)

## Notes
- The final package is `com.adityavalaki.medira`. For the **production** build, add a new
  Android OAuth client with that package + the **production** keystore SHA-1 (or reuse the dev
  client if it shares the same EAS keystore/SHA-1).
- While the consent screen is "Testing", only listed test users can sign in — publish it when ready.
