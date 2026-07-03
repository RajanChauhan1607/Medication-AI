// screens/MealTimesScreen.js — set meal times; reminders auto-set 30 min after.
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { ObHeader } from './onboardingBits';
import Icon from '../components/Icon';
import { Card, Button } from '../components/ui';
import { C, F } from '../theme/colors';
import { useReka, toMins, fromMins, plusMin, afterMealTimes } from '../../state/store';

const ROWS = [
  { k: 'breakfast', label: 'Breakfast', icon: 'sun' },
  { k: 'lunch', label: 'Lunch', icon: 'food' },
  { k: 'dinner', label: 'Dinner', icon: 'moon' },
];

export default function MealTimesScreen({ navigation }) {
  const [s, A] = useReka();
  const [meals, setMeals] = useState(s.settings.meals);
  const bump = (k, delta) => setMeals((m) => ({ ...m, [k]: fromMins((toMins(m[k]) + delta + 1440) % 1440) }));
  const reminders = afterMealTimes(meals);

  const finish = () => { A.setMeals(meals); A.applyMealReminders(); navigation.navigate('Welcome'); };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.paper }} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 22, paddingBottom: 36 }}>
      <ObHeader step={1} onBack={() => navigation.goBack()} />
      <View style={{ marginTop: 30 }}>
        <Text style={{ fontFamily: F.display, fontSize: 30, lineHeight: 34, letterSpacing: -0.6, color: C.ink }}>When do you eat?</Text>
        <Text style={{ fontSize: 15.5, lineHeight: 23, color: C.inkSoft, marginTop: 10, fontFamily: F.ui }}>
          Many medicines are taken after food. We'll set reminders <Text style={{ fontFamily: F.uiBold, color: C.ink }}>30 minutes after</Text> each meal — automatically.
        </Text>
      </View>

      <View style={{ gap: 11, marginTop: 26 }}>
        {ROWS.map((r) => (
          <Card key={r.k} pad={14} style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
            <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: C.primaryTint, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={r.icon} size={22} color={C.primaryPress} stroke={2.1} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontFamily: F.uiBold, color: C.ink }}>{r.label}</Text>
              <Text style={{ fontSize: 13, color: C.inkFaint, fontFamily: F.ui }}>Reminder at {plusMin(meals[r.k], 30)}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Pressable onPress={() => bump(r.k, -15)} style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: C.paper2, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="chevL" size={16} color={C.inkSoft} stroke={2.5} />
              </Pressable>
              <Text style={{ width: 78, textAlign: 'center', fontSize: 15, fontFamily: F.uiBold, color: C.ink }}>{meals[r.k]}</Text>
              <Pressable onPress={() => bump(r.k, 15)} style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: C.paper2, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="chevR" size={16} color={C.inkSoft} stroke={2.5} />
              </Pressable>
            </View>
          </Card>
        ))}
      </View>

      <View style={{ marginTop: 18, padding: 16, borderRadius: 18, backgroundColor: C.sageTint, flexDirection: 'row', gap: 12 }}>
        <Icon name="bell" size={20} color="#4F7A4C" stroke={2.2} style={{ marginTop: 1 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontFamily: F.uiBold, color: '#3D5E3A' }}>Your after-food reminders</Text>
          <Text style={{ fontSize: 13.5, color: '#4F7A4C', marginTop: 3, lineHeight: 20, fontFamily: F.ui }}>{reminders.join('  ·  ')}</Text>
        </View>
      </View>

      <View style={{ flex: 1, minHeight: 20 }} />
      <Button icon="check" onPress={finish}>Set my reminders</Button>
    </ScrollView>
  );
}
