"use client";

// ============================================
// SKYLOG — Store Hydration Provider
// Loads persisted data from IndexedDB on mount
// Calculates offline earnings and shows welcome back
// ============================================

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import { usePlaneStore } from "@/stores/planeStore";
import { usePlayerStore } from "@/stores/playerStore";

const MIN_OFFLINE_FOR_REPORT = 5 * 60 * 1000; // 5 minutes

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    async function init() {
      // 1. Hydrate player first (need unlockedCities)
      await usePlayerStore.getState().hydrate();
      const unlockedCities = usePlayerStore.getState().unlockedCities;

      // 2. Hydrate planes (needs unlockedCities for route generation)
      await usePlaneStore.getState().hydrate(unlockedCities);

      // 3. Hydrate game state
      await useGameStore.getState().hydrate();

      // 4. Calculate offline earnings
      const lastOnline = usePlayerStore.getState().lastOnline;
      const offlineDuration = Date.now() - lastOnline;

      if (offlineDuration > MIN_OFFLINE_FOR_REPORT) {
        const { coins, flights } = usePlaneStore
          .getState()
          .processOfflineFlights(offlineDuration);

        if (coins > 0 || flights > 0) {
          usePlayerStore.getState().processOfflineReturn({
            offlineDuration,
            coinsEarned: coins,
            flightsCompleted: flights,
            newDiaries: [],
            events: [],
          });
          useGameStore.getState().setShowWelcomeBack(true);
        }
      }

      // 5. Update last online
      usePlayerStore.getState().updateLastOnline();

      // 6. Clean expired events
      useGameStore.getState().cleanExpiredEvents();

      setReady(true);
    }

    init().catch(console.error);
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-navy to-navy-light">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xl">
            <span className="text-3xl animate-bounce">✈</span>
          </div>
          <p className="text-skyblue-light text-sm animate-pulse">正在加载你的机场...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
