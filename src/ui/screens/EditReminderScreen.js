// screens/EditReminderScreen.js — toggle reminders, set times + alarm for a med.
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Icon from '../components/Icon';
import { PageHeader } from '../components/common';
import { Card, Button, MedBadge, Toast, useToast } from '../components/ui';
import { Field, TimePicker, Toggle } from './formBits';
import { C, F } from '../theme/colors';
import { useReka } from '../../state/store';
import { TUNES } from '../../state/tunes';

export default function EditReminderScreen({ navigation, route }) {
  const [s, A] = useReka();
  const [msg, toast] = useToast();
  const med = s.meds.find((m) => m.id === route.params?.medId) || s.meds[0];
  const [times, setTimes] = useState(med.times);
  const [on, setOn] = useState(med.remindersOn);
  const tune = TUNES.find((t) => t.id === med.tune) || TUNES[0];

  const save = () => {
    A.setMedTimes(med.id, times);
    A.toggleReminders(med.id, on);
    toast('Reminders updated', 'bell');
    setTimeout(() => navigation.goBack(), 500);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <Toast msg={msg} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}>
        <PageHeader title="Edit reminders" onBack={() => navigation.goBack()} />
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <MedBadge color={med.color} icon="pill" size={44} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontFamily: F.uiBold, color: C.ink }}>{med.name} <Text style={{ color: C.inkFaint, fontFamily: F.uiMed, fontSize: 13 }}>{med.strength}</Text></Text>
            <Text style={{ fontSize: 12.5, color: C.inkFaint, fontFamily: F.ui }}>{med.dose} · {med.instruction}</Text>
          </View>
        </Card>

        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18, paddingVertical: 14 }}>
          <Icon name="bell" size={20} color={C.primary} stroke={2.1} />
          <Text style={{ flex: 1, fontSize: 15, fontFamily: F.uiBold, color: C.ink }}>Reminders</Text>
          <Toggle on={on} onChange={setOn} />
        </Card>

        <View style={{ opacity: on ? 1 : 0.45 }} pointerEvents={on ? 'auto' : 'none'}>
          <Field label="Reminder times" hint={`${times.length} a day`}><TimePicker times={times} onChange={setTimes} /></Field>
          <Field label="Alarm sound">
            <Pressable onPress={() => navigation.navigate('AlarmSound', { medId: med.id })} style={{ height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.surface, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 15 }}>
              <Icon name="bell" size={19} color={C.primary} stroke={2.1} />
              <Text style={{ flex: 1, fontSize: 15, fontFamily: F.uiBold, color: C.ink }}>{tune.name}</Text>
              <Text style={{ fontSize: 12.5, color: C.inkFaint, marginRight: 6, fontFamily: F.ui }}>{tune.desc}</Text>
              <Icon name="chevR" size={17} color={C.inkFaint} stroke={2.2} />
            </Pressable>
          </Field>
        </View>
        <Button icon="check" onPress={save} style={{ marginTop: 6 }}>Save reminders</Button>
      </ScrollView>
    </View>
  );
}
