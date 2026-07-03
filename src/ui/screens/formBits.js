// screens/formBits.js — shared form controls (Field, TextField, Segmented, Stepper, ColorSwatches, TimePicker, Toggle).
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import Icon from '../components/Icon';
import { C, F, MED_COLORS } from '../theme/colors';
import { toMins, fromMins } from '../../state/store';

export const TIME_PRESETS = ['7:30 AM', '8:00 AM', '9:00 AM', '12:00 PM', '2:00 PM', '6:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'];

export function Field({ label, hint, children }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ fontSize: 13, fontFamily: F.uiBold, color: C.inkSoft, marginBottom: 8 }}>
        {label}{hint ? <Text style={{ color: C.inkFaint, fontFamily: F.ui }}> · {hint}</Text> : null}
      </Text>
      {children}
    </View>
  );
}

export function TextField({ value, onChange, placeholder, keyboardType }) {
  const [focus, setFocus] = useState(false);
  return (
    <TextInput
      value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={C.inkFaint} keyboardType={keyboardType}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{ height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: focus ? C.primary : C.line, backgroundColor: C.surface, paddingHorizontal: 15, fontSize: 16, fontFamily: F.ui, color: C.ink }}
    />
  );
}

export function Segmented({ options, value, onChange }) {
  return (
    <View style={{ flexDirection: 'row', gap: 7, flexWrap: 'wrap' }}>
      {options.map((o) => {
        const on = value === o;
        return (
          <Pressable key={o} onPress={() => onChange(o)} style={{ height: 42, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1.5, borderColor: on ? C.primary : C.line, backgroundColor: on ? C.primaryTint : C.surface, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: on ? C.primaryPress : C.inkSoft, fontSize: 14, fontFamily: F.uiBold }}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Stepper({ value, onChange, min = 1, max = 6, suffix }) {
  const btn = (label, fn, dis) => (
    <Pressable onPress={dis ? undefined : fn} style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: dis ? C.paper2 : C.primaryTint, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: dis ? C.inkFaint : C.primaryPress, fontSize: 22, fontFamily: F.display }}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      {btn('−', () => onChange(value - 1), value <= min)}
      <Text style={{ minWidth: 70, textAlign: 'center', fontSize: 17, fontFamily: F.uiBold, color: C.ink }}>{value}{suffix ? ` ${suffix}${value > 1 ? 's' : ''}` : ''}</Text>
      {btn('+', () => onChange(value + 1), value >= max)}
    </View>
  );
}

export function ColorSwatches({ value, onChange }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {MED_COLORS.map((c) => (
        <Pressable key={c} onPress={() => onChange(c)} style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: c, alignItems: 'center', justifyContent: 'center', borderWidth: value === c ? 3 : 0, borderColor: C.paper }}>
          {value === c ? <Icon name="check" size={18} color="#fff" stroke={3} /> : null}
        </Pressable>
      ))}
    </View>
  );
}

// Free time picker: pick ANY reminder time (hour · minute · AM/PM), not just presets.
// Selected times show as removable chips; tapping "Add time" reveals an inline picker.
export function TimePicker({ times, onChange }) {
  const [open, setOpen] = useState(false);
  const [h, setH] = useState(9);      // 1..12
  const [min, setMin] = useState(0);  // 0..55 (5-min steps)
  const [ap, setAp] = useState('AM'); // 'AM' | 'PM'

  const wrap12 = (n) => ((n - 1 + 12) % 12) + 1;
  const label = fromMins(((h % 12) + (ap === 'PM' ? 12 : 0)) * 60 + min);

  const addTime = () => {
    if (!times.includes(label)) onChange([...times, label].sort((a, b) => toMins(a) - toMins(b)));
    setOpen(false);
  };
  const remove = (t) => onChange(times.filter((x) => x !== t));

  // horizontal [<] value [>] stepper (mirrors the meal-time control)
  const Roll = ({ value, onPrev, onNext, width = 58 }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Pressable onPress={onPrev} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: C.paper2, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="chevL" size={16} color={C.inkSoft} stroke={2.6} />
      </Pressable>
      <Text style={{ width, textAlign: 'center', fontSize: 22, fontFamily: F.uiHeavy, color: C.ink }}>{value}</Text>
      <Pressable onPress={onNext} style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: C.paper2, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="chevR" size={16} color={C.inkSoft} stroke={2.6} />
      </Pressable>
    </View>
  );

  return (
    <View style={{ gap: 10 }}>
      {/* selected times + add button */}
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {times.map((t) => (
          <Pressable key={t} onPress={() => remove(t)} style={{ height: 38, paddingLeft: 14, paddingRight: 9, borderRadius: 99, backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: '#fff', fontSize: 13, fontFamily: F.uiBold }}>{t}</Text>
            <View style={{ width: 18, height: 18, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="x" size={11} color="#fff" stroke={3} />
            </View>
          </Pressable>
        ))}
        <Pressable onPress={() => setOpen((o) => !o)} style={{ height: 38, paddingHorizontal: 14, borderRadius: 99, borderWidth: 1.5, borderColor: open ? C.primary : C.line, borderStyle: open ? 'solid' : 'dashed', backgroundColor: open ? C.primaryTint : C.surface, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Icon name="plus" size={14} color={C.primaryPress} stroke={2.8} />
          <Text style={{ color: C.primaryPress, fontSize: 13, fontFamily: F.uiBold }}>Add time</Text>
        </Pressable>
      </View>

      {/* inline free picker */}
      {open ? (
        <View style={{ borderRadius: 16, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.surface, padding: 14, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Roll value={h} onPrev={() => setH((v) => wrap12(v - 1))} onNext={() => setH((v) => wrap12(v + 1))} width={34} />
              <Text style={{ fontSize: 22, fontFamily: F.uiHeavy, color: C.inkFaint }}>:</Text>
              <Roll value={String(min).padStart(2, '0')} onPrev={() => setMin((v) => (v + 55) % 60)} onNext={() => setMin((v) => (v + 5) % 60)} width={40} />
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {['AM', 'PM'].map((x) => {
                const on = ap === x;
                return (
                  <Pressable key={x} onPress={() => setAp(x)} style={{ width: 46, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? C.primary : C.paper2 }}>
                    <Text style={{ color: on ? '#fff' : C.inkSoft, fontSize: 14, fontFamily: F.uiBold }}>{x}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <Pressable onPress={addTime} style={{ height: 44, borderRadius: 12, backgroundColor: C.primaryTint, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 }}>
            <Icon name="check" size={16} color={C.primaryPress} stroke={2.6} />
            <Text style={{ color: C.primaryPress, fontSize: 14.5, fontFamily: F.uiBold }}>Add {label}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export function Toggle({ on, onChange }) {
  return (
    <Pressable onPress={() => onChange(!on)} style={{ width: 50, height: 30, borderRadius: 99, backgroundColor: on ? C.sage : C.line, justifyContent: 'center' }}>
      <View style={{ width: 24, height: 24, borderRadius: 99, backgroundColor: '#fff', marginLeft: on ? 23 : 3, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 }} />
    </Pressable>
  );
}
