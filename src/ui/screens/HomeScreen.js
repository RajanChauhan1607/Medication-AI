// screens/HomeScreen.js — Today: greeting, progress ring, up-next, timeline.
import React, { useCallback } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { Avatar, SosPill } from '../components/common';
import { Ring, Chip, Card, Button, SectionLabel, MedBadge, IconChip, Toast, useToast, shadow } from '../components/ui';
import { C, F } from '../theme/colors';
import { useReka } from '../../state/store';
import { DOSE_STATE } from '../theme/colors';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [s, A] = useReka();
  const [msg, toast] = useToast();
  const doses = s.doses;
  const taken = doses.filter((d) => d.status === 'taken').length;
  const total = doses.length;
  const due = doses.find((d) => d.status === 'due');
  const pct = total ? taken / total : 0;
  const name = (s.settings.name || '').split(' ')[0];
  const now = new Date();
  const dateLabel = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();
  const h = now.getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

  const goMed = useCallback((medId) => navigation.navigate('MedDetail', { medId }), [navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <Toast msg={msg} />
      <View style={{ flex: 1 }}>
        <ScrollWrap topPad={insets.top + 8}>
          {/* top bar */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: C.inkFaint, fontFamily: F.uiBold, letterSpacing: 0.6 }}>{dateLabel}</Text>
              <Text style={{ fontFamily: F.display, fontSize: 26, letterSpacing: -0.3, color: C.deep, marginTop: 2 }}>{greeting}{name ? `, ${name}` : ''}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingTop: 2 }}>
              <SosPill onPress={() => navigation.navigate('Sos')} />
              <Avatar onPress={() => navigation.navigate('Settings')} />
            </View>
          </View>

          {/* hero progress card */}
          <Card style={{ marginTop: 18, padding: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
              <Ring value={pct} size={104} stroke={11} color={C.primary} track={C.paper2}>
                <Text style={{ fontFamily: F.display, fontSize: 26, color: C.deep }}>
                  {taken}<Text style={{ fontSize: 16, color: C.inkFaint }}>/{total}</Text>
                </Text>
                <Text style={{ fontSize: 11, color: C.inkFaint, fontFamily: F.uiBold, marginTop: 2 }}>doses</Text>
              </Ring>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17.5, fontFamily: F.uiHeavy, color: C.deep, letterSpacing: -0.2 }}>You're on track</Text>
                <Text style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 20, marginTop: 4, fontFamily: F.ui }}>{total - taken} doses left today. We'll remind you at the right time.</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                  <Chip icon="check" tint={C.sageTint} fg={C.sage} style={{ height: 28 }} textStyle={{ fontSize: 12.5 }}>{taken} taken</Chip>
                  <Chip icon="clock" tint={C.paper2} fg={C.inkSoft} style={{ height: 28 }} textStyle={{ fontSize: 12.5 }}>{total - taken} to go</Chip>
                </View>
              </View>
            </View>
          </Card>

          {/* empty state — no medicines yet */}
          {s.meds.length === 0 ? (
            <Card style={{ marginTop: 20, padding: 22, alignItems: 'center', gap: 10 }}>
              <IconChip icon="scan" size={52} />
              <Text style={{ fontFamily: F.uiHeavy, fontSize: 16.5, color: C.deep, marginTop: 4 }}>No medicines yet</Text>
              <Text style={{ fontSize: 13.5, color: C.inkSoft, textAlign: 'center', lineHeight: 20, fontFamily: F.ui }}>
                Scan a prescription and we'll set up your doses and reminders automatically.
              </Text>
              <Button icon="scan" onPress={() => navigation.navigate('Scan')} style={{ marginTop: 6 }}>Scan a prescription</Button>
            </Card>
          ) : null}

          {/* up next */}
          {due ? (
            <View style={{ marginTop: 20 }}>
              <SectionLabel>Up next</SectionLabel>
              <Card style={{ padding: 16, ...shadow('md') }}>
                <View style={{ position: 'absolute', top: 14, right: 14, zIndex: 1 }}>
                  <Chip icon="bell" style={{ height: 28 }} textStyle={{ fontSize: 12.5 }}>{due.time}</Chip>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
                  <MedBadge color={due.color} icon={due.icon} size={50} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontFamily: F.uiHeavy, color: C.deep, letterSpacing: -0.2 }}>{due.med} <Text style={{ color: C.inkFaint, fontFamily: F.uiMed, fontSize: 15 }}>{due.strength}</Text></Text>
                    <Text style={{ fontSize: 13.5, color: C.inkSoft, marginTop: 2, fontFamily: F.ui }}>{due.note}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
                  <Button size="md" icon="check" full={false} onPress={() => { A.markTaken(due.id); toast('Marked as taken — nice work', 'check'); }} style={{ flex: 1 }}>Mark as taken</Button>
                  <Button size="md" variant="soft" icon="snooze" full={false} onPress={() => { const sn = s.settings.snoozeMin || 30; A.snooze(due.id, sn); toast(`Snoozed ${sn} minutes`, 'snooze'); }}>{s.settings.snoozeMin || 30} min</Button>
                </View>
              </Card>
            </View>
          ) : null}

          {/* timeline schedule */}
          {doses.length > 0 ? (
          <View style={{ marginTop: 22, paddingBottom: 130 }}>
            <SectionLabel action="See all" onAction={() => navigation.navigate('Schedule')}>Today's schedule</SectionLabel>
            <View style={{ position: 'relative' }}>
              <View style={{ position: 'absolute', left: 59, top: 8, bottom: 8, width: 2, backgroundColor: C.paper2, borderRadius: 2 }} />
              <View style={{ gap: 10 }}>
                {doses.map((d) => <HomeDoseRow key={d.id} d={d} A={A} toast={toast} onOpen={goMed} />)}
              </View>
            </View>
          </View>
          ) : null}
        </ScrollWrap>
      </View>
    </View>
  );
}

