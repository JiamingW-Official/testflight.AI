"use client";

// ============================================
// SKYLOG — Game Loop Hook
// Ticks flights, updates time, saves periodically
// ============================================

import { useEffect, useRef } from "react";
import { useGameStore } from "@/stores/gameStore";
import { usePlaneStore } from "@/stores/planeStore";
import { usePlayerStore } from "@/stores/playerStore";
import { useStoryStore } from "@/stores/storyStore";
import { CITIES } from "@/data/cities";

const TICK_INTERVAL = 1000;           // 1 second
const SAVE_INTERVAL = 30_000;         // 30 seconds
const AUTO_FLIGHT_START_INTERVAL = 5_000; // 5 seconds
const STORY_CHECK_INTERVAL = 60_000;  // check for story every 60 seconds

export function useGameLoop() {
  const lastTickRef = useRef(Date.now());
  const lastSaveRef = useRef(Date.now());
  const lastAutoStartRef = useRef(Date.now());
  const lastStoryCheckRef = useRef(Date.now());
  const flightsCompletedSinceStoryRef = useRef(0);

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
        flightsCompletedSinceStoryRef.current += completed.length;
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

      // 5. Periodic story trigger (after enough flights completed)
      if (
        now - lastStoryCheckRef.current > STORY_CHECK_INTERVAL &&
        flightsCompletedSinceStoryRef.current >= 3 &&
        !useStoryStore.getState().pendingStory
      ) {
        lastStoryCheckRef.current = now;
        flightsCompletedSinceStoryRef.current = 0;

        // Pick a random airborne plane to generate a story for
        const planes = usePlaneStore.getState().planes;
        const airborne = planes.filter((p) => p.flightStatus === "airborne");
        if (airborne.length > 0) {
          const plane = airborne[Math.floor(Math.random() * airborne.length)];
          const route = usePlaneStore
            .getState()
            .routes.find((r) => r.id === plane.assignedRoute);
          if (route) {
            const fromCity = CITIES.find((c) => c.id === route.from)?.name ?? route.from;
            const toCity = CITIES.find((c) => c.id === route.to)?.name ?? route.to;
            fetch("/api/story", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fromCity,
                toCity,
                planeNickname: plane.nickname,
                planeId: plane.instanceId,
                routeId: route.id,
                dayPhase: useGameStore.getState().dayPhase,
                flightNumber: plane.totalFlights,
              }),
            })
              .then((res) => res.json())
              .then((data) => {
                const s = data?.story;
                if (s && s.choices) {
                  useStoryStore.getState().addStory(s);
                  useStoryStore.getState().setPendingStory(s);
                }
              })
              .catch(() => {});
          }
        }
      }

      // 6. Periodic save
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
