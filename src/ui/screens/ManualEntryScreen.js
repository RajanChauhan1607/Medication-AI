// screens/ManualEntryScreen.js — enter a medication by hand.
import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '../components/Icon';
import { PageHeader } from '../components/common';
import { Button } from '../components/ui';
import { Field, TextField, Segmented, Stepper, ColorSwatches, TimePicker } from './formBits';
import { C, F, MED_COLORS } from '../theme/colors';
import { useReka, getState, afterMealTimes } from '../../state/store';
import { TUNES } from '../../state/tunes';

export default function ManualEntryScreen({ navigation, route }) {
  const [, A] = useReka();
  const [f, setF] = useState(() => ({
    name: '', strength: '', form: 'Tablet', dose: 1,
    times: [afterMealTimes(getState().settings.meals)[0] || '9:00 AM'], // seeded from meal time, freely editable
    instruction: 'After food', color: MED_COLORS[0], tune: getState().settings.defaultTune,
  }));
  const up = (k, v) => setF((s) => ({ ...s, [k]: v }));
  // pick the alarm via the shared AlarmSound screen (edits the default tune)
  useFocusEffect(useCallback(() => { setF((s) => ({ ...s, tune: getState().settings.defaultTune })); }, []));
  const valid = f.name.trim() && f.times.length;
  const tuneName = (TUNES.find((t) => t.id === f.tune) || {}).name;

  const save = () => {
    if (!valid) return;
    A.addMed({
      name: f.name.trim(), strength: f.strength.trim() || '—', form: f.form,
      dose: `${f.dose} ${f.form.toLowerCase()}${f.dose > 1 ? 's' : ''}`, times: f.times,
      frequency: `${f.times.length}× daily`, schedule: `${f.times.length}× daily · ${f.instruction.toLowerCase()}`,
      instruction: f.instruction,
      instrIcon: f.instruction.toLowerCase().includes('food') ? 'food' : f.instruction.toLowerCase().includes('water') ? 'drop' : 'sun',
      color: f.color, tune: f.tune,
    });
    navigation.navigate('Main', { screen: 'Meds' });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.paper }} contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <PageHeader title="Add medication" onBack={() => navigation.goBack()} />
      <Text style={{ fontSize: 13.5, color: C.inkSoft, marginHorizontal: 2, marginBottom: 18, fontFamily: F.ui }}>No prescription handy? Enter the details yourself.</Text>

      <Field label="Medication name"><TextField value={f.name} onChange={(v) => up('name', v)} placeholder="e.g. Metformin" /></Field>
      <Field label="Strength"><TextField value={f.strength} onChange={(v) => up('strength', v)} placeholder="500 mg" /></Field>
      <Field label="Form"><Segmented options={['Tablet', 'Capsule', 'Liquid', 'Drop']} value={f.form} onChange={(v) => up('form', v)} /></Field>
      <Field label="Dose each time"><Stepper value={f.dose} onChange={(v) => up('dose', v)} suffix={f.form.toLowerCase()} /></Field>
      <Field label="Reminder times" hint={`${f.times.length} a day`}><TimePicker times={f.times} onChange={(v) => up('times', v)} /></Field>
      <Field label="Instructions"><Segmented options={['After food', 'Before food', 'With water', 'As needed']} value={f.instruction} onChange={(v) => up('instruction', v)} /></Field>
      <Field label="Colour"><ColorSwatches value={f.color} onChange={(v) => up('color', v)} /></Field>
      <Field label="Reminder vibration">
        <Pressable onPress={() => navigation.navigate('AlarmSound', { mode: 'default' })} style={{ height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.surface, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 15 }}>
          <Icon name="bell" size={19} color={C.primary} stroke={2.1} />
          <Text style={{ flex: 1, fontSize: 15, fontFamily: F.uiBold, color: C.ink }}>{tuneName}</Text>
          <Icon name="chevR" size={17} color={C.inkFaint} stroke={2.2} />
        </Pressable>
      </Field>

      <View style={{ height: 8 }} />
      <Button icon="check" onPress={save} style={{ opacity: valid ? 1 : 0.5 }}>Add medication</Button>
    </ScrollView>
  );
}
