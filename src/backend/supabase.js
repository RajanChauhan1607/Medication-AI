// services/supabase.js — the Supabase client for the Medication AI app (project: medira).
// Single source of truth for the URL + key, with React-Native session persistence.
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { SessionStorage } from './secureStorage';

export const SUPABASE_URL = 'https://bjxhnkwgtnkxyotzdzcw.supabase.co';
// publishable key — safe to ship; RLS + the server-side AI key do the real protection
export const SUPABASE_ANON_KEY = 'sb_publishable_ZXkAUu3AaCNGc1qXaMCR1w_LDC_lrfn';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: SessionStorage,        // hardware-encrypted (SecureStore) with AsyncStorage fallback
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,      // RN has no URL to parse
  },
});
