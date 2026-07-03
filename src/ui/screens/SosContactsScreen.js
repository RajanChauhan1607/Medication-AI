// screens/SosContactsScreen.js — manage up to 3 emergency contacts + call order.
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { Card, Button, Toast, useToast } from '../components/ui';
import { C, F } from '../theme/colors';
import { useReka } from '../../state/store';

function SosField({ label, value, onChange, placeholder, keyboardType, last }) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ marginBottom: last ? 0 : 11 }}>
      <Text style={{ fontSize: 12.5, fontFamily: F.uiBold, color: C.inkFaint, marginBottom: 5 }}>{label}</Text>
      <TextInput
        value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={C.inkFaint} keyboardType={keyboardType}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{ height: 48, borderRadius: 13, borderWidth: 1.5, borderColor: focus ? C.primary : C.line, backgroundColor: C.surfaceWarm, paddingHorizontal: 14, fontSize: 16, fontFamily: F.ui, color: C.ink }}
      />
    </View>
  );
}

export default function SosContactsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [s, A] = useReka();
  const [msg, toast] = useToast();
  const contacts = s.settings.sos;

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <Toast msg={msg} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: insets.top + 6, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Pressable onPress={() => navigation.goBack()} style={{ width: 40, height: 40, borderRadius: 99, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="chevL" size={20} color={C.inkSoft} stroke={2.3} />
          </Pressable>
          <Text style={{ fontFamily: F.display, fontSize: 23, letterSpacing: -0.4, color: C.ink }}>SOS contacts</Text>
        </View>
        <Text style={{ fontSize: 14.5, color: C.inkSoft, marginHorizontal: 2, marginBottom: 18, lineHeight: 22, fontFamily: F.ui }}>
          When you press SOS, <Text style={{ color: C.ink, fontFamily: F.uiBold }}>all 3 contacts are called in order</Text>. Choose who's first — if they don't answer, the next is dialled automatically.
        </Text>

        <View style={{ gap: 16 }}>
          {contacts.map((c, i) => {
            const reachable = c.name && c.phone;
            return (
              <Card key={c.id} style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 14 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.kind === 'doctor' ? C.primaryTint : C.sageTint, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={c.kind === 'doctor' ? 'stethoscope' : 'user'} size={21} color={c.kind === 'doctor' ? C.primaryPress : '#4F7A4C'} stroke={2.1} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15.5, fontFamily: F.uiHeavy, color: C.ink }}>
                      {c.kind === 'doctor' ? 'Doctor' : `Contact ${i + 1}`}
                      {c.kind !== 'doctor' ? <Text style={{ color: C.inkFaint, fontFamily: F.uiMed }}> · optional</Text> : null}
                    </Text>
                  </View>
                  <Pressable onPress={() => reachable && A.setSosPrimary(c.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 13, borderRadius: 99, borderWidth: c.primary ? 0 : 1.5, borderColor: C.line, backgroundColor: c.primary ? C.berry : C.surface, opacity: reachable ? 1 : 0.45 }}>
                    {c.primary ? <Icon name="check" size={14} color="#fff" stroke={2.8} /> : null}
                    <Text style={{ color: c.primary ? '#fff' : C.inkSoft, fontSize: 13, fontFamily: F.uiBold }}>{c.primary ? 'Called first' : 'Call first'}</Text>
                  </Pressable>
                </View>
                <SosField label="Name" value={c.name} placeholder={c.kind === 'doctor' ? 'Dr. Name' : 'Full name'} onChange={(v) => A.setSosContact(c.id, { name: v })} />
                <SosField label={c.kind === 'doctor' ? 'Clinic / role' : 'Relationship'} value={c.relation} placeholder={c.kind === 'doctor' ? 'e.g. Family doctor' : 'e.g. Daughter, Neighbour'} onChange={(v) => A.setSosContact(c.id, { relation: v })} />
                <SosField label="Phone number" value={c.phone} placeholder="+91 98765 43210" keyboardType="phone-pad" onChange={(v) => A.setSosContact(c.id, { phone: v })} last />
              </Card>
            );
          })}
          <Button icon="check" onPress={() => { toast('SOS contacts saved', 'check'); setTimeout(() => navigation.goBack(), 500); }}>Save contacts</Button>
        </View>
      </ScrollView>
    </View>
  );
}
