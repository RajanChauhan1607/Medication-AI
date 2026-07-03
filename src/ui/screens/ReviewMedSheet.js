// screens/ReviewMedSheet.js — review & correct a single AI-detected medicine.
// Opened from the Results screen. Edits the medicine's name/strength/form/schedule/
// instruction/duration, then rebuilds the card via mapToCards so timings stay consistent.
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { Button } from '../components/ui';
import { Field, TextField, Segmented } from './formBits';
import { C, F } from '../theme/colors';
import { getState } from '../../state/store';
import { mapToCards } from '../../backend/extract';

const FORMS = ['Tablet', 'Capsule', 'Syrup', 'Drops'];
const INSTRUCTIONS = ['After food', 'Before food', 'Empty stomach', 'With water', 'At bedtime', 'As prescribed'];
const INSTR_TO_RAW = {
  'After food': 'after food', 'Before food': 'before food', 'Empty stomach': 'empty stomach',
  'With water': 'with water', 'At bedtime': 'at bedtime', 'As prescribed': '',
};

function gridFrom(perDay) {
  const m = /^(\d+)-(\d+)-(\d+)$/.exec(String(perDay || '').trim());
  return m ? [+m[1], +m[2], +m[3]] : [0, 0, 0];
}
function instrLabelFrom(text) {
  return INSTRUCTIONS.includes(text) ? text : 'As prescribed';
}

// one compact morning/afternoon/night counter
function SlotStepper({ label, value, onChange }) {
  const btn = (sym, fn, dis) => (
    <Pressable onPress={dis ? undefined : fn} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: dis ? C.paper2 : C.primaryTint, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: dis ? C.inkFaint : C.primaryPress, fontSize: 19, fontFamily: F.display }}>{sym}</Text>
    </Pressable>
  );
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 8 }}>
      <Text style={{ fontSize: 11.5, fontFamily: F.uiBold, color: C.inkSoft }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {btn('−', () => onChange(value - 1), value <= 0)}
        <Text style={{ minWidth: 18, textAlign: 'center', fontSize: 17, fontFamily: F.uiBold, color: C.ink }}>{value}</Text>
        {btn('+', () => onChange(value + 1), value >= 4)}
      </View>
    </View>
  );
}

export default function ReviewMedSheet({ med, onSave, onClose }) {
  const insets = useSafeAreaInsets();
  const open = !!med;
  const initialSos = /sos/i.test(med?.per_day || '');
  const [name, setName] = useState(med?.name || '');
  const [strength, setStrength] = useState(med?.strength || '');
  const [form, setForm] = useState(FORMS.includes(med?.form) ? med.form : 'Tablet');
  const [grid, setGrid] = useState(gridFrom(med?.per_day));
  const [sos, setSos] = useState(initialSos);
  const [instr, setInstr] = useState(instrLabelFrom(med?.instruction));
  const [duration, setDuration] = useState(med?.duration && med.duration !== 'Ongoing' ? med.duration : '');

  const setSlot = (i, v) => setGrid((g) => g.map((x, k) => (k === i ? Math.max(0, Math.min(4, v)) : x)));
  const hasDose = sos || grid.some((x) => x > 0);
  const valid = name.trim() && hasDose;

  const save = () => {
    if (!valid) return;
    const per_day = sos ? 'SOS' : grid.join('-');
    const raw = {
      name: name.trim(), strength: strength.trim(), form: form.toLowerCase(),
      per_day, instruction: INSTR_TO_RAW[instr] ?? '', duration: duration.trim(),
      confidence: (med?.confidence ?? 0) >= 0.9 ? 'high' : 'low',
    };
    const [card] = mapToCards([raw], getState().settings.meals);
    card.id = med.id;                       // keep identity so it replaces in place
    card.color = med.color;
    card.source = med.source || 'scan';
    onSave(card);
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(20,17,15,0.45)', justifyContent: 'flex-end' }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ backgroundColor: C.paper, borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: '92%', paddingBottom: insets.bottom + 10 }}>
            {/* header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10 }}>
              <Text style={{ fontFamily: F.display, fontSize: 21, color: C.ink, letterSpacing: -0.3 }}>Review medicine</Text>
              <Pressable onPress={onClose} style={{ width: 34, height: 34, borderRadius: 99, backgroundColor: C.paper2, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="x" size={18} color={C.inkSoft} stroke={2.4} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Field label="Medicine name"><TextField value={name} onChange={setName} placeholder="e.g. Crocin" /></Field>
              <Field label="Strength"><TextField value={strength} onChange={setStrength} placeholder="e.g. 500 mg" /></Field>
              <Field label="Form"><Segmented options={FORMS} value={form} onChange={setForm} /></Field>

              <Field label="When to take" hint={sos ? 'only when needed' : 'doses per day'}>
                <Pressable onPress={() => setSos((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: sos ? 0 : 14 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 7, borderWidth: 2, borderColor: sos ? C.primary : C.line, backgroundColor: sos ? C.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    {sos ? <Icon name="check" size={14} color="#fff" stroke={3} /> : null}
                  </View>
                  <Text style={{ fontSize: 14.5, fontFamily: F.uiMed, color: C.ink }}>Only when needed (SOS)</Text>
                </Pressable>
                {!sos ? (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    <SlotStepper label="MORNING" value={grid[0]} onChange={(v) => setSlot(0, v)} />
                    <SlotStepper label="AFTERNOON" value={grid[1]} onChange={(v) => setSlot(1, v)} />
                    <SlotStepper label="NIGHT" value={grid[2]} onChange={(v) => setSlot(2, v)} />
                  </View>
                ) : null}
              </Field>

              <Field label="Instructions"><Segmented options={INSTRUCTIONS} value={instr} onChange={setInstr} /></Field>
              <Field label="Duration" hint="leave blank if ongoing"><TextField value={duration} onChange={setDuration} placeholder="e.g. 5 days / 2 weeks" /></Field>

              <View style={{ height: 6 }} />
              <Button icon="check" onPress={save} style={{ opacity: valid ? 1 : 0.5 }}>Save changes</Button>
              <View style={{ height: 10 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
