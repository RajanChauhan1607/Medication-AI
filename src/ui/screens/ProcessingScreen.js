// screens/ProcessingScreen.js — animated "reading" steps, then → Results.
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { shadow } from '../components/ui';
import { C, F } from '../theme/colors';
import { extractFromBase64, mapToCards } from '../../backend/extract';
import { getState } from '../../state/store';

const STEPS = ['Reading the handwriting', 'Matching to known medications', 'Checking dosages & timing'];

export default function ProcessingScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [done, setDone] = useState(0);
  const [errored, setErrored] = useState(null);
  const spin = useRef(new Animated.Value(0)).current;
  const beam = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.timing(spin, { toValue: 1, duration: 800, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(Animated.timing(beam, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true })).start();
    // advance the visible steps while the real request is in flight
    const ts = [600, 1400].map((ms, i) => setTimeout(() => setDone((d) => Math.max(d, i + 1)), ms));

    const base64 = route?.params?.base64;
    const mime = route?.params?.mime || 'image/jpeg';

    let cancelled = false;
    (async () => {
      // No image means we were opened without a capture — nothing to read.
      if (!base64) {
        setErrored('No photo to read. Please scan or pick a prescription image.');
        return;
      }
      try {
        const { medicines, doctor, clinic } = await extractFromBase64(base64, mime);
        if (cancelled) return;
        setDone(3);
        const detected = mapToCards(medicines, getState().settings.meals);
        const scannedAt = route?.params?.scannedAt || Date.now();
        setTimeout(() => !cancelled && navigation.replace('Results', { detected, doctor, clinic, scannedAt }), 500);
      } catch (e) {
        if (!cancelled) setErrored(String(e.message || e));
      }
    })();

    return () => { cancelled = true; ts.forEach(clearTimeout); };
  }, []);

  const rot = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  if (errored) {
    return (
      <View style={{ flex: 1, backgroundColor: C.paper, paddingHorizontal: 26, paddingTop: insets.top, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <View style={{ width: 64, height: 64, borderRadius: 99, backgroundColor: C.berryTint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="x" size={30} color={C.berry} stroke={2.6} />
        </View>
        <Text style={{ fontFamily: F.display, fontSize: 22, color: C.ink, textAlign: 'center' }}>Couldn't read that one</Text>
        <Text style={{ fontSize: 14, color: C.inkSoft, textAlign: 'center', fontFamily: F.ui }}>{errored}</Text>
        <Text style={{ fontSize: 13, color: C.inkFaint, textAlign: 'center', fontFamily: F.ui }}>Try a clearer, well-lit photo — or enter it by hand.</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          <Text onPress={() => navigation.replace('Scan')} style={{ backgroundColor: C.primary, color: '#fff', fontFamily: F.uiBold, fontSize: 15, paddingVertical: 13, paddingHorizontal: 22, borderRadius: 14, overflow: 'hidden' }}>Try again</Text>
          <Text onPress={() => navigation.replace('ManualEntry')} style={{ backgroundColor: C.surface, color: C.primaryPress, fontFamily: F.uiBold, fontSize: 15, paddingVertical: 13, paddingHorizontal: 22, borderRadius: 14, overflow: 'hidden' }}>Type it in</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.paper }} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 22, paddingTop: insets.top + 26, paddingBottom: 40 }}>
      <Text style={{ fontFamily: F.display, fontSize: 26, letterSpacing: -0.6, color: C.ink }}>Reading your prescription…</Text>
      <Text style={{ fontSize: 14.5, color: C.inkSoft, marginTop: 8, fontFamily: F.ui }}>This usually takes a few seconds.</Text>

      {/* scanning animation — neutral document skeleton with a sweeping scan beam */}
      <View style={{ marginTop: 26, height: 200, borderRadius: 16, backgroundColor: C.surface, borderWidth: 1, borderColor: C.lineSoft, overflow: 'hidden', padding: 18, justifyContent: 'space-between', ...shadow('md') }}>
        {[0.5, 0.85, 0.68, 0.92, 0.58, 0.8, 0.44].map((w, i) => (
          <View key={i} style={{ height: 11, borderRadius: 6, backgroundColor: i % 3 === 0 ? C.paper2 : 'rgba(44,40,35,0.06)', width: `${w * 100}%` }} />
        ))}
        <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, height: 48, transform: [{ translateY: beam.interpolate({ inputRange: [0, 1], outputRange: [-48, 200] }) }] }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(220,122,87,0.10)' }} />
          <View style={{ height: 2.5, backgroundColor: C.primary }} />
        </Animated.View>
      </View>

      <View style={{ marginTop: 28, gap: 14 }}>
        {STEPS.map((s, i) => {
          const isDone = i < done;
          const isActive = i === done;
          return (
            <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, opacity: i <= done ? 1 : 0.4 }}>
              <View style={{ width: 28, height: 28, borderRadius: 99, alignItems: 'center', justifyContent: 'center', backgroundColor: isDone ? C.sage : isActive ? C.primaryTint : C.paper2 }}>
                {isDone ? (
                  <Icon name="check" size={16} color="#fff" stroke={2.8} />
                ) : isActive ? (
                  <Animated.View style={{ width: 14, height: 14, borderRadius: 99, borderWidth: 2.5, borderColor: C.primary, borderTopColor: 'transparent', transform: [{ rotate: rot }] }} />
                ) : (
                  <View style={{ width: 7, height: 7, borderRadius: 99, backgroundColor: C.inkFaint }} />
                )}
              </View>
              <Text style={{ fontSize: 15, fontFamily: isActive ? F.uiBold : F.uiMed, color: isDone || isActive ? C.ink : C.inkFaint }}>{s}</Text>
            </View>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 24 }}>
        <Icon name="shield" size={15} color={C.inkFaint} stroke={2} />
        <Text style={{ color: C.inkFaint, fontSize: 12.5, fontFamily: F.ui }}>Encrypted in transit · processed securely</Text>
      </View>
    </ScrollView>
  );
}
