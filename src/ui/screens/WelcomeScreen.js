// screens/WelcomeScreen.js — feature intro after onboarding (deep-teal bg).
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { Logo } from '../components/common';
import { Button } from '../components/ui';
import { C, F } from '../theme/colors';
import { getState } from '../../state/store';

const FEATS = [
  { icon: 'camera', t: 'Snap the prescription', s: 'Even messy handwriting' },
  { icon: 'sparkle', t: 'We turn it into a plan', s: 'Clear doses & timings' },
  { icon: 'bell', t: 'Alarms around your meals', s: '30 min after you eat' },
  { icon: 'phone', t: 'SOS when you need help', s: 'One tap calls your people' },
];

export default function WelcomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const name = (getState().settings.name || 'there').split(' ')[0];
  const toMain = () => navigation.reset({ index: 0, routes: [{ name: 'Main' }] });

  return (
    <LinearGradient colors={[C.deep, C.deep2]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 22, paddingTop: insets.top + 12, paddingBottom: 36 }}>
        <Logo mono size={28} />
        <Text style={{ fontFamily: F.display, fontSize: 33, lineHeight: 37, letterSpacing: -0.6, color: '#fff', marginTop: 30 }}>
          Your medicines,{'\n'}perfectly <Text style={{ color: C.mint }}>on time</Text>.
        </Text>
        <Text style={{ fontSize: 15.5, lineHeight: 24, color: 'rgba(255,255,255,0.75)', marginTop: 12, maxWidth: 320, fontFamily: F.ui }}>
          You're all set, {name}. Here's what Medication AI does for you.
        </Text>

        <View style={{ gap: 11, marginTop: 26 }}>
          {FEATS.map((f) => (
            <View key={f.t} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 18, padding: 14 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={f.icon} size={22} color={C.deep} stroke={2.3} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15.5, fontFamily: F.uiBold, color: '#fff' }}>{f.t}</Text>
                <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 1, fontFamily: F.ui }}>{f.s}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ flex: 1, minHeight: 26 }} />
        <Button icon="scan" onPress={() => navigation.navigate('Scan')} style={{ backgroundColor: C.mint }} textStyle={{ color: C.deep }}>Scan your first prescription</Button>
        <Button variant="dark" onPress={toMain} style={{ backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 10 }}>I'll explore first</Button>
      </ScrollView>
    </LinearGradient>
  );
}
