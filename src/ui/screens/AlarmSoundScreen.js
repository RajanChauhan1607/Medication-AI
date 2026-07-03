// screens/AlarmSoundScreen.js — pick an alarm tune (per-med or app default).
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Icon from '../components/Icon';
import { PageHeader } from '../components/common';
import { C, F } from '../theme/colors';
import { useReka } from '../../state/store';
import { TUNES, playTune } from '../../state/tunes';
import { previewAlarm } from '../../backend/alarm';

export default function AlarmSoundScreen({ navigation, route }) {
  const [s, A] = useReka();
  const medId = route.params?.medId;
  const isMed = !!medId;
  const initial = isMed ? (s.meds.find((m) => m.id === medId) || {}).tune : s.settings.defaultTune;
  const [sel, setSel] = useState(initial || 'chime');

  const pick = (id) => {
    setSel(id);
    playTune(id);          // instant strong vibration
    previewAlarm(id);      // a short sample of the real alarm sound + vibration (~4s)
    if (isMed) A.setMedTune(medId, id);
    else A.setDefaultTune(id);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.paper }} contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}>
      <PageHeader title="Alarm sound" onBack={() => navigation.goBack()} />
      <Text style={{ fontSize: 13.5, color: C.inkSoft, marginHorizontal: 2, marginBottom: 16, fontFamily: F.ui }}>
        Tap to preview. {isMed ? 'Used for this medication.' : 'Your default for new reminders.'}
      </Text>
      <View style={{ gap: 10 }}>
        {TUNES.map((t) => {
          const on = sel === t.id;
          return (
            <Pressable key={t.id} onPress={() => pick(t.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 15, borderRadius: 18, borderWidth: 1.5, borderColor: on ? C.primary : C.lineSoft, backgroundColor: on ? C.primaryTint : C.surface }}>
              <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: on ? C.primary : C.paper2, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="bell" size={21} color={on ? '#fff' : C.inkFaint} stroke={2.1} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15.5, fontFamily: F.uiBold, color: C.ink }}>{t.name}</Text>
                <Text style={{ fontSize: 12.5, color: C.inkFaint, fontFamily: F.ui }}>{t.desc}</Text>
              </View>
              {on ? (
                <View style={{ width: 26, height: 26, borderRadius: 99, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="check" size={15} color="#fff" stroke={2.8} />
                </View>
              ) : (
                <Icon name="chevR" size={16} color={C.inkFaint} stroke={2.2} />
              )}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
