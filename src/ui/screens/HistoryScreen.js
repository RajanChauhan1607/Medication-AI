// screens/HistoryScreen.js — adherence summary + past scans (real user data).
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import Icon from '../components/Icon';
import { DeepHeader } from '../components/common';
import { Card, SectionLabel, IconChip } from '../components/ui';
import { C, F } from '../theme/colors';
import { useReka } from '../../state/store';

// last 14 calendar days, oldest first, with a short month/day label for the ends.
function last14Days() {
  const out = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    out.push({ key: d.toDateString(), isToday: i === 0, label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) });
  }
  return out;
}

export default function HistoryScreen({ navigation }) {
  const [s] = useReka();
  const history = s.history || [];
  const doses = s.doses || [];
  const taken = doses.filter((d) => d.status === 'taken').length;
  const accounted = doses.filter((d) => d.status === 'taken' || d.status === 'skipped').length;
  const todayPct = accounted ? Math.round((taken / accounted) * 100) : null;
  const days = last14Days();

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <DeepHeader bottom={20}>
          <Text style={{ fontFamily: F.display, fontSize: 24, color: '#fff', letterSpacing: -0.3 }}>History</Text>
          <View style={{ flexDirection: 'row', gap: 11, marginTop: 14 }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 13 }}>
              <Text style={{ fontFamily: F.display, fontSize: 26, color: C.mint }}>{todayPct == null ? '—' : `${todayPct}%`}</Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontFamily: F.uiBold }}>on time · today</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 13 }}>
              <Text style={{ fontFamily: F.display, fontSize: 26, color: '#fff' }}>{history.length}</Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontFamily: F.uiBold }}>prescriptions scanned</Text>
            </View>
          </View>
        </DeepHeader>

        <View style={{ paddingHorizontal: 18, paddingTop: 18 }}>
          <SectionLabel>Last 14 days</SectionLabel>
          <Card style={{ padding: 13, marginBottom: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 44 }}>
              {days.map((d) => {
                // only today has real per-dose accounting; other days have no stored history yet.
                const barTaken = d.isToday && accounted ? taken / accounted : null;
                const h = barTaken == null ? 14 : Math.max(14, Math.round(barTaken * 44));
                const color = d.isToday ? (barTaken == null ? C.line : barTaken >= 0.8 ? C.primary : C.amber) : C.lineSoft;
                return <View key={d.key} style={{ flex: 1, height: h, borderRadius: 3, backgroundColor: color }} />;
              })}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
              <Text style={{ fontSize: 10.5, color: C.inkFaint, fontFamily: F.uiBold }}>{days[0].label}</Text>
              <Text style={{ fontSize: 10.5, color: C.inkFaint, fontFamily: F.uiBold }}>Today</Text>
            </View>
          </Card>

          <SectionLabel>Past scans</SectionLabel>
          {history.length === 0 ? (
            <Card style={{ padding: 22, alignItems: 'center', gap: 8 }}>
              <IconChip icon="doc" size={46} />
              <Text style={{ fontFamily: F.uiBold, fontSize: 15, color: C.ink, marginTop: 4 }}>No scans yet</Text>
              <Text style={{ fontSize: 13, color: C.inkSoft, textAlign: 'center', lineHeight: 19, fontFamily: F.ui }}>
                Every prescription you scan is saved here with its date, so you can look it up anytime.
              </Text>
            </Card>
          ) : (
            <View style={{ gap: 10 }}>
              {history.map((h) => (
                <Card key={h.id} pad={13} onPress={() => navigation.navigate('Results', h.detected ? { detected: h.detected } : undefined)} style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
                  <IconChip icon="doc" size={44} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontFamily: F.uiHeavy, color: C.deep }}>{h.title || 'Prescription'}</Text>
                    <Text style={{ fontSize: 12.5, color: C.inkSoft, fontFamily: F.ui }}>
                      {[h.doctor, h.date, `${h.meds} medicine${h.meds === 1 ? '' : 's'}`].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <Icon name="chevR" size={18} color={C.inkFaint} stroke={2.3} />
                </Card>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
