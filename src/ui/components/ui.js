// components/ui.js — Medication AI UI primitives ported to React Native.
// Ring, ConfBar, Chip, Button, Card, SectionLabel, MedBadge, IconChip, Screen, Toast.

import React from 'react';
import { View, Text, Pressable, ScrollView, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Icon from './Icon';
import { C, F } from '../theme/colors';

// RN has no box-shadow — emulate with iOS shadow props + Android elevation.
export function shadow(level = 'sm', color = '#0B3F46') {
  const map = {
    sm: { radius: 8, opacity: 0.1, y: 3, elevation: 2 },
    md: { radius: 16, opacity: 0.14, y: 6, elevation: 5 },
    lg: { radius: 34, opacity: 0.22, y: 16, elevation: 10 },
  };
  const s = map[level] || map.sm;
  return {
    shadowColor: color, shadowOffset: { width: 0, height: s.y },
    shadowOpacity: s.opacity, shadowRadius: s.radius, elevation: s.elevation,
  };
}

// ── Progress ring ────────────────────────────────────────────
export function Ring({ value = 0, size = 116, stroke = 11, color = C.primary, track = C.line, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  const off = c * (1 - v);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" />
      </Svg>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>{children}</View>
    </View>
  );
}

// ── Confidence bar ───────────────────────────────────────────
export function ConfBar({ value, color }) {
  const pct = Math.round(value * 100);
  const c = color || (value >= 0.9 ? C.sage : value >= 0.85 ? C.amber : C.berry);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ flex: 1, height: 8, borderRadius: 99, backgroundColor: C.paper2, overflow: 'hidden' }}>
        <View style={{ width: `${pct}%`, height: '100%', borderRadius: 99, backgroundColor: c }} />
      </View>
      <Text style={{ fontSize: 13, fontFamily: F.uiHeavy, color: c, minWidth: 36, textAlign: 'right' }}>{pct}%</Text>
    </View>
  );
}

// ── Chip ─────────────────────────────────────────────────────
export function Chip({ icon, children, tint = C.primaryTint, fg = C.primaryPress, style, textStyle }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 30, paddingHorizontal: 12, borderRadius: 99, backgroundColor: tint }, style]}>
      {icon ? <Icon name={icon} size={15} color={fg} stroke={2.4} /> : null}
      <Text style={[{ fontSize: 13, fontFamily: F.uiBold, color: fg }, textStyle]}>{children}</Text>
    </View>
  );
}

// ── Button ───────────────────────────────────────────────────
export function Button({ children, onPress, variant = 'primary', icon, full = true, size = 'lg', style, textStyle }) {
  const h = size === 'lg' ? 56 : size === 'md' ? 48 : 40;
  const variants = {
    primary: { bg: C.primary, fg: '#fff' },
    soft: { bg: C.primaryTint, fg: C.primaryPress },
    ghost: { bg: '#fff', fg: C.primaryPress, border: C.line },
    sage: { bg: C.sage, fg: '#fff' },
    dark: { bg: C.deep, fg: '#fff' },
  };
  const v = variants[variant] || variants.primary;
  const fs = size === 'sm' ? 14.5 : 16.5;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          height: h, borderRadius: h / 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
          backgroundColor: v.bg, paddingHorizontal: full ? 0 : 22, alignSelf: full ? 'stretch' : 'flex-start',
          borderWidth: v.border ? 1.5 : 0, borderColor: v.border, transform: [{ scale: pressed ? 0.97 : 1 }],
          ...(variant === 'primary' ? shadow('sm', C.primary) : {}),
        },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={size === 'sm' ? 16 : 20} color={v.fg} stroke={2.4} /> : null}
      <Text style={[{ fontSize: fs, fontFamily: F.uiBold, color: v.fg }, textStyle]}>{children}</Text>
    </Pressable>
  );
}

// ── Card ─────────────────────────────────────────────────────
// IMPORTANT: when pressable, the layout style (width / flex / flexGrow) must live
// on the Pressable itself — not an inner View — or percentage/flex widths resolve
// against a collapsed wrapper and the card shrinks to its content (text wraps to a
// single character per line, rows look empty). So style goes on the touchable.
export function Card({ children, onPress, style, pad = 16 }) {
  const cardStyle = [{ backgroundColor: '#fff', borderRadius: 20, padding: pad, ...shadow('sm') }, style];
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [cardStyle, pressed ? { opacity: 0.85 } : null]}>
        {children}
      </Pressable>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

// ── Section label ────────────────────────────────────────────
export function SectionLabel({ children, action, onAction }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 2, paddingBottom: 10 }}>
      <Text style={{ fontFamily: F.display, fontSize: 16.5, color: C.deep, letterSpacing: -0.2 }}>{children}</Text>
      {action ? <Text onPress={onAction} style={{ fontSize: 13.5, fontFamily: F.uiHeavy, color: C.primary }}>{action}</Text> : null}
    </View>
  );
}

// ── Squircle medication badge ────────────────────────────────
// Pure (all-primitive props) → memoized so list rows don't re-render it needlessly.
export const MedBadge = React.memo(function MedBadge({ color = C.primary, icon = 'pill', size = 44 }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.34, alignItems: 'center', justifyContent: 'center', backgroundColor: color, ...shadow('sm', color) }}>
      <Icon name={icon} size={Math.round(size * 0.52)} color="#fff" stroke={2.3} />
    </View>
  );
});

// ── Duotone icon chip ────────────────────────────────────────
export const IconChip = React.memo(function IconChip({ icon, size = 42, tint = C.primaryTint, fg = C.primaryPress, r }) {
  return (
    <View style={{ width: size, height: size, borderRadius: r != null ? r : size * 0.32, alignItems: 'center', justifyContent: 'center', backgroundColor: tint }}>
      <Icon name={icon} size={Math.round(size * 0.52)} color={fg} stroke={2.3} />
    </View>
  );
});

// ── Screen scroll container ──────────────────────────────────
export function Screen({ children, pad = true, bg = C.paper, style, contentStyle }) {
  return (
    <View style={[{ flex: 1, backgroundColor: bg }, style]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[{ paddingHorizontal: pad ? 18 : 0, flexGrow: 1 }, contentStyle]}
      >
        {children}
      </ScrollView>
    </View>
  );
}

// ── Toast ────────────────────────────────────────────────────
export function Toast({ msg }) {
  const a = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    if (!msg) return;
    a.setValue(0);
    Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.delay(1700),
      Animated.timing(a, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [msg]);
  if (!msg) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', top: 56, left: 0, right: 0, alignItems: 'center', zIndex: 90,
        opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.deep, paddingVertical: 12, paddingHorizontal: 17, borderRadius: 99, maxWidth: '88%', ...shadow('md') }}>
        <View style={{ width: 24, height: 24, borderRadius: 99, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={msg.icon || 'check'} size={15} color={C.deep} stroke={2.8} />
        </View>
        <Text style={{ color: '#fff', fontSize: 15, fontFamily: F.uiBold }}>{msg.text}</Text>
      </View>
    </Animated.View>
  );
}

// Tiny hook for the toast pattern used across screens.
export function useToast() {
  const [msg, setMsg] = React.useState(null);
  const toast = React.useCallback((text, icon) => setMsg({ text, icon, key: Date.now() }), []);
  React.useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(null), 2300);
    return () => clearTimeout(id);
  }, [msg]);
  return [msg, toast];
}