const HomeDoseRow = React.memo(function HomeDoseRow({ d, A, toast, onOpen }) {
  const st = DOSE_STATE[d.status];
  const [t0, t1] = d.time.split(' ');
  return (
    <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 12 }}>
      <View style={{ width: 42, alignItems: 'flex-end', paddingTop: 16 }}>
        <Text style={{ fontSize: 13, fontFamily: F.uiHeavy, color: d.status === 'due' ? C.primary : C.inkSoft }}>{t0}</Text>
        <Text style={{ fontSize: 10.5, color: C.inkFaint, fontFamily: F.uiBold }}>{t1}</Text>
      </View>
      <View style={{ width: 12, alignItems: 'center', paddingTop: 18 }}>
        <View style={{ width: 12, height: 12, borderRadius: 99, backgroundColor: d.status === 'upcoming' ? C.paper : st.color, borderWidth: 2.5, borderColor: d.status === 'upcoming' ? C.line : st.color }} />
      </View>
      <Card pad={0} onPress={() => onOpen(d.medId)} style={{ flex: 1, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 11, opacity: d.status === 'skipped' ? 0.65 : 1 }}>
        <MedBadge color={d.color} icon={d.icon} size={38} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14.5, fontFamily: F.uiHeavy, color: C.deep, letterSpacing: -0.2 }}>{d.med} <Text style={{ color: C.inkFaint, fontFamily: F.uiMed, fontSize: 12.5 }}>{d.strength}</Text></Text>
          <Text style={{ fontSize: 12, color: C.inkSoft, marginTop: 1, fontFamily: F.ui }}>{d.note}</Text>
        </View>
        {d.status === 'taken' ? <IconChip icon="check" size={28} r={99} tint={C.sageTint} fg={C.sage} /> : null}
        {d.status === 'skipped' ? <Text style={{ fontSize: 12, fontFamily: F.uiHeavy, color: C.berry }}>Skipped</Text> : null}
        {d.status === 'due' ? (
          <Pressable onPress={() => { A.markTaken(d.id); toast('Marked as taken', 'check'); }} style={{ backgroundColor: C.primary, borderRadius: 10, height: 32, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 12.5, fontFamily: F.uiHeavy }}>Take</Text>
          </Pressable>
        ) : null}
        {d.status === 'upcoming' ? <Icon name="chevR" size={16} color={C.inkFaint} stroke={2.3} /> : null}
      </Card>
    </View>
  );
});

// local scroll wrapper that keeps the paper bg + horizontal padding
function ScrollWrap({ children, topPad }) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, paddingTop: topPad }}>
      {children}
    </ScrollView>
  );
}
