// screens/SnoozeScreen.js — choose how long "Snooze" delays a reminder.
import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Icon from '../components/Icon';
import { PageHeader } from '../components/common';
import { C, F } from '../theme/colors';
import { useReka } from '../../state/store';

const OPTIONS = [15, 30, 45, 60];
const label = (m) => (m === 60 ? '1 hour' : `${m} minutes`);

export default function SnoozeScreen({ navigation }) {
  const [s, A] = useReka();
  const sel = s.settings.snoozeMin || 30;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.paper }} contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}>
      <PageHeader title="Snooze length" onBack={() => navigation.goBack()} />
      <Text style={{ fontSize: 13.5, color: C.inkSoft, marginHorizontal: 2, marginBottom: 16, fontFamily: F.ui }}>
        When you snooze a reminder, we'll remind you again after this long.
      </Text>
      <View style={{ gap: 10 }}>
        {OPTIONS.map((m) => {
          const on = sel === m;
          return (
            <Pressable key={m} onPress={() => A.setSnooze(m)} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 16, borderRadius: 18, borderWidth: 1.5, borderColor: on ? C.primary : C.lineSoft, backgroundColor: on ? C.primaryTint : C.surface }}>
              <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: on ? C.primary : C.paper2, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="clock" size={21} color={on ? '#fff' : C.inkSoft} stroke={2.1} />
              </View>
              <Text style={{ flex: 1, fontSize: 16, fontFamily: F.uiBold, color: C.ink }}>{label(m)}</Text>
              {on ? (
                <View style={{ width: 26, height: 26, borderRadius: 99, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="check" size={15} color="#fff" stroke={2.8} />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
