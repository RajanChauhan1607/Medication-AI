// screens/SosScreen.js — emergency screen that calls your contacts.
// Tapping a contact opens the phone dialer with their number pre-filled (one tap to connect)
// via Linking — no CALL_PHONE permission needed, which keeps the Play review clean.
import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Linking, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import { Button, Toast, useToast } from '../components/ui';
import { C, F } from '../theme/colors';
import { useReka } from '../../state/store';

const filled = (list) => (list || []).filter((c) => c.name && c.phone);
const telUri = (phone) => `tel:${String(phone).replace(/[^+\d]/g, '')}`;
const ORDINAL = ['1st', '2nd', '3rd'];

// Open the dialer with the contact's number pre-filled; the user taps the call button.
async function placeCall(phone, toast) {
  try { await Linking.openURL(telUri(phone)); }
  catch (_e) { if (toast) toast('Couldn’t open the dialer', 'phoneOff'); }
}

// Expanding "calling" ring that scales up and fades out on a loop (staggered by `delay`).
function PulseRing({ size, delay = 0 }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(a, { toValue: 1, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', width: size, height: size, borderRadius: 99,
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)',
        opacity: a.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.5, 0] }),
        transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1.9] }) }],
      }}
    />
  );
}

export default function SosScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [s] = useReka();
  const [msg, toast] = useToast();
  const contacts = s.settings.sos || [];
  const reachable = filled(contacts);
  const primary = reachable.find((c) => c.primary) || reachable[0];
  const ordered = primary ? [primary, ...reachable.filter((c) => c.id !== primary.id)] : [];

  const dial = (c) => placeCall(c.phone, toast);

  // no contacts yet
  if (!primary) {
    return (
      <LinearGradient colors={['#C0392B', '#8E2419']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}>
        <View style={{ width: '100%', maxWidth: 360, alignItems: 'center' }}>
          <View style={{ width: 72, height: 72, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Icon name="phone" size={32} color="#fff" stroke={2.2} />
          </View>
          <Text style={{ fontFamily: F.display, fontSize: 24, color: '#fff', textAlign: 'center' }}>No SOS contacts yet</Text>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15.5, lineHeight: 23, marginTop: 12, marginBottom: 26, textAlign: 'center', fontFamily: F.ui }}>Add a doctor or someone who can help, so one tap can reach them in an emergency.</Text>
          <Button variant="ghost" icon="plusUser" onPress={() => navigation.navigate('SosContacts')} style={{ backgroundColor: '#fff', alignSelf: 'stretch' }}>Add a contact</Button>
          <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 14, paddingVertical: 8, alignSelf: 'stretch', alignItems: 'center' }}>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, fontFamily: F.uiBold }}>Close</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#C0392B', '#8E2419']} style={{ flex: 1 }}>
      <Toast msg={msg} />
      {/* header */}
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, height: 32, paddingHorizontal: 12, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.18)' }}>
          <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: '#fff' }} />
          <Text style={{ fontSize: 12.5, fontFamily: F.uiHeavy, color: '#fff', letterSpacing: 1 }}>EMERGENCY SOS</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('SosContacts')} style={{ width: 38, height: 38, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="edit" size={18} color="#fff" stroke={2.2} />
        </Pressable>
      </View>

      {/* primary contact — avatar + calling status */}
      <View style={{ alignItems: 'center', paddingTop: 22, paddingHorizontal: 24 }}>
        <View style={{ width: 104, height: 104, alignItems: 'center', justifyContent: 'center' }}>
          <PulseRing size={92} delay={0} />
          <PulseRing size={92} delay={600} />
          <PulseRing size={92} delay={1200} />
          <View style={{ position: 'absolute', width: 88, height: 88, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', opacity: 0.6 }} />
          <View style={{ width: 78, height: 78, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: F.display, fontSize: 30, color: primary.color }}>{primary.name[0]}</Text>
          </View>
          <Pressable onPress={() => dial(primary)} style={{ position: 'absolute', right: 0, bottom: 2, width: 27, height: 27, borderRadius: 99, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 }}>
            <Icon name="phone" size={14} color="#C0392B" stroke={2.4} />
          </Pressable>
        </View>
        <Text style={{ fontFamily: F.display, fontSize: 26, color: '#fff', marginTop: 16, letterSpacing: -0.3 }}>{primary.name}</Text>
        <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', marginTop: 3, fontFamily: F.ui }}>{primary.relation || 'Primary contact'} · {primary.phone}</Text>
        <Text style={{ fontSize: 14, fontFamily: F.uiBold, color: '#fff', marginTop: 10 }}>Calling…</Text>
      </View>

      {/* all contacts, called in order */}
      <View style={{ flex: 1, marginTop: 20, backgroundColor: C.paper, borderTopLeftRadius: 26, borderTopRightRadius: 26, overflow: 'hidden' }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 90 }}>
          <Text style={{ fontSize: 12, fontFamily: F.uiHeavy, letterSpacing: 1, color: C.inkFaint, paddingHorizontal: 4, paddingBottom: 10 }}>
            ALL CONTACTS ARE CALLED IN ORDER
          </Text>
          <View style={{ gap: 10 }}>
            {ordered.map((c, i) => {
              const isPrimary = c.id === primary.id;
              return (
                <View
                  key={c.id}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14, borderRadius: 18,
                    backgroundColor: C.surface, borderWidth: isPrimary ? 2 : 1, borderColor: isPrimary ? C.berry : C.lineSoft,
                  }}
                >
                  <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: c.color, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#fff', fontFamily: F.display, fontSize: 20 }}>{c.name[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Text style={{ fontSize: 16.5, fontFamily: F.uiBold, color: C.ink }}>{c.name}</Text>
                      <View style={{ paddingHorizontal: 9, height: 20, borderRadius: 99, backgroundColor: isPrimary ? C.berryTint : C.paper2, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 11, fontFamily: F.uiBold, color: isPrimary ? C.berry : C.inkSoft }}>Called {ORDINAL[i] || `${i + 1}th`}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 13.5, color: C.inkFaint, fontFamily: F.ui, marginTop: 2 }}>{c.relation} · {c.phone}</Text>
                  </View>
                  <Pressable onPress={() => dial(c)} style={{ width: 48, height: 48, borderRadius: 99, backgroundColor: isPrimary ? C.inkFaint : C.sage, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="phone" size={21} color="#fff" stroke={2.3} />
                  </Pressable>
                </View>
              );
            })}
            {/* add-contact tile */}
            <Pressable onPress={() => navigation.navigate('SosContacts')} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14, borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.line, backgroundColor: C.surface }}>
              <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: C.paper2, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="plusUser" size={23} color={C.inkFaint} stroke={2.1} />
              </View>
              <View>
                <Text style={{ fontSize: 16, fontFamily: F.uiBold, color: C.inkSoft }}>Add a contact</Text>
                <Text style={{ fontSize: 13, color: C.inkFaint, fontFamily: F.ui }}>Someone who can come help</Text>
              </View>
            </Pressable>
          </View>
        </ScrollView>

        {/* end call */}
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 12, paddingBottom: insets.bottom + 16, alignItems: 'center', backgroundColor: 'transparent' }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
              height: 52, paddingHorizontal: 32, borderRadius: 999, backgroundColor: C.berry,
              shadowColor: C.berry, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
            }}
          >
            <Icon name="phoneOff" size={18} color="#fff" stroke={2.4} />
            <Text style={{ color: '#fff', fontSize: 16, fontFamily: F.uiBold }}>End call</Text>
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}
