"use client";

// ============================================
// SKYLOG — Game Loop Hook
// Ticks flights, updates time, saves periodically
// ============================================

import { useEffect, useRef } from "react";
import { useGameStore } from "@/stores/gameStore";
import { usePlaneStore } from "@/stores/planeStore";
import { usePlayerStore } from "@/stores/playerStore";

const TICK_INTERVAL = 1000;           // 1 second
const SAVE_INTERVAL = 30_000;         // 30 seconds
const AUTO_FLIGHT_START_INTERVAL = 5_000; // 5 seconds

export function useGameLoop() {
  const lastTickRef = useRef(Date.now());
  const lastSaveRef = useRef(Date.now());
  const lastAutoStartRef = useRef(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const isPaused = useGameStore.getState().isPaused;
      if (isPaused) return;

      const deltaMs = now - lastTickRef.current;
      lastTickRef.current = now;

      // 1. Update real-time clock (day/night cycle)
      useGameStore.getState().updateTime();

      // 2. Tick all flights
      const completed = usePlaneStore.getState().tickFlights(deltaMs);

      // 3. Add revenue for completed flights
      if (completed.length > 0) {
        let totalRevenue = 0;
        for (const { revenue } of completed) {
          totalRevenue += revenue;
        }
        usePlayerStore.getState().addCoins(totalRevenue);
        usePlayerStore.getState().addExp(completed.length * 5);
      }

      // 4. Auto-start flights for idle planes with routes
      if (now - lastAutoStartRef.current > AUTO_FLIGHT_START_INTERVAL) {
        lastAutoStartRef.current = now;
        const planes = usePlaneStore.getState().planes;
        for (const plane of planes) {
          if (
            plane.assignedRoute &&
            (plane.flightStatus === "idle" || plane.flightStatus === "arrived") &&
            plane.mood > 10
          ) {
            usePlaneStore.getState().startFlight(plane.instanceId);
          }
        }
      }

      // 5. Periodic save
      if (now - lastSaveRef.current > SAVE_INTERVAL) {
        lastSaveRef.current = now;
        usePlayerStore.getState().updateLastOnline();
      }
    }, TICK_INTERVAL);

    // Save on tab close / visibility change
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        usePlayerStore.getState().updateLastOnline();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);
}
