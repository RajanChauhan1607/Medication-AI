// components/BatteryPrompt.js — one-time prompt to exempt Medication AI from battery optimisation,
// so medicine alarms aren't delayed or killed on aggressive Android phones (Xiaomi, Oppo,
// Samsung, etc.). Shows once; remembers that it's been shown.
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import { C, F } from '../theme/colors';
import {
  getBatteryGuidance, markBatteryPrompted,
  openBatteryOptimizationSettings, openPowerManagerSettings,
} from '../../backend/alarm';

export default function BatteryPrompt() {
  const insets = useSafeAreaInsets();
  const [info, setInfo] = useState(null); // null = not decided yet, false = hidden, object = show

  useEffect(() => {
    let cancelled = false;
    // small delay so it doesn't fight the first render / other prompts
    const t = setTimeout(async () => {
      const g = await getBatteryGuidance();
      if (!cancelled) setInfo(g.show ? g : false);
    }, 1500);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  const close = async () => { await markBatteryPrompted(); setInfo(false); };
  const allow = async () => {
    await openBatteryOptimizationSettings();
    if (info?.powerManager?.activity) { setTimeout(() => openPowerManagerSettings(), 400); }
    await close();
  };

  if (!info) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: 'rgba(20,17,15,0.5)', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: insets.bottom }}>
        <View style={{ backgroundColor: C.paper, borderRadius: 24, padding: 24 }}>
          <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: C.primaryTint, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Icon name="bell" size={30} color={C.primary} stroke={2.2} />
          </View>
          <Text style={{ fontFamily: F.display, fontSize: 23, lineHeight: 28, color: C.ink, letterSpacing: -0.4 }}>Keep your alarms on time</Text>
          <Text style={{ fontSize: 15.5, lineHeight: 23, color: C.inkSoft, marginTop: 10, fontFamily: F.ui }}>
            To make sure your medicine alarms ring exactly when they should — even while your phone is asleep — please allow Medication AI to run without battery limits.
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 21, color: C.inkFaint, marginTop: 10, fontFamily: F.ui }}>
            On the next screen, choose <Text style={{ fontFamily: F.uiBold, color: C.ink }}>Don't optimize</Text> (or <Text style={{ fontFamily: F.uiBold, color: C.ink }}>Allow / No restrictions</Text>) for Medication AI.
          </Text>

          <Pressable onPress={allow} style={{ height: 54, borderRadius: 999, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginTop: 22 }}>
            <Text style={{ fontSize: 16.5, fontFamily: F.uiBold, color: '#fff' }}>Open settings</Text>
          </Pressable>
          <Pressable onPress={close} style={{ height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 6 }}>
            <Text style={{ fontSize: 15, fontFamily: F.uiBold, color: C.inkFaint }}>Maybe later</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
