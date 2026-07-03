// screens/LoginScreen.js — name capture + Google sign-in (+ guest).
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Linking } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { Logo } from '../components/common';
import { C, F } from '../theme/colors';
import { signInWithGoogle, signInGuest } from '../../backend/auth';
import { useReka } from '../../state/store';
import { PRIVACY_URL, TERMS_URL } from '../../config/legal';

function GoogleG() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.9 6.1C12.2 13.7 17.6 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-3.9 6.7-9.7 6.7-16.4z" />
      <Path fill="#FBBC05" d="M10.4 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.7l7.9-6.1z" />
      <Path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.3-5.7c-2 1.4-4.7 2.3-8.6 2.3-6.4 0-11.8-4.2-13.6-9.9l-7.9 6.1C6.4 42.6 14.6 48 24 48z" />
    </Svg>
  );
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [s, A] = useReka();
  const [busy, setBusy] = useState('');   // '' | 'google' | 'guest'
  const [err, setErr] = useState('');
  const [nameFocus, setNameFocus] = useState(false);

  const google = async () => {
    setErr(''); setBusy('google');
    try {
      await signInWithGoogle();   // session change navigates us into the app
    } catch (e) {
      const m = String(e?.message || e);
      // never surface raw backend/SDK error strings to the user
      setErr(/native|not available|RNGoogleSignin|PlayServices/i.test(m)
        ? 'Google sign-in needs the dev build — use “Continue as guest” to test in Expo Go.'
        : (/cancel/i.test(m) ? '' : 'Couldn’t sign you in. Please try again.'));
    } finally { setBusy(''); }
  };

  const guest = async () => {
    setErr(''); setBusy('guest');
    try {
      await signInGuest();        // session change navigates us into the app
    } catch (e) {
      const m = String(e?.message || e);
      setErr(m.includes('disabled')
        ? 'Guest mode is off — enable “Allow anonymous sign-ins” in Supabase → Authentication.'
        : 'Couldn’t continue as guest. Please try again.');
    } finally { setBusy(''); }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.paper }} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 22, paddingTop: insets.top + 16, paddingBottom: 36 }} keyboardShouldPersistTaps="handled">
      <Logo size={28} />
      <View style={{ marginTop: 44 }}>
        <Text style={{ fontFamily: F.display, fontSize: 32, lineHeight: 35, letterSpacing: -0.6, color: C.ink }}>Hello there</Text>
        <Text style={{ fontSize: 16, lineHeight: 24, color: C.inkSoft, marginTop: 10, fontFamily: F.ui }}>
          Let's create your account so your medicines and reminders stay safe and synced.
        </Text>
      </View>

      <View style={{ marginTop: 28 }}>
        <Text style={{ fontSize: 13, fontFamily: F.uiBold, color: C.inkSoft, marginBottom: 8 }}>Your name</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', height: 54, borderRadius: 15, borderWidth: 1.5, borderColor: nameFocus ? C.primary : C.line, backgroundColor: C.surface, paddingHorizontal: 15, gap: 10 }}>
          <Icon name="user" size={18} color={C.inkFaint} stroke={2.2} />
          <TextInput
            value={s.settings.name}
            onChangeText={(t) => A.setName(t)}
            placeholder="e.g. Maya Ferreira"
            placeholderTextColor={C.inkFaint}
            onFocus={() => setNameFocus(true)}
            onBlur={() => setNameFocus(false)}
            style={{ flex: 1, fontSize: 16, fontFamily: F.ui, color: C.ink, padding: 0 }}
          />
        </View>
      </View>

      <View style={{ flex: 1, minHeight: 40 }} />

      {/* Google */}
      <Pressable
        onPress={() => !busy && google()}
        style={{ height: 56, borderRadius: 999, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11, opacity: busy ? 0.6 : 1 }}>
        <GoogleG />
        <Text style={{ fontSize: 16.5, fontFamily: F.uiBold, color: C.ink }}>
          {busy === 'google' ? 'Signing in…' : 'Continue with Google'}
        </Text>
      </Pressable>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 }}>
        <View style={{ height: 1, flex: 1, backgroundColor: C.line }} />
        <Text style={{ fontSize: 13, color: C.inkFaint, fontFamily: F.uiMed }}>or</Text>
        <View style={{ height: 1, flex: 1, backgroundColor: C.line }} />
      </View>

      {/* Guest */}
      <Pressable
        onPress={() => !busy && guest()}
        style={{ height: 54, borderRadius: 999, backgroundColor: C.primaryTint, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: busy ? 0.6 : 1 }}>
        <Icon name="user" size={19} color={C.primaryPress} stroke={2.2} />
        <Text style={{ fontSize: 16, fontFamily: F.uiBold, color: C.primaryPress }}>
          {busy === 'guest' ? 'Continuing…' : 'Continue as guest'}
        </Text>
      </Pressable>

      {err ? <Text style={{ fontSize: 13, color: C.berry, marginTop: 16, textAlign: 'center', fontFamily: F.uiMed }}>{err}</Text> : null}

      <Text style={{ fontSize: 11.5, color: C.inkFaint, textAlign: 'center', marginTop: 18, lineHeight: 17, fontFamily: F.ui }}>
        By continuing you agree to Medication AI's{' '}
        <Text style={{ color: C.inkSoft, fontFamily: F.uiBold }} onPress={() => Linking.openURL(TERMS_URL)}>Terms</Text>
        {' '}&{' '}
        <Text style={{ color: C.inkSoft, fontFamily: F.uiBold }} onPress={() => Linking.openURL(PRIVACY_URL)}>Privacy Policy</Text>.
      </Text>
    </ScrollView>
  );
}
