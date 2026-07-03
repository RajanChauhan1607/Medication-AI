// components/common.js — Logo, DeepHeader, Avatar, TopBar, PageHeader.

import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import { C, F } from '../theme/colors';
import { getState } from '../../state/store';

const LOGO_MARK = require('../../../assets/icon.png');

export function Logo({ size = 28, mono = false }) {
  const box = size * 1.2;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
      <Image source={LOGO_MARK} style={{ width: box, height: box, borderRadius: box * 0.28 }} resizeMode="contain" />
      <Text style={{ fontFamily: F.display, fontSize: size, letterSpacing: -0.6, color: mono ? '#fff' : C.deep }}>Medication AI</Text>
    </View>
  );
}

// Curved deep-teal header used across the main tabs.
export function DeepHeader({ children, extraTop = 14, bottom = 22 }) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={[C.deep, C.deep2]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={{ borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingTop: insets.top + extraTop, paddingHorizontal: 18, paddingBottom: bottom, overflow: 'hidden' }}
    >
      <View style={{ position: 'absolute', right: -60, top: -70, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)' }} />
      <View style={{ position: 'absolute', left: -40, bottom: -90, width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(255,255,255,0.04)' }} />
      <View>{children}</View>
    </LinearGradient>
  );
}

export function Avatar({ size = 42, onPress, light = false }) {
  const letter = ((getState().settings.name) || 'M')[0].toUpperCase();
  const body = (
    <View style={{ width: size, height: size, borderRadius: 99, alignItems: 'center', justifyContent: 'center', backgroundColor: light ? 'rgba(255,255,255,0.18)' : C.primary, borderWidth: light ? 1.5 : 0, borderColor: 'rgba(255,255,255,0.4)' }}>
      <Text style={{ color: '#fff', fontFamily: F.display, fontSize: size * 0.42 }}>{letter}</Text>
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{body}</Pressable> : body;
}

export function SosPill({ onPress }) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 14, borderRadius: 99, backgroundColor: C.coral }}>
      <Icon name="phone" size={16} color="#fff" stroke={2.5} />
      <Text style={{ color: '#fff', fontFamily: F.uiHeavy, fontSize: 14, letterSpacing: 0.5 }}>SOS</Text>
    </Pressable>
  );
}

// White-bg screen top bar with a big title (used by Meds/Schedule/History).
export function TopBar({ left, right, extraTop = 6 }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + extraTop, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flex: 1 }}>{left}</View>
      {right}
    </View>
  );
}

// Back-button + title row used by detail/form screens.
export function PageHeader({ title, onBack, right }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 6, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 }}>
      <Pressable onPress={onBack} style={{ width: 38, height: 38, borderRadius: 99, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="chevL" size={19} color={C.inkSoft} stroke={2.3} />
      </Pressable>
      <Text style={{ flex: 1, fontFamily: F.display, fontSize: 22, letterSpacing: -0.4, color: C.ink }}>{title}</Text>
      {right}
    </View>
  );
}
