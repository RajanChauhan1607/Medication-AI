// services/cloudsync.js — keeps the local store mirrored to the medira cloud DB.
// Mount once near the app root with the current session:  useCloudSync(session)
//   • on login            -> loads the user's data and hydrates the store
//   • on app foreground    -> re-fetches so data is up to date across devices
//   • on change            -> debounced save back to the DB (RLS scopes everything to the user)
//   • on logout            -> clears the store
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { subscribe, getState, actions } from '../state/store';
import { fetchAll, saveAll } from './repository';

export function useCloudSync(session) {
  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) {
      actions.hydrate({ meds: [], profile: null, sos: null, history: [] }); // clear on logout
      return;
    }

    let ready = false;     // don't save until the initial load finishes (avoids wiping the DB)
    let timer = null;      // debounced save timer
    let dirty = false;     // a local change is waiting to save — don't overwrite it with a refetch
    let applying = false;  // we're applying a fetch result — ignore the resulting store event
    let cancelled = false;

    const load = (gate) => {
      if (gate) actions.beginLoad();
      return fetchAll(uid)
        .then((data) => {
          if (cancelled) return;
          applying = true;
          actions.hydrate(data);
          // Google gives us a name even before the profile row catches up — use it.
          if (!data.profile?.full_name) {
            const meta = session?.user?.user_metadata || {};
            const gName = meta.full_name || meta.name || '';
            if (gName) actions.setName(gName);
          }
          applying = false;
          ready = true;
        })
        .catch((e) => {
          if (cancelled) return;
          console.warn('cloud load failed:', e?.message);
          if (gate) { applying = true; actions.hydrate({ meds: [], profile: null, sos: null, history: [] }); applying = false; }
          ready = true;
        });
    };

    load(true); // initial load (gates the UI until data lands)

    const unsub = subscribe(() => {
      if (!ready || applying) return; // ignore store events caused by our own hydrate
      dirty = true;
      clearTimeout(timer);
      timer = setTimeout(() => {
        dirty = false;
        saveAll(uid, getState()).catch((e) => console.warn('cloud save failed:', e?.message));
      }, 700);
    });

    // refresh from the cloud whenever the app returns to the foreground (so data stays current
    // across devices and days) — but never while a local change is still waiting to save.
    const onAppState = (st) => {
      if (st === 'active' && ready && !dirty && !cancelled) load(false);
    };
    const appSub = AppState.addEventListener('change', onAppState);

    return () => { cancelled = true; clearTimeout(timer); unsub(); appSub.remove(); };
  }, [session?.user?.id]);
}
