// screens/MedsScreen.js — 2-column medication grid on a deep-teal header.
import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Icon from '../components/Icon';
import { DeepHeader } from '../components/common';
import { Chip, Card, MedBadge, IconChip } from '../components/ui';
import { C, F } from '../theme/colors';
import { useReka } from '../../state/store';
import { daysLeft } from '../../backend/doctorVisit';

export default function MedsScreen({ navigation }) {
  const [s] = useReka();
  const goMed = (id) => navigation.navigate('MedDetail', { medId: id });
  const onAdd = () => navigation.navigate('Scan');

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <DeepHeader bottom={20}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontFamily: F.display, fontSize: 24, color: '#fff', letterSpacing: -0.3 }}>My medicines</Text>
              <Text style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.65)', marginTop: 2, fontFamily: F.ui }}>{s.meds.length} active</Text>
            </View>
            <Pressable onPress={onAdd} style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="plus" size={23} color={C.deep} stroke={2.6} />
            </Pressable>
          </View>
        </DeepHeader>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 18, paddingTop: 16, gap: 12 }}>
          {s.meds.map((m) => {
            const onCourse = m.courseDay != null;
            const dleft = daysLeft(m);
            const lowStock = dleft != null && dleft <= 5;
            return (
              <Card key={m.id} pad={14} onPress={() => goMed(m.id)} style={{ width: '47%', flexGrow: 1, gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <MedBadge color={m.color} icon="pill" size={44} />
                  {lowStock ? <Chip tint={C.berryTint} fg={C.berry} style={{ height: 24, paddingHorizontal: 9 }} textStyle={{ fontSize: 11 }}>{dleft <= 0 ? 'Ran out' : `${dleft}d left`}</Chip> : null}
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontFamily: F.uiHeavy, color: C.deep, letterSpacing: -0.2 }}>{m.name}</Text>
                  <Text style={{ fontSize: 12.5, fontFamily: F.uiBold, color: C.primary, marginTop: 1 }}>{m.strength} · {m.form}</Text>
                  <Text style={{ fontSize: 12, color: C.inkSoft, marginTop: 4, lineHeight: 17, fontFamily: F.ui }}>{m.schedule}</Text>
                </View>
                {onCourse ? (
                  <View>
                    <Text style={{ fontSize: 11, fontFamily: F.uiBold, color: C.inkFaint, marginBottom: 4 }}>Day {m.courseDay}/{m.courseTotal}</Text>
                    <View style={{ height: 6, borderRadius: 99, backgroundColor: C.paper2, overflow: 'hidden' }}>
                      <View style={{ width: `${(m.courseDay / m.courseTotal) * 100}%`, height: '100%', backgroundColor: m.color, borderRadius: 99 }} />
                    </View>
                  </View>
                ) : (m.times || []).length ? (
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, alignSelf: 'stretch', backgroundColor: C.paper2, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 9 }}>
                    <View style={{ paddingTop: 1 }}>
                      <Icon name="clock" size={14} color={C.inkSoft} stroke={2.4} />
                    </View>
                    <Text style={{ flex: 1, fontSize: 11.5, fontFamily: F.uiBold, color: C.inkSoft, lineHeight: 16 }}>{(m.times || []).join(' · ')}</Text>
                  </View>
                ) : null}
              </Card>
            );
          })}
          {/* add tile */}
          <Pressable onPress={onAdd} style={{ width: '47%', flexGrow: 1, minHeight: 150, borderRadius: 20, borderWidth: 2, borderColor: C.line, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <IconChip icon="plus" size={42} />
            <Text style={{ fontSize: 13.5, fontFamily: F.uiBold, color: C.primaryPress }}>Add medicine</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
