// services/auth.js — Google sign-in (+ guest) for Medication AI, on top of Supabase.
//
// UI uses these directly:
//   signInWithGoogle()  -> native Google sheet, then a Supabase session
//   signInGuest()       -> instant anonymous session (testing / no-Google fallback)
//   signOut()
//   const session = useSession()  -> undefined=loading, null=logged-out, object=logged-in
//
// A profile row is auto-created on first sign-in by a DB trigger.
//
// ⚠️ Native Google sign-in needs an EAS **dev build** — it does NOT run in Expo Go.
//    The module is loaded LAZILY so the rest of the app (scan, guest, persistence) still
//    works in Expo Go; only the Google button needs the dev build.

import { useEffect, useState } from 'react';
import { supabase } from './supabase';

// ── Google OAuth Web client ID (from Google Cloud → Credentials → OAuth, "Web application").
//    REQUIRED — paste yours here. See supabase/SETUP_GOOGLE.md.
export const GOOGLE_WEB_CLIENT_ID = '151508520584-djbdol8l704m92p8aqj602hstvoc8dea.apps.googleusercontent.com';

// lazy-load the native module so importing this file never crashes Expo Go
function loadGoogle() {
  try { return require('@react-native-google-signin/google-signin').GoogleSignin; }
  catch (_e) { return null; }
}

let _configured = false;
export async function signInWithGoogle() {
  const GoogleSignin = loadGoogle();
  if (!GoogleSignin) throw new Error('Google sign-in needs the dev build — not available in Expo Go.');
  if (!_configured) { GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID }); _configured = true; }
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const res = await GoogleSignin.signIn();
  const idToken = res?.data?.idToken ?? res?.idToken; // v13+ returns {type,data}; older is flat
  if (!idToken) throw new Error('Google did not return an ID token');
  const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
  if (error) throw error;
  return data.session;
}

// instant anonymous session — test the whole app with no Google setup.
// (Enable "Allow anonymous sign-ins" in Supabase → Authentication → Sign In / Providers.)
export async function signInGuest() {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  const GoogleSignin = loadGoogle();
  if (GoogleSignin) { try { await GoogleSignin.signOut(); } catch (_e) { /* not signed into Google */ } }
  await supabase.auth.signOut();
}

export async function getUserId() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

// React hook: undefined = loading · null = logged out · session object = logged in
export function useSession() {
  const [session, setSession] = useState(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);
  return session;
}
