// screens/SettingsScreen.js — profile + reminders/meds/emergency/about rows.
import React from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../components/Icon';
import { PageHeader } from '../components/common';
import { Card, SectionLabel, Toast, useToast } from '../components/ui';
import { C, F } from '../theme/colors';
import { useReka } from '../../state/store';
import { TUNES } from '../../state/tunes';
import { signOut } from '../../backend/auth';
import { openBatteryOptimizationSettings } from '../../backend/alarm';
import { PRIVACY_URL, TERMS_URL, SUPPORT_EMAIL } from '../../config/legal';

function Row({ icon, label, detail, onPress, last, danger }) {
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: last ? 0 : 1, borderBottomColor: C.lineSoft }}>
      <Icon name={icon} size={19} color={danger ? C.berry : C.primary} stroke={2.1} />
      <Text style={{ flex: 1, fontSize: 15, fontFamily: F.uiMed, color: danger ? C.berry : C.ink }}>{label}</Text>
      {detail ? <Text style={{ fontSize: 13.5, color: C.inkFaint, fontFamily: F.uiMed }}>{detail}</Text> : null}
      {onPress ? <Icon name="chevR" size={16} color={C.inkFaint} stroke={2.2} /> : null}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{body}</Pressable> : body;
}

export default function SettingsScreen({ navigation }) {
  const [s, A] = useReka();
  const [msg, toast] = useToast();
  const tune = TUNES.find((t) => t.id === s.settings.defaultTune) || TUNES[0];
  const sosSet = (s.settings.sos || []).filter((c) => c.name && c.phone).length;

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <Toast msg={msg} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}>
        <PageHeader title="Settings" onBack={() => navigation.goBack()} />

        {/* profile */}
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20, padding: 16 }}>
          <LinearGradient colors={['#E9C3A0', '#D98C6A']} start={{ x: 0, y: 0 }} end={{ x: 0.85, y: 1 }} style={{ width: 56, height: 56, borderRadius: 99, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontFamily: F.display, fontSize: 24 }}>{(s.settings.name || 'M')[0].toUpperCase()}</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <TextInput value={s.settings.name} onChangeText={(t) => A.setName(t)} style={{ fontFamily: F.display, fontSize: 20, color: C.ink, padding: 0 }} />
            <Text style={{ fontSize: 12.5, color: C.inkFaint, fontFamily: F.ui }}>{s.meds.length} active medications</Text>
          </View>
          <Icon name="edit" size={17} color={C.inkFaint} stroke={2} />
        </Card>

        <SectionLabel>Reminders</SectionLabel>
        <Card pad={0} style={{ marginBottom: 20 }}>
          <Row icon="bell" label="Default alarm sound" detail={tune.name} onPress={() => navigation.navigate('AlarmSound', { mode: 'default' })} />
          <Row icon="clock" label="Snooze length" detail={`${s.settings.snoozeMin || 30} min`} onPress={() => navigation.navigate('Snooze')} />
          <Row icon="bolt" label="Alarm reliability" detail="Battery settings" onPress={() => openBatteryOptimizationSettings()} last />
        </Card>

        <SectionLabel>Medications</SectionLabel>
        <Card pad={0} style={{ marginBottom: 20 }}>
          <Row icon="plus" label="Add medication manually" onPress={() => navigation.navigate('ManualEntry')} />
          <Row icon="scan" label="Scan a prescription" onPress={() => navigation.navigate('Scan')} last />
        </Card>

        <SectionLabel>Emergency</SectionLabel>
        <Card pad={0} style={{ marginBottom: 20 }}>
          <Row icon="phone" label="SOS contacts" detail={`${sosSet} set`} onPress={() => navigation.navigate('SosContacts')} danger last />
        </Card>

        <SectionLabel>About</SectionLabel>
        <Card pad={0} style={{ marginBottom: 20 }}>
          <Row icon="shield" label="Privacy & data" onPress={() => Linking.openURL(PRIVACY_URL)} />
          <Row icon="doc" label="Terms of Service" onPress={() => Linking.openURL(TERMS_URL)} />
          <Row icon="info" label="Help & support" detail={SUPPORT_EMAIL} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} last />
        </Card>

        <Card pad={0} style={{ marginBottom: 30 }}>
          <Row icon="x" label="Sign out" danger last onPress={async () => { await signOut(); }} />
        </Card>
      </ScrollView>
    </View>
  );
}
