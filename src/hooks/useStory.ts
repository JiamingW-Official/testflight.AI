"use client";

// ============================================
// SKYLOG — Story Generation Hook
// Triggers story creation, manages loading
// ============================================

import { useState, useCallback } from "react";
import { useStoryStore } from "@/stores/storyStore";
import { usePlayerStore } from "@/stores/playerStore";
import { useGameStore } from "@/stores/gameStore";
import { usePlaneStore } from "@/stores/planeStore";
import { CITIES } from "@/data/cities";
import { generateButterflyEffects } from "@/lib/ai/storyPrompts";
import type { Plane, PassengerStory } from "@/types";

interface UseStoryReturn {
  generateStory: (plane: Plane) => Promise<PassengerStory | null>;
  makeChoice: (storyId: string, choiceId: string) => void;
  isGenerating: boolean;
}

export function useStory(): UseStoryReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const addStory = useStoryStore((s) => s.addStory);
  const setPendingStory = useStoryStore((s) => s.setPendingStory);
  const storyMakeChoice = useStoryStore((s) => s.makeChoice);
  const addButterflyEffect = useStoryStore((s) => s.addButterflyEffect);
  const incrementStoriesRead = usePlayerStore((s) => s.incrementStoriesRead);
  const addReputation = usePlayerStore((s) => s.addReputation);

  const generateStory = useCallback(async (plane: Plane): Promise<PassengerStory | null> => {
    if (isGenerating || !plane.assignedRoute) return null;
    setIsGenerating(true);

    try {
      const dayPhase = useGameStore.getState().dayPhase;
      const routes = usePlaneStore.getState().routes;
      const route = routes.find((r) => r.id === plane.assignedRoute);
      if (!route) return null;

      const fromCity = CITIES.find((c) => c.id === route.from);
      const toCity = CITIES.find((c) => c.id === route.to);
      if (!fromCity || !toCity) return null;

      const res = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromCity: fromCity.name,
          toCity: toCity.name,
          planeNickname: plane.nickname,
          planeId: plane.instanceId,
          routeId: route.id,
          dayPhase,
          flightNumber: plane.totalFlights,
        }),
      });

      if (!res.ok) return null;

      const data = await res.json();
      const story: PassengerStory = data.story;

      addStory(story);
      setPendingStory(story);
      incrementStoriesRead();

      return story;
    } catch (err) {
      console.error("[SKYLOG] Story generation failed:", err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, addStory, setPendingStory, incrementStoriesRead]);

  const makeChoice = useCallback((storyId: string, choiceId: string) => {
    const stories = useStoryStore.getState().stories;
    const story = stories.find((s) => s.id === storyId);
    if (!story) return;

    const choice = story.choices.find((c) => c.id === choiceId);
    if (!choice) return;

    // Make the choice in the store
    storyMakeChoice(storyId, choiceId);

    // Generate butterfly effects
    const effects = generateButterflyEffects(
      story.passengerName,
      choice.text,
      choice.consequence,
    );

    for (const effect of effects) {
      addButterflyEffect(effect);
    }

    // Reward for engaging with the story
    addReputation(5);
  }, [storyMakeChoice, addButterflyEffect, addReputation]);

  return { generateStory, makeChoice, isGenerating };
}
