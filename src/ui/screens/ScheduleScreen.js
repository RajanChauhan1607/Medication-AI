// screens/ScheduleScreen.js — week strip + doses grouped Morning/Afternoon/Evening.
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { DeepHeader } from '../components/common';
import { Card, MedBadge, IconChip, Toast, useToast } from '../components/ui';
import { C, F } from '../theme/colors';
import { useReka } from '../../state/store';
import { DOSE_STATE } from '../theme/colors';

function periodOf(mins) { return mins < 720 ? 'Morning' : mins < 1020 ? 'Afternoon' : 'Evening'; }
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function ScheduleScreen({ navigation }) {
  const [s] = useReka();
  const [msg] = useToast();
  const groups = ['Morning', 'Afternoon', 'Evening']
    .map((p) => ({ p, icon: p === 'Morning' ? 'sun' : p === 'Afternoon' ? 'food' : 'moon', items: s.doses.filter((d) => periodOf(d.mins) === p) }))
    .filter((g) => g.items.length);

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <Toast msg={msg} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <DeepHeader bottom={20}>
          <Text style={{ fontFamily: F.display, fontSize: 24, color: '#fff', letterSpacing: -0.3 }}>Schedule</Text>
          <View style={{ flexDirection: 'row', gap: 7, marginTop: 14 }}>
            {DAYS.map((d, i) => {
              const today = i === 5;
              return (
                <View key={i} style={{ flex: 1, height: 56, borderRadius: 14, backgroundColor: today ? C.mint : 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  <Text style={{ fontSize: 10.5, fontFamily: F.uiHeavy, color: today ? C.deep : 'rgba(255,255,255,0.6)' }}>{d}</Text>
                  <Text style={{ fontSize: 15.5, fontFamily: F.uiHeavy, color: today ? C.deep : '#fff' }}>{2 + i}</Text>
                </View>
              );
            })}
          </View>
        </DeepHeader>

        <View style={{ paddingHorizontal: 18, paddingTop: 18 }}>
          {groups.map((g) => (
            <View key={g.p} style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 2, paddingBottom: 11 }}>
                <IconChip icon={g.icon} size={32} r={10} />
                <Text style={{ fontFamily: F.display, fontSize: 16, color: C.deep }}>{g.p}</Text>
                <Text style={{ fontSize: 12.5, color: C.inkFaint, marginLeft: 'auto', fontFamily: F.uiBold }}>{g.items.length} doses</Text>
              </View>
              <View style={{ gap: 9 }}>
                {g.items.map((d) => {
                  const st = DOSE_STATE[d.status];
                  const [t0, t1] = d.time.split(' ');
                  return (
                    <Card key={d.id} pad={12} onPress={() => navigation.navigate('MedDetail', { medId: d.medId })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, opacity: d.status === 'skipped' ? 0.65 : 1 }}>
                      <View style={{ width: 52, alignItems: 'center' }}>
                        <Text style={{ fontSize: 14.5, fontFamily: F.uiHeavy, color: C.deep }}>{t0}</Text>
                        <Text style={{ fontSize: 10, fontFamily: F.uiBold, color: C.inkFaint }}>{t1}</Text>
                      </View>
                      <View style={{ width: 2, height: 30, backgroundColor: C.paper2, borderRadius: 2 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14.5, fontFamily: F.uiHeavy, color: C.deep }}>{d.med}</Text>
                        <Text style={{ fontSize: 12, color: C.inkSoft, fontFamily: F.ui }}>{d.note}</Text>
                      </View>
                      <IconChip icon={st.icon} size={32} r={99} tint={st.tint} fg={st.color} />
                    </Card>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
