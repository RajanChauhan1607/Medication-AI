// screens/ScanScreen.js — live camera viewfinder for capturing a prescription.
// Real CameraView (expo-camera); the captured photo is downscaled to 1280px and sent
// to Processing as base64. Gallery import + manual-entry shortcuts are kept.
import React, { useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import Icon from '../components/Icon';
import { Button, Toast, useToast } from '../components/ui';
import { C, F } from '../theme/colors';
import { pickPrescriptionImage } from '../../backend/extract';

export default function ScanScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const camRef = useRef(null);
  const [perm, requestPerm] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, toast] = useToast();

  // capture a photo, downscale to 1280px wide, hand the base64 to Processing
  const shoot = async () => {
    if (!camRef.current || busy) return;
    setBusy(true);
    try {
      const photo = await camRef.current.takePictureAsync({ quality: 0.7 });
      const out = await manipulateAsync(photo.uri, [{ resize: { width: 1280 } }], { compress: 0.8, base64: true, format: SaveFormat.JPEG });
      navigation.replace('Processing', { base64: out.base64, mime: 'image/jpeg', scannedAt: Date.now() });
    } catch (e) {
      toast(String(e.message || e), 'x');
      setBusy(false);
    }
  };

  // pick an existing photo from the gallery instead
  const fromGallery = async () => {
    try {
      const img = await pickPrescriptionImage(false);
      if (!img) return;
      navigation.replace('Processing', { base64: img.base64, mime: img.mime, scannedAt: Date.now() });
    } catch (e) {
      toast(String(e.message || e), 'x');
    }
  };

  // Figma corner guides are thin open brackets (not filled rounded borders) —
  // each corner is just two short straight segments meeting at the corner.
  const corner = (x, y) => ({
    position: 'absolute', width: 22, height: 22,
    [x ? 'right' : 'left']: -1, [y ? 'bottom' : 'top']: -1,
    borderTopWidth: y ? 0 : 2.5, borderBottomWidth: y ? 2.5 : 0,
    borderLeftWidth: x ? 0 : 2.5, borderRightWidth: x ? 2.5 : 0, borderColor: '#fff',
    ...(x && y ? { borderBottomRightRadius: 7 } : x ? { borderTopRightRadius: 7 } : y ? { borderBottomLeftRadius: 7 } : { borderTopLeftRadius: 7 }),
  });

  // ── permission states ───────────────────────────────────────────
  if (!perm) {
    return <View style={{ flex: 1, backgroundColor: '#14110F', alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#fff" /></View>;
  }
  if (!perm.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: '#14110F', paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <View style={{ width: 72, height: 72, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="camera" size={34} color="#fff" stroke={2} />
        </View>
        <Text style={{ color: '#fff', fontFamily: F.display, fontSize: 22, textAlign: 'center' }}>Camera access needed</Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14.5, textAlign: 'center', lineHeight: 21, fontFamily: F.ui }}>
          Medication AI uses your camera to scan your prescription. Your photo is used only to read it, and isn't stored.
        </Text>
        <View style={{ height: 6 }} />
        <Button icon="camera" onPress={requestPerm} style={{ backgroundColor: C.primary }}>Allow camera</Button>
        <Pressable onPress={fromGallery} style={{ paddingVertical: 10 }}>
          <Text style={{ color: '#fff', fontSize: 14.5, fontFamily: F.uiBold }}>Choose from gallery instead</Text>
        </Pressable>
        <Pressable onPress={() => navigation.goBack()} style={{ paddingVertical: 6 }}>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontFamily: F.uiMed }}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  // ── live viewfinder ─────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#14110F' }}>
      <Toast msg={msg} />
      <CameraView ref={camRef} style={{ flex: 1 }} facing="back" enableTorch={torch} />

      {/* top bar */}
      <View style={{ position: 'absolute', top: insets.top + 8, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 }}>
        <Pressable onPress={() => navigation.goBack()} style={{ width: 38, height: 38, borderRadius: 99, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="x" size={20} color="#fff" stroke={2.4} />
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, height: 34, paddingHorizontal: 13, borderRadius: 99, backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <Icon name="sparkle" size={15} color="#FFD9A0" stroke={2} />
          <Text style={{ color: '#fff', fontSize: 12.5, fontFamily: F.uiMed }}>Lay it flat & fill the frame</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* framing guide */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: '78%', aspectRatio: 0.72 }}>
          <View style={corner(0, 0)} />
          <View style={corner(1, 0)} />
          <View style={corner(0, 1)} />
          <View style={corner(1, 1)} />
        </View>
      </View>

      {/* bottom stack: status label above the manual-entry shortcut (kept clear of each other) */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 112, alignItems: 'center', gap: 14 }}>
        <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, fontFamily: F.uiMed, textAlign: 'center' }}>Detecting prescription pad…</Text>
        <Pressable onPress={() => navigation.navigate('ManualEntry')} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, height: 38, paddingHorizontal: 16, borderRadius: 99, backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <Icon name="edit" size={15} color="#fff" stroke={2.2} />
          <Text style={{ color: '#fff', fontSize: 13.5, fontFamily: F.uiBold }}>Type it in instead</Text>
        </Pressable>
      </View>

      {/* controls */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 36, paddingBottom: insets.bottom + 30 }}>
        <Pressable onPress={fromGallery} style={{ width: 50, height: 50, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="image" size={22} color="#fff" stroke={2} />
        </Pressable>
        <Pressable onPress={shoot} disabled={busy} style={{ width: 78, height: 78, borderRadius: 99, borderWidth: 4, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center' }}>
          {busy ? <ActivityIndicator color="#14110F" /> : <View style={{ width: 60, height: 60, borderRadius: 99, backgroundColor: '#fff' }} />}
        </Pressable>
        <Pressable onPress={() => setTorch((t) => !t)} style={{ width: 50, height: 50, borderRadius: 14, backgroundColor: torch ? 'rgba(255,220,150,0.9)' : 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="bolt" size={22} color={torch ? '#7a5a10' : '#fff'} stroke={2} />
        </Pressable>
      </View>
    </View>
  );
}
