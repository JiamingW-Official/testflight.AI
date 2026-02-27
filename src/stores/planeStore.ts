// ============================================
// SKYLOG — Plane Store (Complete)
// Fleet management, flight state, routes, mood
// ============================================

import { create } from "zustand";
import { persist, loadState } from "@/lib/persistence";
import type { Plane, Route, Diary, FlightStatus } from "@/types";
import { INITIAL_PLANES } from "@/data/initialPlanes";
import {
  generateRoutes,
  getPlaneModel,
  calculateFlightRevenue,
  moodChangePerFlight,
  bondGainPerFlight,
  planeExpForLevel,
  moodRecoveryRate,
  calculateOfflineEarnings,
} from "@/lib/gameUtils";

interface PlaneActions {
  // Fleet
  addPlane: (plane: Plane) => void;
  removePlane: (instanceId: string) => void;
  updatePlane: (id: string, updates: Partial<Plane>) => void;
  getPlane: (id: string) => Plane | undefined;

  // Routes
  routes: Route[];
  refreshRoutes: (unlockedCities: string[]) => void;
  getRoute: (id: string) => Route | undefined;

  // Route Assignment
  assignRoute: (planeId: string, routeId: string) => void;
  unassignRoute: (planeId: string) => void;

  // Flight Lifecycle
  startFlight: (planeId: string) => void;
  updateFlightProgress: (planeId: string, progress: number) => void;
  completeFlight: (planeId: string) => {
    revenue: number;
    expGained: number;
    leveled: boolean;
  } | null;

  // Mood System
  recoverMood: (planeId: string, hours: number) => void;
  boostMood: (planeId: string, amount: number) => void;

  // Diary
  addDiary: (planeId: string, diary: Diary) => void;
  getRecentDiaries: (planeId: string, count: number) => Diary[];

  // Flight tick (called by game loop)
  tickFlights: (deltaMs: number) => Array<{ planeId: string; revenue: number }>;

  // Offline
  processOfflineFlights: (
    offlineDurationMs: number,
  ) => { coins: number; flights: number };

  // Persistence
  hydrate: (unlockedCities: string[]) => Promise<void>;
  _hydrated: boolean;
}

interface PlaneState {
  planes: Plane[];
}

type PlaneStore = PlaneState & PlaneActions;

