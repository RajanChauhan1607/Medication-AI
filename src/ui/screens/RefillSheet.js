// screens/RefillSheet.js — "your medicine is running out" → see your doctor.
// Shows the run-out date and lets the user set a reminder + add a calendar event.
import React, { useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { C, F } from '../theme/colors';
import { runOutDate, daysLeft, scheduleVisitReminder, addVisitToCalendar } from '../../backend/doctorVisit';

const fmt = (d) => d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

function ActionRow({ icon, label, sub, onPress, busy }) {
  return (
    <Pressable onPress={busy ? undefined : onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 15, borderRadius: 16, borderWidth: 1.5, borderColor: C.lineSoft, backgroundColor: C.surface, opacity: busy ? 0.6 : 1 }}>
      <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: C.primaryTint, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={20} color={C.primaryPress} stroke={2.1} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontFamily: F.uiBold, color: C.ink }}>{label}</Text>
        {sub ? <Text style={{ fontSize: 12.5, color: C.inkFaint, fontFamily: F.ui, marginTop: 1 }}>{sub}</Text> : null}
      </View>
      <Icon name="chevR" size={16} color={C.inkFaint} stroke={2.2} />
    </Pressable>
  );
}

export default function RefillSheet({ med, onClose }) {
  const insets = useSafeAreaInsets();
  const open = !!med;
  const runOut = med ? runOutDate(med) : null;
  const left = med ? daysLeft(med) : null;
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState('');

  const remind = async () => {
    if (!runOut) return;
    setBusy('remind'); setStatus('');
    try {
      const { fireDate, granted } = await scheduleVisitReminder(med, runOut);
      setStatus(granted ? `Reminder set for ${fmt(fireDate)} — we'll nudge you to book a visit.` : 'Enable notifications to get the reminder.');
    } catch (e) { setStatus(String(e.message || e)); }
    finally { setBusy(''); }
  };
  const calendar = async () => {
    if (!runOut) return;
    setBusy('cal'); setStatus('');
    try {
      const start = await addVisitToCalendar(med, runOut);
      setStatus(`Added to your calendar on ${fmt(start)}.`);
    } catch (e) { setStatus(String(e.message || e)); }
    finally { setBusy(''); }
  };

  const headline = !runOut
    ? 'This medicine is ongoing'
    : left <= 0 ? `${med.name} has run out`
      : left <= 3 ? `${med.name} runs out in ${left} day${left === 1 ? '' : 's'}`
        : `${med.name} runs out on ${fmt(runOut)}`;

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(20,17,15,0.45)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: C.paper, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingBottom: insets.bottom + 16, paddingHorizontal: 20, paddingTop: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontFamily: F.display, fontSize: 21, color: C.ink, letterSpacing: -0.3 }}>Refill & doctor visit</Text>
            <Pressable onPress={onClose} style={{ width: 34, height: 34, borderRadius: 99, backgroundColor: C.paper2, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="x" size={18} color={C.inkSoft} stroke={2.4} />
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', gap: 11, alignItems: 'flex-start', backgroundColor: (left != null && left <= 3) ? C.berryTint : C.sageTint, borderRadius: 14, padding: 14, marginBottom: 16 }}>
            <Icon name={(left != null && left <= 3) ? 'bell' : 'calendar'} size={19} color={(left != null && left <= 3) ? C.berry : '#4F7A4C'} stroke={2.2} />
            <Text style={{ flex: 1, fontSize: 14, lineHeight: 20, color: C.ink, fontFamily: F.uiMed }}>
              {headline}.{runOut ? ' We recommend seeing your doctor for a repeat prescription before then.' : ' It has no fixed end date, so there’s no run-out reminder to set.'}
            </Text>
          </View>

          {runOut ? (
            <View style={{ gap: 10 }}>
              <ActionRow icon="bell" label="Remind me to see the doctor" sub="A notification a couple of days before it runs out" onPress={remind} busy={busy === 'remind'} />
              <ActionRow icon="calendar" label="Add to my calendar" sub="Creates a doctor-visit event on your phone" onPress={calendar} busy={busy === 'cal'} />
            </View>
          ) : null}

          {status ? <Text style={{ fontSize: 13, color: C.inkSoft, fontFamily: F.uiMed, marginTop: 14, textAlign: 'center', lineHeight: 19 }}>{status}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}
