// ============================================
// SKYLOG — IndexedDB Persistence via idb-keyval
// Zustand middleware for auto-save/load
// ============================================

import { get, set, del } from "idb-keyval";
import type { StateCreator, StoreMutatorIdentifier } from "zustand";

const DB_PREFIX = "skylog_";
const SAVE_DEBOUNCE = 1000; // ms

type Persist = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  f: StateCreator<T, Mps, Mcs>,
  name: string,
) => StateCreator<T, Mps, Mcs>;

type PersistImpl = <T>(
  f: StateCreator<T, [], []>,
  name: string,
) => StateCreator<T, [], []>;

/** Filter out functions from state for serialization */
function getSerializableState<T extends Record<string, unknown>>(state: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key in state) {
    if (typeof state[key] !== "function") {
      result[key] = state[key];
    }
  }
  return result;
}

const persistImpl: PersistImpl = (f, name) => (setState, getState, store) => {
  const key = DB_PREFIX + name;
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  // Wrap setState to auto-save on every change
  const originalSetState = store.setState;
  store.setState = (...args: Parameters<typeof originalSetState>) => {
    originalSetState(...args);

    // Debounced save to IndexedDB
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const current = getState() as Record<string, unknown>;
      const serializable = getSerializableState(current);
      set(key, serializable).catch((err) => {
        console.warn(`[SKYLOG] Failed to save ${name}:`, err);
      });
    }, SAVE_DEBOUNCE);
  };

  return f(setState, getState, store);
};

export const persist = persistImpl as Persist;

/** Load saved state from IndexedDB */
export async function loadState<T>(name: string): Promise<Partial<T> | null> {
  try {
    const key = DB_PREFIX + name;
    const data = await get<Partial<T>>(key);
    return data ?? null;
  } catch (err) {
    console.warn(`[SKYLOG] Failed to load ${name}:`, err);
    return null;
  }
}

/** Force save current state */
export async function saveState<T extends Record<string, unknown>>(
  name: string,
  state: T,
): Promise<void> {
  const key = DB_PREFIX + name;
  const serializable = getSerializableState(state);
  await set(key, serializable);
}

/** Clear all saved data (for dev/reset) */
export async function clearAllSaves(): Promise<void> {
  const keys = ["player", "planes", "game"];
  await Promise.all(keys.map((k) => del(DB_PREFIX + k)));
}
