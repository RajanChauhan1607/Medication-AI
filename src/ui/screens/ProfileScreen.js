// screens/ProfileScreen.js — age (stepper) + gender (segmented).
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { ObHeader, ObSeg } from './onboardingBits';
import { Button } from '../components/ui';
import { C, F } from '../theme/colors';
import { useReka } from '../../state/store';

export default function ProfileScreen({ navigation }) {
  const [s, A] = useReka();
  const [age, setAge] = useState(s.settings.age || '');
  const [gender, setGender] = useState(s.settings.gender || '');
  const valid = age && +age >= 1 && +age <= 120 && gender;

  const cont = () => { A.setProfile({ age, gender }); navigation.navigate('MealTimes'); };
  const stepBtn = (label, fn) => (
    <Pressable onPress={fn} style={{ width: 54, height: 54, borderRadius: 15, backgroundColor: C.primaryTint, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: C.primaryPress, fontSize: 26, fontFamily: F.display }}>{label}</Text>
    </Pressable>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.paper }} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 22, paddingBottom: 36 }} keyboardShouldPersistTaps="handled">
      <ObHeader step={0} onBack={() => navigation.goBack()} />
      <View style={{ marginTop: 30 }}>
        <Text style={{ fontFamily: F.display, fontSize: 30, lineHeight: 34, letterSpacing: -0.6, color: C.ink }}>A bit about you</Text>
        <Text style={{ fontSize: 15.5, lineHeight: 23, color: C.inkSoft, marginTop: 10, fontFamily: F.ui }}>This helps us tailor dose guidance and keep your plan safe.</Text>
      </View>

      <View style={{ marginTop: 30 }}>
        <Text style={{ fontSize: 13.5, fontFamily: F.uiBold, color: C.inkSoft, marginBottom: 8 }}>Your age</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {stepBtn('−', () => setAge((a) => String(Math.max(1, (+a || 0) - 1))))}
          <TextInput
            value={String(age)} onChangeText={(t) => setAge(t.replace(/\D/g, '').slice(0, 3))} placeholder="58" placeholderTextColor={C.inkFaint} keyboardType="number-pad"
            style={{ width: 88, height: 54, borderRadius: 15, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.surface, textAlign: 'center', fontSize: 22, fontFamily: F.display, color: C.ink }}
          />
          {stepBtn('+', () => setAge((a) => String(Math.min(120, (+a || 0) + 1))))}
          <Text style={{ fontSize: 14.5, fontFamily: F.uiMed, color: C.inkFaint, marginLeft: 4 }}>years</Text>
        </View>
      </View>

      <View style={{ marginTop: 24 }}>
        <Text style={{ fontSize: 13.5, fontFamily: F.uiBold, color: C.inkSoft, marginBottom: 8 }}>Gender</Text>
        <ObSeg options={['Female', 'Male', 'Other', 'Prefer not to say']} value={gender} onChange={setGender} />
      </View>

      <View style={{ flex: 1, minHeight: 24 }} />
      <Button icon="arrowR" onPress={() => valid && cont()} style={{ opacity: valid ? 1 : 0.5 }}>Continue</Button>
    </ScrollView>
  );
}