export const usePlaneStore = create<PlaneStore>()(
  persist(
    (set, get) => ({
      planes: [],
      routes: [],
      _hydrated: false,

      // ── Fleet ──

      addPlane: (plane) =>
        set((s) => ({ planes: [...s.planes, plane] })),

      removePlane: (instanceId) =>
        set((s) => ({
          planes: s.planes.filter((p) => p.instanceId !== instanceId),
          routes: s.routes.map((r) =>
            r.assignedPlaneId === instanceId
              ? { ...r, assignedPlaneId: null }
              : r
          ),
        })),

      updatePlane: (id, updates) =>
        set((s) => ({
          planes: s.planes.map((p) =>
            p.instanceId === id ? { ...p, ...updates } : p
          ),
        })),

      getPlane: (id) => get().planes.find((p) => p.instanceId === id),

      // ── Routes ──

      refreshRoutes: (unlockedCities) => {
        const currentRoutes = get().routes;
        const newRoutes = generateRoutes(unlockedCities);

        // Preserve assignments from existing routes
        const merged = newRoutes.map((nr) => {
          const existing = currentRoutes.find((r) => r.id === nr.id);
          if (existing) {
            return { ...nr, assignedPlaneId: existing.assignedPlaneId };
          }
          return nr;
        });

        set({ routes: merged });
      },

      getRoute: (id) => get().routes.find((r) => r.id === id),

      // ── Route Assignment ──

      assignRoute: (planeId, routeId) =>
        set((s) => {
          // Unassign plane from any existing route
          const updatedRoutes = s.routes.map((r) => {
            if (r.assignedPlaneId === planeId) return { ...r, assignedPlaneId: null };
            if (r.id === routeId) return { ...r, assignedPlaneId: planeId };
            return r;
          });

          return {
            planes: s.planes.map((p) =>
              p.instanceId === planeId
                ? { ...p, assignedRoute: routeId, flightStatus: "idle" as FlightStatus, flightProgress: 0 }
                : p
            ),
            routes: updatedRoutes,
          };
        }),

      unassignRoute: (planeId) =>
        set((s) => ({
          planes: s.planes.map((p) =>
            p.instanceId === planeId
              ? { ...p, assignedRoute: null, flightStatus: "idle" as FlightStatus, flightProgress: 0 }
              : p
          ),
          routes: s.routes.map((r) =>
            r.assignedPlaneId === planeId ? { ...r, assignedPlaneId: null } : r
          ),
        })),

      // ── Flight Lifecycle ──

      startFlight: (planeId) =>
        set((s) => ({
          planes: s.planes.map((p) =>
            p.instanceId === planeId
              ? {
                  ...p,
                  flightStatus: "taxiing" as FlightStatus,
                  flightProgress: 0,
                  flightDepartedAt: Date.now(),
                }
              : p
          ),
        })),

      updateFlightProgress: (planeId, progress) =>
        set((s) => {
          let status: FlightStatus = "airborne";
          if (progress < 0.05) status = "taxiing";
          else if (progress < 0.1) status = "taxiing";
          else if (progress > 0.95) status = "landing";

          return {
            planes: s.planes.map((p) =>
              p.instanceId === planeId
                ? { ...p, flightProgress: Math.min(1, progress), flightStatus: status }
                : p
            ),
          };
        }),

      completeFlight: (planeId) => {
        const state = get();
        const plane = state.planes.find((p) => p.instanceId === planeId);
        if (!plane || !plane.assignedRoute) return null;

        const route = state.routes.find((r) => r.id === plane.assignedRoute);
        if (!route) return null;

        const model = getPlaneModel(plane);
        if (!model) return null;

        const revenue = calculateFlightRevenue(route, plane, model);
        const moodDelta = moodChangePerFlight(plane, route);
        const bondGain = bondGainPerFlight(plane);
        const expGain = Math.round(route.distance / 100 + 10);

        let newExp = plane.exp + expGain;
        let newLevel = plane.level;
        let leveled = false;

        while (newExp >= planeExpForLevel(newLevel)) {
          newExp -= planeExpForLevel(newLevel);
          newLevel++;
          leveled = true;
        }

        set((s) => ({
          planes: s.planes.map((p) =>
            p.instanceId === planeId
              ? {
                  ...p,
                  flightStatus: "arrived" as FlightStatus,
                  flightProgress: 1,
                  flightDepartedAt: null,
                  totalFlights: p.totalFlights + 1,
                  totalDistance: p.totalDistance + route.distance,
                  mood: Math.max(0, Math.min(100, p.mood + moodDelta)),
                  bond: Math.min(100, p.bond + bondGain),
                  exp: newExp,
                  level: newLevel,
                }
              : p
          ),
        }));

        return { revenue, expGained: expGain, leveled };
      },

      // ── Mood ──

      recoverMood: (planeId, hours) => {
        const plane = get().planes.find((p) => p.instanceId === planeId);
        if (!plane) return;
        const recovery = moodRecoveryRate(plane) * hours;
        set((s) => ({
          planes: s.planes.map((p) =>
            p.instanceId === planeId
              ? { ...p, mood: Math.min(100, p.mood + recovery) }
              : p
          ),
        }));
      },

      boostMood: (planeId, amount) =>
        set((s) => ({
          planes: s.planes.map((p) =>
            p.instanceId === planeId
              ? { ...p, mood: Math.min(100, p.mood + amount) }
              : p
          ),
        })),

      // ── Diary ──

      addDiary: (planeId, diary) =>
        set((s) => ({
          planes: s.planes.map((p) =>
            p.instanceId === planeId
              ? { ...p, diaries: [...p.diaries, diary] }
              : p
          ),
        })),

      getRecentDiaries: (planeId, count) => {
        const plane = get().planes.find((p) => p.instanceId === planeId);
        if (!plane) return [];
        return plane.diaries.slice(-count);
      },

      // ── Game Loop Tick ──

      tickFlights: (deltaMs) => {
        const state = get();
        const completed: Array<{ planeId: string; revenue: number }> = [];

        const updatedPlanes = state.planes.map((plane) => {
          // Only tick planes that are flying
          if (!plane.assignedRoute || plane.flightStatus === "idle" || plane.flightStatus === "arrived") {
            // Auto-restart if arrived and has route
            if (plane.flightStatus === "arrived" && plane.assignedRoute && plane.mood > 10) {
              return {
                ...plane,
                flightStatus: "taxiing" as FlightStatus,
                flightProgress: 0,
                flightDepartedAt: Date.now(),
              };
            }
            return plane;
          }

          const route = state.routes.find((r) => r.id === plane.assignedRoute);
          if (!route) return plane;

          // Calculate new progress
          const flightTimeMs = route.flightDuration * 60 * 1000;
          const progressDelta = deltaMs / flightTimeMs;
          const newProgress = Math.min(1, plane.flightProgress + progressDelta);

          // Determine status
          let status: FlightStatus = "airborne";
          if (newProgress < 0.08) status = "taxiing";
          else if (newProgress > 0.92) status = "landing";

          // Complete flight
          if (newProgress >= 1) {
            const model = getPlaneModel(plane);
            if (model) {
              const revenue = calculateFlightRevenue(route, plane, model);
              const moodDelta = moodChangePerFlight(plane, route);
              const bondGain = bondGainPerFlight(plane);
              const expGain = Math.round(route.distance / 100 + 10);

              let exp = plane.exp + expGain;
              let level = plane.level;
              while (exp >= planeExpForLevel(level)) {
                exp -= planeExpForLevel(level);
                level++;
              }

              completed.push({ planeId: plane.instanceId, revenue });

              return {
                ...plane,
                flightStatus: "arrived" as FlightStatus,
                flightProgress: 1,
                flightDepartedAt: null,
                totalFlights: plane.totalFlights + 1,
                totalDistance: plane.totalDistance + route.distance,
                mood: Math.max(0, Math.min(100, plane.mood + moodDelta)),
                bond: Math.min(100, plane.bond + bondGain),
                exp,
                level,
              };
            }
          }

          return { ...plane, flightProgress: newProgress, flightStatus: status };
        });

        set({ planes: updatedPlanes });
        return completed;
      },

      // ── Offline ──

      processOfflineFlights: (offlineDurationMs) => {
        const { planes, routes } = get();
        const result = calculateOfflineEarnings(planes, routes, offlineDurationMs);

        // Update plane stats
        set((s) => ({
          planes: s.planes.map((plane) => {
            const flights = result.planeFlights.get(plane.instanceId);
            if (!flights) {
              // Idle plane recovers mood
              const hours = offlineDurationMs / 3600000;
              const recovery = moodRecoveryRate(plane) * hours;
              return { ...plane, mood: Math.min(100, plane.mood + recovery) };
            }

            const route = s.routes.find((r) => r.id === plane.assignedRoute);
            const distance = route ? route.distance * flights : 0;

            return {
              ...plane,
              totalFlights: plane.totalFlights + flights,
              totalDistance: plane.totalDistance + distance,
              mood: Math.max(10, plane.mood - flights * 3),
            };
          }),
        }));

        return { coins: result.coins, flights: result.flights };
      },

      // ── Persistence ──

      hydrate: async (unlockedCities) => {
        const saved = await loadState<PlaneStore>("planes");
        if (saved && saved.planes && saved.planes.length > 0) {
          const savedRoutes = (saved.routes as Route[] | undefined) ?? [];
          // Regenerate routes to include any new cities, preserving assignments
          const freshRoutes = generateRoutes(unlockedCities);
          const mergedRoutes = freshRoutes.map((fr) => {
            const existing = savedRoutes.find((r) => r.id === fr.id);
            return existing ? { ...fr, assignedPlaneId: existing.assignedPlaneId } : fr;
          });

          // Ensure saved planes have all new fields
          const migratedPlanes: Plane[] = saved.planes.map((p) => ({
            ...p,
            flightStatus: p.flightStatus ?? ("idle" as FlightStatus),
            flightProgress: p.flightProgress ?? 0,
            flightDepartedAt: p.flightDepartedAt ?? null,
          }));

          set({ planes: migratedPlanes, routes: mergedRoutes, _hydrated: true });
        } else {
          // First time: initialize with starter planes
          const routes = generateRoutes(unlockedCities);
          set({ planes: [...INITIAL_PLANES], routes, _hydrated: true });
        }
      },
    }),
    "planes",
  ),
);
