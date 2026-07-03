// screens/ResultsScreen.js — review the AI-extracted medicines, then add to plan.
// Each card shows the AI's read confidence (sage = high, berry = needs a look) and
// every medicine stays editable via Review regardless of confidence.
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { Chip, Card, Button, MedBadge } from '../components/ui';
import { C, F, MED_COLORS } from '../theme/colors';
import { useReka, uuid } from '../../state/store';
import { persistScan } from '../../backend/repository';
import ReviewMedSheet from './ReviewMedSheet';

export default function ResultsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [, actions] = useReka();
  const [celebrate, setCelebrate] = useState(false);

  // AI result handed over from Processing (empty if opened without a scan). Held in
  // state so Review edits and removals are reflected before saving.
  const [meds, setMeds] = useState(route?.params?.detected || []);
  const [editIdx, setEditIdx] = useState(-1);
  const [adding, setAdding] = useState(false); // true while adding a brand-new medicine inline

  // a blank medicine to seed the review sheet when adding manually from this screen
  const blankMed = () => ({
    id: uuid(), name: '', strength: '', form: 'Tablet', per_day: '1-0-0',
    instruction: 'after food', duration: '', confidence: 0.95,
    color: MED_COLORS[meds.length % MED_COLORS.length], source: 'manual',
  });

  const doctorName = route?.params?.doctor || '';
  const scannedAt = route?.params?.scannedAt || Date.now();
  const scannedDate = new Date(scannedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  const onSaveEdit = (card) => {
    if (adding) setMeds((list) => [...list, card]);
    else setMeds((list) => list.map((m, i) => (i === editIdx ? card : m)));
    setEditIdx(-1);
    setAdding(false);
  };
  const closeSheet = () => { setEditIdx(-1); setAdding(false); };
  const [draft, setDraft] = useState(null); // seeded blank med while adding
  const openAdd = () => { setDraft(blankMed()); setAdding(true); };
  const removeAt = (idx) => setMeds((list) => list.filter((_, i) => i !== idx));

  const onConfirm = () => {
    if (!meds.length) return;
    // tag each med with the scan time → today's pre-scan doses are marked taken automatically
    meds.forEach((m) => actions.addMed({ ...m, startedAt: scannedAt }));
    const clinic = route?.params?.clinic || '';
    actions.addScanRecord({
      id: uuid(),
      title: clinic || doctorName || 'Prescription',
      doctor: doctorName,
      date: scannedDate,
      meds: meds.length,
      detected: meds,
      scannedAt,
    });
    persistScan({ doctor: doctorName, clinic, detected: meds, medCount: meds.length, scannedAt }).catch(() => {});
    setCelebrate(true);
    setTimeout(() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] }), 1700);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, paddingTop: insets.top + 8, paddingBottom: 110 }}>
        {/* header — status pill absolutely centred on screen; X / Add pinned to the edges */}
        <View style={{ height: 38, justifyContent: 'center' }}>
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center' }}>
            <Chip icon="checkCircle" tint={C.sageTint} fg="#4F7A4C" style={{ height: 34 }}>Scan complete</Chip>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Pressable onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })} style={{ width: 38, height: 38, borderRadius: 99, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="x" size={19} color={C.inkSoft} stroke={2.3} />
            </Pressable>
            <Pressable onPress={openAdd} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 38, paddingHorizontal: 14, borderRadius: 99, backgroundColor: C.primaryTint }}>
              <Icon name="plus" size={16} color={C.primaryPress} stroke={2.6} />
              <Text style={{ color: C.primaryPress, fontSize: 13.5, fontFamily: F.uiBold }}>Add</Text>
            </Pressable>
          </View>
        </View>
        <Text style={{ fontFamily: F.display, fontSize: 27, letterSpacing: -0.6, color: C.ink, marginTop: 16 }}>We found <Text style={{ color: C.primary }}>{meds.length} medication{meds.length === 1 ? '' : 's'}</Text></Text>
        {meds.length > 0 ? (
          <Text style={{ fontSize: 13.5, color: C.inkSoft, marginTop: 6, lineHeight: 19, fontFamily: F.ui }}>
            {doctorName ? `From Dr. ${doctorName}'s prescription · ${scannedDate}. ` : `Scanned · ${scannedDate}. `}
            Missing one? <Text onPress={() => navigation.navigate('ManualEntry')} style={{ color: C.primary, fontFamily: F.uiBold }}>Add it manually</Text>.
          </Text>
        ) : null}

        {meds.length === 0 ? (
          <Card style={{ padding: 20, marginTop: 20, alignItems: 'center', gap: 6 }}>
            <Text style={{ fontFamily: F.uiBold, fontSize: 15, color: C.ink }}>No medicines detected</Text>
            <Text style={{ fontSize: 13, color: C.inkSoft, textAlign: 'center', fontFamily: F.ui }}>Try a clearer photo, or tap “Add” to enter them by hand.</Text>
          </Card>
        ) : null}

        {/* cards */}
        <View style={{ gap: 13, marginTop: 18 }}>
          {meds.map((m, idx) => (
            <Card key={m.id || idx} style={{ padding: 16, borderWidth: 1.5, borderColor: C.lineSoft }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 13 }}>
                <MedBadge color={m.color} icon="pill" size={48} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                    <Text style={{ fontSize: 18, fontFamily: F.uiHeavy, color: C.ink, letterSpacing: -0.2 }}>{m.name}</Text>
                    {m.strength ? <Text style={{ fontSize: 15, fontFamily: F.uiBold, color: m.color }}>{m.strength}</Text> : null}
                  </View>
                  <Text style={{ fontSize: 12.5, color: C.inkFaint, marginTop: 1, fontFamily: F.ui }}>{m.purpose || m.form || 'Medicine'}</Text>
                </View>
              </View>
              {/* attribute chips */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 13 }}>
                <Chip icon="clock">{m.frequency}</Chip>
                <Chip icon="calendar">{m.duration}</Chip>
                <Chip icon={m.instrIcon}>{m.instruction}</Chip>
              </View>
              {/* actions */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, paddingTop: 13, borderTopWidth: 1, borderTopColor: C.lineSoft }}>
                <Pressable onPress={() => setEditIdx(idx)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, height: 40, borderRadius: 12, backgroundColor: C.primaryTint }}>
                  <Icon name="edit" size={16} color={C.primaryPress} stroke={2.3} />
                  <Text style={{ color: C.primaryPress, fontFamily: F.uiBold, fontSize: 14 }}>Review</Text>
                </Pressable>
                <Pressable onPress={() => removeAt(idx)} style={{ width: 44, height: 40, borderRadius: 12, borderWidth: 1.5, borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="x" size={17} color={C.berry} stroke={2.4} />
                </Pressable>
              </View>
            </Card>
          ))}
        </View>

        {/* subtle AI fallibility note — kept low-key at the bottom */}
        {meds.length > 0 ? (
          <View style={{ flexDirection: 'row', gap: 7, alignItems: 'flex-start', marginTop: 18, paddingHorizontal: 2 }}>
            <Icon name="info" size={14} color={C.inkFaint} stroke={2} />
            <Text style={{ flex: 1, fontSize: 11.5, lineHeight: 16, color: C.inkFaint, fontFamily: F.ui }}>
              AI can occasionally misread handwriting — please check each medicine and dose before saving.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* confirm bar */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 18, paddingTop: 14, paddingBottom: insets.bottom + 14, backgroundColor: C.paper }}>
        <Button icon="check" onPress={onConfirm} style={{ opacity: meds.length ? 1 : 0.5 }}>Add all to my plan</Button>
      </View>

      {/* review / edit sheet (also used to add a new medicine inline).
          key remounts the sheet per target so its fields always seed from the current med. */}
      <ReviewMedSheet key={adding ? 'add' : editIdx} med={adding ? draft : editIdx >= 0 ? meds[editIdx] : null} onSave={onSaveEdit} onClose={closeSheet} />

      {/* success overlay */}
      {celebrate ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.deep, alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <View style={{ width: 98, height: 98, borderRadius: 99, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={52} color={C.deep} stroke={2.7} />
          </View>
          <View style={{ alignItems: 'center', paddingHorizontal: 40 }}>
            <Text style={{ fontFamily: F.display, fontSize: 26, color: '#fff', letterSpacing: -0.3 }}>Plan added!</Text>
            <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', marginTop: 7, lineHeight: 22, textAlign: 'center', fontFamily: F.ui }}>Your medicines are saved and alarms are set around your meals.</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}
