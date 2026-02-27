// ============================================
// SKYLOG — Game Store (Complete)
// Time, day/night, events, UI state, game loop
// ============================================

import { create } from "zustand";
import { persist, loadState } from "@/lib/persistence";
import type { GameEvent, DayPhase, Notification } from "@/types";

interface GameState {
  // Time
  gameTime: number;
  isPaused: boolean;
  dayPhase: DayPhase;
  dayProgress: number;    // 0-1 through the full day

  // Events
  activeEvents: GameEvent[];

  // UI state
  activePanel: string | null;
  selectedPlaneId: string | null;
  showWelcomeBack: boolean;
  isLoading: boolean;

  // Camera
  cameraX: number;
  cameraY: number;
  cameraZoom: number;
}

interface GameActions {
  // UI
  setActivePanel: (panel: string | null) => void;
  setSelectedPlane: (planeId: string | null) => void;
  setShowWelcomeBack: (show: boolean) => void;
  setLoading: (loading: boolean) => void;

  // Camera
  setCameraPosition: (x: number, y: number) => void;
  setCameraZoom: (zoom: number) => void;
  panCamera: (dx: number, dy: number) => void;

  // Time
  updateTime: () => void;
  togglePause: () => void;

  // Events
  addEvent: (event: GameEvent) => void;
  removeEvent: (eventId: string) => void;
  cleanExpiredEvents: () => void;

  // Persistence
  hydrate: () => Promise<void>;
  _hydrated: boolean;
}

type GameStore = GameState & GameActions;

function getDayPhase(hour: number): DayPhase {
  if (hour >= 5 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 17) return "day";
  if (hour >= 17 && hour < 19) return "dusk";
  return "night";
}

function getDayProgress(hour: number, minute: number): number {
  return (hour * 60 + minute) / 1440;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => {
      const now = new Date();
      return {
        // Initial state
        gameTime: Date.now(),
        isPaused: false,
        dayPhase: getDayPhase(now.getHours()),
        dayProgress: getDayProgress(now.getHours(), now.getMinutes()),

        activeEvents: [],

        activePanel: null,
        selectedPlaneId: null,
        showWelcomeBack: false,
        isLoading: true,

        cameraX: 0,
        cameraY: 0,
        cameraZoom: 1,

        _hydrated: false,

        // ── UI ──

        setActivePanel: (panel) => {
          const current = get().activePanel;
          // Toggle if same panel
          set({ activePanel: current === panel ? null : panel });
        },

        setSelectedPlane: (planeId) =>
          set({ selectedPlaneId: planeId }),

        setShowWelcomeBack: (show) =>
          set({ showWelcomeBack: show }),

        setLoading: (loading) =>
          set({ isLoading: loading }),

        // ── Camera ──

        setCameraPosition: (x, y) => set({ cameraX: x, cameraY: y }),

        setCameraZoom: (zoom) =>
          set({ cameraZoom: Math.max(0.3, Math.min(3, zoom)) }),

        panCamera: (dx, dy) =>
          set((s) => ({
            cameraX: s.cameraX + dx / s.cameraZoom,
            cameraY: s.cameraY + dy / s.cameraZoom,
          })),

        // ── Time ──

        updateTime: () => {
          const now = new Date();
          set({
            gameTime: now.getTime(),
            dayPhase: getDayPhase(now.getHours()),
            dayProgress: getDayProgress(now.getHours(), now.getMinutes()),
          });
        },

        togglePause: () => set((s) => ({ isPaused: !s.isPaused })),

        // ── Events ──

        addEvent: (event) =>
          set((s) => ({ activeEvents: [...s.activeEvents, event] })),

        removeEvent: (eventId) =>
          set((s) => ({
            activeEvents: s.activeEvents.filter((e) => e.id !== eventId),
          })),

        cleanExpiredEvents: () =>
          set((s) => ({
            activeEvents: s.activeEvents.filter((e) => e.endAt > Date.now()),
          })),

        // ── Persistence ──

        hydrate: async () => {
          const saved = await loadState<GameStore>("game");
          if (saved) {
            // Only restore persistent state (not UI state)
            set({
              activeEvents: (saved.activeEvents as GameEvent[]) ?? [],
              cameraX: (saved.cameraX as number) ?? 0,
              cameraY: (saved.cameraY as number) ?? 0,
              cameraZoom: (saved.cameraZoom as number) ?? 1,
              _hydrated: true,
              isLoading: false,
            });
          } else {
            set({ _hydrated: true, isLoading: false });
          }
        },
      };
    },
    "game",
  ),
);
