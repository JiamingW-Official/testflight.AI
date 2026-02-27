"use client";

// ============================================
// SKYLOG — Diary Generation Hook
// Triggers diary generation, manages loading state
// ============================================

import { useState, useCallback } from "react";
import { usePlaneStore } from "@/stores/planeStore";
import { useGameStore } from "@/stores/gameStore";
import { CITIES } from "@/data/cities";
import type { Plane, Diary } from "@/types";

interface UseDiaryReturn {
  generateDiary: (plane: Plane) => Promise<Diary | null>;
  isGenerating: boolean;
}

export function useDiary(): UseDiaryReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const addDiary = usePlaneStore((s) => s.addDiary);

  const generateDiary = useCallback(async (plane: Plane): Promise<Diary | null> => {
    if (isGenerating) return null;
    setIsGenerating(true);

    try {
      const dayPhase = useGameStore.getState().dayPhase;

      // Resolve route city names
      let routeFrom: string | undefined;
      let routeTo: string | undefined;
      if (plane.assignedRoute) {
        const routes = usePlaneStore.getState().routes;
        const route = routes.find((r) => r.id === plane.assignedRoute);
        if (route) {
          const fromCity = CITIES.find((c) => c.id === route.from);
          const toCity = CITIES.find((c) => c.id === route.to);
          routeFrom = fromCity?.name;
          routeTo = toCity?.name;
        }
      }

      const res = await fetch("/api/diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planeId: plane.instanceId,
          nickname: plane.nickname,
          personality: plane.personality,
          mood: plane.mood,
          bond: plane.bond,
          level: plane.level,
          totalFlights: plane.totalFlights,
          routeFrom,
          routeTo,
          dayPhase,
        }),
      });

      if (!res.ok) {
        console.warn("[SKYLOG] Diary API error:", res.status);
        return null;
      }

      const data = await res.json();
      const diary: Diary = data.diary;

      // Add to store
      addDiary(plane.instanceId, diary);

      return diary;
    } catch (err) {
      console.error("[SKYLOG] Diary generation failed:", err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, addDiary]);

  return { generateDiary, isGenerating };
}
