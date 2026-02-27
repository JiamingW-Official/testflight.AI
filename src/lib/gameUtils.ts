// ============================================
// SKYLOG — Game Utility Functions
// Distance, revenue, flight time calculations
// ============================================

import type { City, Plane, PlaneModel, Route, Rarity } from "@/types";
import { CITIES } from "@/data/cities";
import { PLANE_MODELS } from "@/data/planes";

// ── Distance ──

/** Haversine formula: great-circle distance between two lat/lng points in km */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// ── Route Generation ──

/** Generate a route ID from two city IDs (alphabetical order for consistency) */
export function routeId(cityA: string, cityB: string): string {
  const sorted = [cityA, cityB].sort();
  return `${sorted[0]}-${sorted[1]}`;
}

/** Calculate flight duration in minutes given distance and speed */
export function flightDuration(distanceKm: number, speedKmh: number): number {
  // Add 30 min for taxi/takeoff/landing overhead
  return Math.round((distanceKm / speedKmh) * 60 + 30);
}

/** Calculate base revenue for a route */
export function baseRevenue(distanceKm: number, demand: number): number {
  // Revenue formula: distance-based with demand multiplier
  // Short routes (< 1000km): ~50-150 coins
  // Medium routes (1000-5000km): ~150-500 coins
  // Long routes (5000km+): ~500-2000 coins
  const distanceFactor = Math.sqrt(distanceKm) * 2;
  const demandMultiplier = 0.5 + demand * 1.0;
  return Math.round(distanceFactor * demandMultiplier);
}

/** Calculate actual revenue per flight with plane bonuses */
export function calculateFlightRevenue(
  route: Route,
  plane: Plane,
  model: PlaneModel,
): number {
  let revenue = route.baseRevenue;

  // Capacity bonus: larger planes earn more
  revenue *= 1 + model.capacity / 500;

  // Efficiency bonus
  revenue *= model.fuelEfficiency;

  // Mood bonus: happy planes earn 10-30% more
  revenue *= 1 + (plane.mood / 100) * 0.3;

  // Bond bonus: higher bond = 0-20% more
  revenue *= 1 + (plane.bond / 100) * 0.2;

  // Level bonus: 5% per plane level
  revenue *= 1 + (plane.level - 1) * 0.05;

  return Math.round(revenue);
}

/** Generate demand value for a route (deterministic based on cities) */
export function calculateDemand(cityA: City, cityB: City): number {
  // Same-country routes have higher demand
  const sameCountry = cityA.country === cityB.country ? 0.2 : 0;
  // Base demand from a hash of city IDs (deterministic)
  const hash = simpleHash(cityA.id + cityB.id);
  const baseDemand = 0.3 + (hash % 50) / 100;
  return Math.min(1, baseDemand + sameCountry);
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Generate all possible routes between unlocked cities */
export function generateRoutes(unlockedCityIds: string[]): Route[] {
  const cities = unlockedCityIds
    .map((id) => CITIES.find((c) => c.id === id))
    .filter((c): c is City => c !== undefined);

  const routes: Route[] = [];

  for (let i = 0; i < cities.length; i++) {
    for (let j = i + 1; j < cities.length; j++) {
      const a = cities[i];
      const b = cities[j];
      const dist = haversineDistance(a.lat, a.lng, b.lat, b.lng);
      const demand = calculateDemand(a, b);

      routes.push({
        id: routeId(a.id, b.id),
        from: a.id,
        to: b.id,
        distance: dist,
        flightDuration: flightDuration(dist, 850), // average cruise speed
        baseRevenue: baseRevenue(dist, demand),
        demand,
        unlocked: true,
        assignedPlaneId: null,
      });
    }
  }

  return routes;
}

// ── Plane Utilities ──

/** Get the PlaneModel for a plane instance */
export function getPlaneModel(plane: Plane): PlaneModel | undefined {
  return PLANE_MODELS.find((m) => m.id === plane.modelId);
}

/** Calculate EXP needed for a plane to reach next level */
export function planeExpForLevel(level: number): number {
  return Math.floor(50 * level + 10 * level * level);
}

/** Calculate mood change per flight */
export function moodChangePerFlight(plane: Plane, route: Route): number {
  // Short flights are less tiring
  if (route.flightDuration < 60) return -2;
  if (route.flightDuration < 180) return -5;
  if (route.flightDuration < 360) return -8;
  return -12;
}

/** Calculate mood recovery when idle (per hour) */
export function moodRecoveryRate(plane: Plane): number {
  // Dreamer personalities recover faster, adventurers slower
  const personalityBonus: Record<string, number> = {
    dreamer: 8,
    gentle: 7,
    steady: 6,
    shy: 6,
    proud: 5,
    adventurer: 4,
  };
  return personalityBonus[plane.personality] ?? 5;
}

/** Calculate bond gain per flight */
export function bondGainPerFlight(plane: Plane): number {
  // Bond grows slower as it increases
  if (plane.bond < 30) return 3;
  if (plane.bond < 60) return 2;
  if (plane.bond < 90) return 1;
  return 0.5;
}

// ── Offline Calculations ──

/** Calculate earnings during offline period */
export function calculateOfflineEarnings(
  planes: Plane[],
  routes: Route[],
  offlineDurationMs: number,
): { coins: number; flights: number; planeFlights: Map<string, number> } {
  let totalCoins = 0;
  let totalFlights = 0;
  const planeFlights = new Map<string, number>();

  for (const plane of planes) {
    if (!plane.assignedRoute) continue;

    const route = routes.find((r) => r.id === plane.assignedRoute);
    if (!route) continue;

    const model = getPlaneModel(plane);
    if (!model) continue;

    // How many flights could this plane complete while offline?
    const flightTimeMs = route.flightDuration * 60 * 1000;
    const completedFlights = Math.floor(offlineDurationMs / flightTimeMs);

    if (completedFlights > 0) {
      const revenuePerFlight = calculateFlightRevenue(route, plane, model);
      // Offline earnings are 80% of normal (incentivize active play)
      const offlineRevenue = Math.round(revenuePerFlight * completedFlights * 0.8);
      totalCoins += offlineRevenue;
      totalFlights += completedFlights;
      planeFlights.set(plane.instanceId, completedFlights);
    }
  }

  return { coins: totalCoins, flights: totalFlights, planeFlights };
}

// ── Rarity Utilities ──

export const RARITY_COLORS: Record<Rarity, string> = {
  common: "#9CA3AF",
  uncommon: "#34D399",
  rare: "#60A5FA",
  epic: "#A78BFA",
  legendary: "#FBBF24",
};

export const RARITY_LABELS: Record<Rarity, string> = {
  common: "普通",
  uncommon: "优良",
  rare: "稀有",
  epic: "史诗",
  legendary: "传说",
};

/** Discovery probability based on rarity */
export const DISCOVERY_CHANCE: Record<Rarity, number> = {
  common: 0.15,
  uncommon: 0.08,
  rare: 0.03,
  epic: 0.008,
  legendary: 0.001,
};
