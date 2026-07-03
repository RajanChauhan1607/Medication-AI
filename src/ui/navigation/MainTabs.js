// navigation/MainTabs.js — bottom tabs (Today / Meds / Scan FAB / Schedule / History)
// with the prototype's frosted-glass floating dock.

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { C, F } from '../theme/colors';
import { shadow } from '../components/ui';

import HomeScreen from '../screens/HomeScreen';
import MedsScreen from '../screens/MedsScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import HistoryScreen from '../screens/HistoryScreen';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Home', label: 'Today', icon: 'home' },
  { name: 'Meds', label: 'Meds', icon: 'pill' },
  { name: 'Scan', label: 'Scan', icon: 'scan', fab: true },
  { name: 'Schedule', label: 'Schedule', icon: 'calendar' },
  { name: 'History', label: 'History', icon: 'clock' },
];

function GlassTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const activeRoute = state.routes[state.index].name;

  const go = (name) => {
    if (name === 'Scan') { navigation.navigate('Scan'); return; }
    const event = navigation.emit({ type: 'tabPress', target: name, canPreventDefault: true });
    if (!event.defaultPrevented) navigation.navigate(name);
  };

  const tab = (t) => {
    const active = activeRoute === t.name;
    return (
      <Pressable key={t.name} onPress={() => go(t.name)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 6, borderRadius: 15, backgroundColor: active ? C.primaryTint : 'transparent' }}>
        <Icon name={t.icon} size={24} color={active ? C.primaryPress : C.inkFaint} stroke={active ? 2.6 : 2.1} />
        <Text style={{ fontSize: 10.5, fontFamily: F.uiHeavy, color: active ? C.primaryPress : C.inkFaint }}>{t.label}</Text>
      </Pressable>
    );
  };
  const sideTabs = TABS.filter((t) => !t.fab);

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 14, right: 14, bottom: Math.max(insets.bottom, 12) }}>
      {/* frosted bar — 4 tabs with a centre gap reserved for the floating scan button.
          The blur clips to its own rounded rect; the FAB is a sibling ABOVE it so its
          protruding top is never cut off. */}
      <View style={{ borderRadius: 30, ...shadow('lg') }}>
        <BlurView intensity={64} tint="light" style={{ flexDirection: 'row', alignItems: 'stretch', borderRadius: 30, paddingVertical: 9, paddingHorizontal: 10, overflow: 'hidden', backgroundColor: 'rgba(247,252,252,0.55)' }}>
          {tab(sideTabs[0])}
          {tab(sideTabs[1])}
          <View style={{ width: 64 }} />
          {tab(sideTabs[2])}
          {tab(sideTabs[3])}
        </BlurView>
        {/* liquid-glass sheen: a soft top highlight + hairline edge, contained in the rounded rect */}
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)' }} />
        <View pointerEvents="none" style={{ position: 'absolute', top: 1, left: 24, right: 24, height: 1, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.7)' }} />
      </View>

      {/* floating scan button — larger than the tabs, centred over the gap, rendered outside the clipped bar */}
      <View pointerEvents="box-none" style={{ position: 'absolute', top: -26, left: 0, right: 0, alignItems: 'center' }}>
        <Pressable onPress={() => go('Scan')} style={{ width: 66, height: 66, borderRadius: 99, borderWidth: 4, borderColor: 'rgba(255,255,255,0.92)', backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', ...shadow('lg', C.primary) }}>
          <Icon name="scan" size={30} color="#fff" stroke={2.4} />
        </Pressable>
      </View>
    </View>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, lazy: true, freezeOnBlur: true }}
      tabBar={(props) => <GlassTabBar {...props} />}
      backBehavior="history"
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Meds" component={MedsScreen} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
    </Tab.Navigator>
  );
}
