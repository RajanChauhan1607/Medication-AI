// screens/MedDetailScreen.js — hero, today's doses, course ring, details, source.
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { Ring, Card, Button, SectionLabel, Toast, useToast } from '../components/ui';
import { C, F } from '../theme/colors';
import { useReka } from '../../state/store';
import { runOutDate, daysLeft } from '../../backend/doctorVisit';
import RefillSheet from './RefillSheet';

export default function MedDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [s, A] = useReka();
  const [msg, toast] = useToast();
  const medId = route.params?.medId;
  const m = s.meds.find((x) => x.id === medId) || s.meds[0];
  const myDoses = s.doses.filter((d) => d.medId === m.id);
  const onCourse = m.courseDay != null;
  const isScan = m.from !== 'Manual entry';
  const [refillOpen, setRefillOpen] = useState(false);
  const runOut = runOutDate(m);
  const left = daysLeft(m);

  const details = [
    ['Dose', m.dose, 'pill'],
    ['How often', m.freqShort ? `${m.frequency} (${m.freqShort})` : m.frequency, 'clock'],
    ['Duration', m.duration, 'calendar'],
    ['Instructions', m.instruction, m.instrIcon],
    ...(runOut ? [['Runs out', runOut.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }), 'refill']] : []),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <Toast msg={msg} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* hero */}
        <LinearGradient colors={[m.color, m.color + 'DD']} start={{ x: 0.2, y: 0 }} end={{ x: 0.9, y: 1 }} style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, paddingBottom: 26 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Pressable onPress={() => navigation.goBack()} style={{ width: 38, height: 38, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="chevL" size={19} color="#fff" stroke={2.4} />
            </Pressable>
            <Pressable onPress={() => navigation.navigate('EditReminder', { medId: m.id })} style={{ width: 38, height: 38, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="edit" size={18} color="#fff" stroke={2.2} />
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16 }}>
            <View style={{ width: 60, height: 60, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="pill" size={32} color={m.color} stroke={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.display, fontSize: 27, color: '#fff', letterSpacing: -0.6 }}>{m.name}</Text>
              <Text style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.9)', marginTop: 2, fontFamily: F.ui }}>{m.strength} · {m.form} · {m.purpose}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 18, paddingTop: 18 }}>
          {/* running-out → see the doctor */}
          {left != null && left <= 5 ? (
            <Pressable onPress={() => setRefillOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: left <= 3 ? C.berryTint : C.amberTint, borderRadius: 16, padding: 14, marginBottom: 16 }}>
              <Icon name="refill" size={20} color={left <= 3 ? C.berry : C.amber} stroke={2.2} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14.5, fontFamily: F.uiBold, color: C.ink }}>{left <= 0 ? 'This medicine has run out' : `Running low — ${left} day${left === 1 ? '' : 's'} left`}</Text>
                <Text style={{ fontSize: 12.5, color: C.inkSoft, fontFamily: F.ui, marginTop: 1 }}>Tap to plan a doctor visit for a repeat prescription</Text>
              </View>
              <Icon name="chevR" size={16} color={C.inkFaint} stroke={2.2} />
            </Pressable>
          ) : null}

          {/* today */}
          <SectionLabel>Today</SectionLabel>
          <Card pad={6}>
            {(myDoses.length ? myDoses : [{ id: 'x', time: m.times[0] || '—', status: 'upcoming' }]).map((d, i, arr) => {
              const taken = d.status === 'taken';
              const skipped = d.status === 'skipped';
              return (
                <Pressable key={d.id} onPress={() => { if (!taken && d.id !== 'x') { A.markTaken(d.id); toast('Marked as taken', 'check'); } }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 11, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: C.lineSoft }}>
                  <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: taken ? C.sageTint : skipped ? C.berryTint : C.paper2, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={taken ? 'check' : skipped ? 'x' : 'clock'} size={16} color={taken ? C.sage : skipped ? C.berry : C.inkFaint} stroke={2.5} />
                  </View>
                  <Text style={{ flex: 1, fontSize: 14.5, fontFamily: F.uiMed, color: C.ink }}>{d.time}</Text>
                  <Text style={{ fontSize: 12.5, fontFamily: F.uiHeavy, color: taken ? C.sage : skipped ? C.berry : C.primary }}>{taken ? 'Taken' : skipped ? 'Skipped' : 'Tap to take'}</Text>
                </Pressable>
              );
            })}
          </Card>

          {/* course progress */}
          {onCourse ? (
            <View style={{ marginTop: 20 }}>
              <SectionLabel>Course progress</SectionLabel>
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <Ring value={m.courseDay / m.courseTotal} size={76} stroke={9} color={m.color}>
                    <Text style={{ fontFamily: F.display, fontSize: 19, color: C.ink }}>{m.courseDay}</Text>
                    <Text style={{ fontSize: 9.5, color: C.inkFaint, fontFamily: F.uiBold }}>of {m.courseTotal}</Text>
                  </Ring>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontFamily: F.uiBold, color: C.ink }}>{m.courseTotal - m.courseDay} days to go</Text>
                    <Text style={{ fontSize: 13, color: C.inkSoft, lineHeight: 19, marginTop: 3, fontFamily: F.ui }}>Keep going until your course is complete, as advised by your doctor.</Text>
                  </View>
                </View>
              </Card>
            </View>
          ) : null}

          {/* details */}
          <View style={{ marginTop: 20 }}>
            <SectionLabel>Details</SectionLabel>
            <Card pad={0}>
              {details.map(([k, v, ic], i) => (
                <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 15, borderBottomWidth: i < details.length - 1 ? 1 : 0, borderBottomColor: C.lineSoft }}>
                  <Icon name={ic} size={18} color={m.color} stroke={2} />
                  <Text style={{ fontSize: 13.5, color: C.inkSoft, flex: 1, fontFamily: F.ui }}>{k}</Text>
                  <Text style={{ fontSize: 14.5, fontFamily: F.uiBold, color: C.ink }}>{v}</Text>
                </View>
              ))}
            </Card>
          </View>

          {/* source */}
          <View style={{ marginTop: 20 }}>
            <SectionLabel>Source</SectionLabel>
            <Card onPress={isScan ? () => navigation.navigate('Results') : undefined} style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: C.paper2, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={isScan ? 'doc' : 'edit'} size={22} color={C.inkSoft} stroke={1.9} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14.5, fontFamily: F.uiBold, color: C.ink }}>{isScan ? 'Scanned prescription' : 'Added manually'}</Text>
                <Text style={{ fontSize: 12.5, color: C.inkFaint, fontFamily: F.ui }}>{m.from} · {m.scanned}{isScan ? ', 2026' : ''}</Text>
              </View>
              {isScan ? <Icon name="chevR" size={18} color={C.inkFaint} stroke={2.3} /> : null}
            </Card>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 22 }}>
            <Button variant="ghost" icon="bell" full={false} onPress={() => navigation.navigate('EditReminder', { medId: m.id })} style={{ flex: 1 }}>Edit reminders</Button>
            <Button variant="soft" icon="refill" full={false} onPress={() => setRefillOpen(true)}>Refill</Button>
          </View>
        </View>
      </ScrollView>

      <RefillSheet med={refillOpen ? m : null} onClose={() => setRefillOpen(false)} />
    </View>
  );
}
