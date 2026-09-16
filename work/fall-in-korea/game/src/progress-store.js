export const SAVE_KEY = 'fall-in-korea-save-v4';
const LEGACY_KEYS = ['dodam-workshop-save-v3', 'morning-merge-save-v2', 'morning-merge-save-v1'];

// Read native storage before starting the game. A failed read must never be
// mistaken for a new player and overwritten with a fresh game.
export async function createProgressStore({storage, preferences} = {}) {
  let raw = preferences ? (await preferences.get({key: SAVE_KEY})).value : null;
  if (!raw) {
    try {
      for (const key of [SAVE_KEY, ...LEGACY_KEYS]) {
        raw = storage?.getItem(key);
        if (raw) break;
      }
    } catch { /* Browser storage can be restricted. */ }
  }
  let pending = Promise.resolve();
  return {
    raw,
    save(value) {
      let browserError;
      try { storage?.setItem(SAVE_KEY, value); } catch (error) { browserError = error; }
      if (!preferences) return browserError ? Promise.reject(browserError) : Promise.resolve();
      // Preserve write order even when several merges happen in quick succession.
      pending = pending.catch(() => {}).then(() => preferences.set({key: SAVE_KEY, value}));
      return pending;
    },
    flush() { return pending; },
  };
}
