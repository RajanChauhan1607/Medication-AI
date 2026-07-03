// App.js — Medication AI root. Loads fonts, gates on the auth session, sets up navigation.
import React, { useEffect, useRef } from 'react';
import { View, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableFreeze } from 'react-native-screens';
import { useFonts } from 'expo-font';

// freeze off-screen screens — inactive tabs/stack screens stop re-rendering on store
// changes, so navigation and scrolling stay smooth and the app does less work.
enableFreeze(true);
import { Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { Figtree_400Regular, Figtree_600SemiBold, Figtree_700Bold, Figtree_800ExtraBold } from '@expo-google-fonts/figtree';
import { Caveat_600SemiBold } from '@expo-google-fonts/caveat';

import { C } from './src/ui/theme/colors';
import MainTabs from './src/ui/navigation/MainTabs';
import { useReka } from './src/state/store';
import {
  scheduleAllAlarms, requestAlarmPermission, registerAlarmBackgroundHandler,
  registerAlarmForegroundHandler, drainPendingActions,
} from './src/backend/alarm';
import { useSession } from './src/backend/auth';
import { useCloudSync } from './src/backend/cloudsync';

// Notifee background handler — must be registered at module scope (handles Taken/Snooze
// taps while the app is backgrounded or killed). No-op in Expo Go.
registerAlarmBackgroundHandler();

import BatteryPrompt from './src/ui/components/BatteryPrompt';
import LoginScreen from './src/ui/screens/LoginScreen';
import ProfileScreen from './src/ui/screens/ProfileScreen';
import MealTimesScreen from './src/ui/screens/MealTimesScreen';
import WelcomeScreen from './src/ui/screens/WelcomeScreen';
import ScanScreen from './src/ui/screens/ScanScreen';
import ProcessingScreen from './src/ui/screens/ProcessingScreen';
import ResultsScreen from './src/ui/screens/ResultsScreen';
import MedDetailScreen from './src/ui/screens/MedDetailScreen';
import ManualEntryScreen from './src/ui/screens/ManualEntryScreen';
import AlarmSoundScreen from './src/ui/screens/AlarmSoundScreen';
import SnoozeScreen from './src/ui/screens/SnoozeScreen';
import EditReminderScreen from './src/ui/screens/EditReminderScreen';
import SettingsScreen from './src/ui/screens/SettingsScreen';
import SosScreen from './src/ui/screens/SosScreen';
import SosContactsScreen from './src/ui/screens/SosContactsScreen';

// Reminder engine, app-wide. Schedules looping medicine alarms (Notifee) from the store
// and routes Taken/Snooze taps back to the store (incl. taps queued while backgrounded).
// navigation ref so the reminder bridge can jump to the Home tab from a notification tap
export const navigationRef = createNavigationContainerRef();

function RemindersBridge() {
  const [s, A] = useReka();
  // Snooze → bump the whole grouped alarm. Taken → send the user to Home, where they tick
  // off each medicine they actually took (one alarm now covers several meds).
  const apply = useRef(() => {});
  apply.current = (action, data) => {
    if (action === 'snooze') { A.reminderAction('snooze', data); return; }
    if (action === 'taken' && navigationRef.isReady()) {
      navigationRef.navigate('Main', { screen: 'Home' });
    }
  };
  const lastKey = useRef('');

  // foreground action handling + drain anything queued from background/cold taps
  useEffect(() => {
    requestAlarmPermission();
    const onAct = (action, data) => apply.current(action, data);
    const unsub = registerAlarmForegroundHandler(onAct);
    drainPendingActions(onAct);
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') drainPendingActions(onAct); });
    return () => { unsub && unsub(); sub.remove(); };
  }, []);

  // (re)schedule alarms whenever the schedule-relevant fields or snooze length change
  useEffect(() => {
    const key = JSON.stringify({
      meds: (s.meds || []).map((m) => [m.id, m.remindersOn !== false, (m.times || []).join('|'), m.tune, m.strength, m.instruction, m.name]),
      snoozeMin: s.settings.snoozeMin,
      defaultTune: s.settings.defaultTune,
    });
    if (key === lastKey.current) return;
    lastKey.current = key;
    scheduleAllAlarms(s.meds, s.settings.snoozeMin, s.settings.defaultTune).catch(() => {});
  }, [s.meds, s.settings.snoozeMin, s.settings.defaultTune]);

  return null;
}

const Stack = createNativeStackNavigator();

export default function App() {
  const [loaded] = useFonts({
    Outfit_600SemiBold, Outfit_700Bold,
    Figtree_400Regular, Figtree_600SemiBold, Figtree_700Bold, Figtree_800ExtraBold,
    Caveat_600SemiBold,
  });
  const session = useSession(); // undefined = loading, null = logged out, object = logged in
  useCloudSync(session);        // load user data on login, mirror changes to the cloud
  const [st] = useReka();       // store — for the hydration gate + onboarding decision

  // splash while fonts/auth resolve, and (when signed in) until the user's data loads
  if (!loaded || session === undefined || (session && !st.hydrated)) {
    return <View style={{ flex: 1, backgroundColor: C.deep }} />;
  }

  // a signed-in user who hasn't set their age yet still needs the quick onboarding
  const needsOnboarding = !!session && !st.settings.age;
  const initialRoute = session ? (needsOnboarding ? 'Profile' : 'Main') : 'Login';

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {session ? <RemindersBridge /> : null}
      {session ? <BatteryPrompt /> : null}
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.paper } }}>
          {session ? (
            <Stack.Group>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen name="Scan" component={ScanScreen} options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
              <Stack.Screen name="Processing" component={ProcessingScreen} options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="Results" component={ResultsScreen} options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="MedDetail" component={MedDetailScreen} />
              <Stack.Screen name="ManualEntry" component={ManualEntryScreen} />
              <Stack.Screen name="AlarmSound" component={AlarmSoundScreen} />
              <Stack.Screen name="Snooze" component={SnoozeScreen} />
              <Stack.Screen name="EditReminder" component={EditReminderScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="Sos" component={SosScreen} options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
              <Stack.Screen name="SosContacts" component={SosContactsScreen} />
              {/* onboarding screens kept registered so Settings/profile flows can reach them */}
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="MealTimes" component={MealTimesScreen} />
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
            </Stack.Group>
          ) : (
            <Stack.Group>
              <Stack.Screen name="Login" component={LoginScreen} />
            </Stack.Group>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
