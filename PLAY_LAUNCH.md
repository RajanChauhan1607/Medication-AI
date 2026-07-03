# Medication AI — Google Play launch pack

Everything you need to fill the Play Console forms. Copy-paste from here.

App identity (now set in app.json):
- **Package name:** `com.adityavalaki.medira`  ← permanent once published
- **App name:** Medication AI
- **Category:** Medical (or Health & Fitness)
- **Privacy Policy URL:** *(your hosted privacy.html — put it here once hosted)*

---

## 1) Data Safety form — answers

**Does your app collect or share user data?** → **Yes.**
For every type below: **Collected = Yes**, **Shared = No**, **Processing = on your servers (not ephemeral)**, **Encrypted in transit = Yes**, **Users can request deletion = Yes**, **Purpose = App functionality** (and "Account management" for name/email).

| Data type (Play category) | Collected | Why |
|---|---|---|
| **Name** (Personal info) | Yes | From Google Sign-In (account) |
| **Email address** (Personal info) | Yes | From Google Sign-In (account) |
| **Phone number** (Personal info) | Yes | Emergency (SOS) contacts you enter |
| **Health info** (Health & fitness) | Yes | Medicines, dosages, schedules, adherence |
| **Photos** (Photos and videos) | Yes | Prescription images you scan/upload |
| **Other user-generated content** | Yes | Profile (age, gender, meal times) |
| **App interactions / diagnostics** | Yes | Scan-usage logs for rate limiting |

Key declarations to tick:
- **Is all data encrypted in transit?** → **Yes.**
- **Do you provide a way to request data deletion?** → **Yes** (in-app delete + email help@medira.app).
- **Is any data collected required vs optional?** → Account data is collected when you sign in with Google; guest mode collects no name/email.
- **Do you share data with third parties?** → **No** (Supabase and Google are *service providers/processors*, not data sharing for Play's purposes). Disclose them in your Privacy Policy (already done).
- **Advertising / tracking?** → **No.**

---

## 2) Sensitive permissions — what to say

**`SCHEDULE_EXACT_ALARM` / `USE_EXACT_ALARM`** (Play asks about "Alarms & reminders"):
> Medication AI is a medication-reminder app. Its core function is to alert users to take their
> medicine at exact, user-set times. Exact alarms are required so reminders fire on time
> even in Doze/standby; inexact alarms would cause missed or late doses.

**`CALL_PHONE`** — ✅ **removed.** SOS now opens the phone dialer with the number pre-filled
(via `Linking`), so no calling permission is requested. Nothing to declare.

**`POST_NOTIFICATIONS`, `VIBRATE`, `WAKE_LOCK`, `RECEIVE_BOOT_COMPLETED`** — standard for a
reminder app (show reminders, vibrate, wake the screen for an alarm, re-arm alarms after reboot). No declaration needed.

---

## 3) App access (for review)

Medication AI requires sign-in. Tell reviewers how to get in without Google:
> On the login screen, tap **"Continue as guest"** to access the full app without an account.

(Make sure **"Allow anonymous sign-ins"** is enabled in Supabase so guest works.)

---

## 4) Store listing text

**App name:** `Medication AI`

**Short description (≤80 chars):**
`Scan prescriptions, get reliable medicine reminders, never miss a dose.`

**Full description:**
```
Medication AI turns a photo of your prescription into a clear medicine plan — and reminds you to take every dose on time.

SCAN INSTEAD OF TYPING
Point your camera at a handwritten or printed prescription. Medication AI reads the medicine names, strengths, dose timing (morning–afternoon–night), and course length, then lets you review and fix anything before saving.

RELIABLE REMINDERS
Get loud, on-time alarms for each medicine — they keep ringing until you tap “Taken,” and can wake your screen so you don’t miss a dose. Choose your snooze length and a vibration pattern per medicine.

BUILT AROUND YOUR DAY
Reminders are set around your meal times (e.g. after food). Scan later in the day? Medication AI only schedules the doses still ahead, so your plan always makes sense.

STAY ON TOP OF REFILLS
Medication AI tracks when a course runs out and reminds you to see your doctor for a repeat prescription — and can add it to your calendar.

HELP IS ONE TAP AWAY
Save emergency contacts and reach them instantly from the SOS screen.

PRIVATE BY DESIGN
Your data is encrypted and protected so only your account can see it. Prescription images stay private. We never sell your data or use it for ads.

Medication AI is a reminder and organisation tool, not a medical device, and does not give medical advice. Always follow your doctor and pharmacist, and check every medicine and dose. Don’t rely on Medication AI alone for critical medication.
```

**Graphics you'll need to upload:**
- App icon 512×512 PNG
- Feature graphic 1024×500
- 2–8 phone screenshots (e.g. Today, Scan, Review, Reminder alarm, SOS)

---

## 5) Content rating
Answer the questionnaire honestly (no violence/sexual/gambling content). A medical reminder
app rates **Everyone / PEGI 3**. Note it references medicines but gives no medical advice.

---

## 6) Build & submit (when the above is filled)
```powershell
cd "G:\prescription-project\PrescriptionDetection-1\expo"
git add -A && git commit -m "Production package name + launch config"
npx eas-cli build --profile production --platform android
npx eas-cli submit --profile production --platform android
```
Upload to **Internal testing** first, then promote to **Production** with a **staged rollout**.
