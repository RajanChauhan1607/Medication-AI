// services/secureStorage.js — storage for the Supabase auth session.
//
// Prefers expo-secure-store (hardware-backed Keystore on Android / Keychain on iOS), so the
// login token is encrypted at rest and far harder to read on a rooted/compromised device.
// Falls back to AsyncStorage automatically if SecureStore isn't available in the running
// build (so nothing breaks). SecureStore caps a value near 2KB, so large session blobs are
// transparently split into chunks.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const LIMIT = 1800;             // stay safely under SecureStore's ~2KB per-value cap
const MARK = '__chunks__:';     // prefix marking a chunked value (chunk count follows)

let _backend = null;            // 'secure' | 'async' — decided once, then cached
async function backend() {
  if (_backend) return _backend;
  let kind = 'async';
  try {
    const ok = SecureStore.isAvailableAsync ? await SecureStore.isAvailableAsync() : true;
    if (ok) {
      // confirm the native module actually works in this build
      await SecureStore.setItemAsync('__medira_probe__', '1');
      await SecureStore.deleteItemAsync('__medira_probe__');
      kind = 'secure';
    }
  } catch (_e) { kind = 'async'; }
  _backend = kind;
  return kind;
}

const sGet = async (k) => { try { return await SecureStore.getItemAsync(k); } catch (_e) { return null; } };
const sSet = async (k, v) => { try { await SecureStore.setItemAsync(k, v); } catch (_e) { /* */ } };
const sDel = async (k) => { try { await SecureStore.deleteItemAsync(k); } catch (_e) { /* */ } };
async function sClear(key) {
  const meta = await sGet(key);
  if (meta && meta.startsWith(MARK)) {
    const n = parseInt(meta.slice(MARK.length), 10) || 0;
    for (let i = 0; i < n; i++) await sDel(`${key}.${i}`);
  }
  await sDel(key);
}

export const SessionStorage = {
  getItem: async (key) => {
    if ((await backend()) === 'async') return AsyncStorage.getItem(key);
    const meta = await sGet(key);
    if (meta == null) return null;
    if (!meta.startsWith(MARK)) return meta;                // small value stored directly
    const n = parseInt(meta.slice(MARK.length), 10) || 0;
    let out = '';
    for (let i = 0; i < n; i++) {
      const part = await sGet(`${key}.${i}`);
      if (part == null) return null;                        // corrupted → treat as logged out
      out += part;
    }
    return out;
  },
  setItem: async (key, value) => {
    if ((await backend()) === 'async') return AsyncStorage.setItem(key, value);
    await sClear(key);                                       // clear any previous value/chunks
    if (value.length <= LIMIT) return sSet(key, value);
    const n = Math.ceil(value.length / LIMIT);
    await sSet(key, `${MARK}${n}`);
    for (let i = 0; i < n; i++) await sSet(`${key}.${i}`, value.slice(i * LIMIT, (i + 1) * LIMIT));
  },
  removeItem: async (key) => {
    if ((await backend()) === 'async') return AsyncStorage.removeItem(key);
    await sClear(key);
  },
};
