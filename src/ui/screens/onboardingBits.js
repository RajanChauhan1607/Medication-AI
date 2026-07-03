// screens/onboardingBits.js — shared onboarding header, dots, segmented control.
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { Logo } from '../components/common';
import { C, F } from '../theme/colors';

export function ObDots({ step, total = 3 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 7 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={{ height: 6, borderRadius: 99, width: i === step ? 22 : 6, backgroundColor: i <= step ? C.primary : C.line }} />
      ))}
    </View>
  );
}

export function ObHeader({ step, onBack }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      {onBack ? (
        <Pressable onPress={onBack} style={{ width: 40, height: 40, borderRadius: 99, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevL" size={20} color={C.inkSoft} stroke={2.3} />
        </Pressable>
      ) : (
        <Logo size={26} />
      )}
      <ObDots step={step} />
      <View style={{ width: 40 }} />
    </View>
  );
}

export function ObSeg({ options, value, onChange }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
      {options.map((o) => {
        const on = value === o;
        return (
          <Pressable key={o} onPress={() => onChange(o)} style={{ height: 46, paddingHorizontal: 18, borderRadius: 13, borderWidth: 1.5, borderColor: on ? C.primary : C.line, backgroundColor: on ? C.primaryTint : C.surface, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: on ? C.primaryPress : C.inkSoft, fontSize: 15, fontFamily: F.uiBold }}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
