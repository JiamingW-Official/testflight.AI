// ============================================
// SKYLOG — Story Store (Zustand)
// Passenger stories, choices, butterfly effects
// ============================================

import { create } from "zustand";
import { persist, loadState } from "@/lib/persistence";
import type { PassengerStory } from "@/types";

interface StoryState {
  stories: PassengerStory[];
  pendingStory: PassengerStory | null; // Story waiting for player choice
  butterflyQueue: string[];            // Accumulated butterfly effects

  // Actions
  addStory: (story: PassengerStory) => void;
  setPendingStory: (story: PassengerStory | null) => void;
  makeChoice: (storyId: string, choiceId: string) => void;
  addButterflyEffect: (effect: string) => void;
  getRecentStories: (count: number) => PassengerStory[];

  // Persistence
  hydrate: () => Promise<void>;
  _hydrated: boolean;
}

export const useStoryStore = create<StoryState>()(
  persist(
    (set, get) => ({
      stories: [],
      pendingStory: null,
      butterflyQueue: [],
      _hydrated: false,

      addStory: (story) =>
        set((s) => ({ stories: [...s.stories, story] })),

      setPendingStory: (story) =>
        set({ pendingStory: story }),

      makeChoice: (storyId, choiceId) =>
        set((s) => {
          const story = s.stories.find((st) => st.id === storyId);
          if (!story) return {};

          const choice = story.choices.find((c) => c.id === choiceId);
          if (!choice) return {};

          return {
            stories: s.stories.map((st) =>
              st.id === storyId
                ? {
                    ...st,
                    chosenId: choiceId,
                    outcome: choice.consequence,
                  }
                : st
            ),
            pendingStory: null,
          };
        }),

      addButterflyEffect: (effect) =>
        set((s) => ({
          butterflyQueue: [...s.butterflyQueue, effect],
        })),

      getRecentStories: (count) => {
        return get().stories.slice(-count);
      },

      hydrate: async () => {
        const saved = await loadState<StoryState>("stories");
        if (saved) {
          set({
            stories: (saved.stories as PassengerStory[]) ?? [],
            butterflyQueue: (saved.butterflyQueue as string[]) ?? [],
            pendingStory: null, // Don't restore pending
            _hydrated: true,
          });
        } else {
          set({ _hydrated: true });
        }
      },
    }),
    "stories",
  ),
);
