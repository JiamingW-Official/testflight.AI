// ============================================
// SKYLOG — 3 Initial Starter Planes
// Luna, Breeze, Dash — the first companions
// ============================================

import type { Plane } from "@/types";

export const INITIAL_PLANES: Plane[] = [
  {
    instanceId: "starter-luna",
    modelId: "crj-200",
    nickname: "Luna",
    personality: "dreamer",
    level: 1,
    exp: 0,
    mood: 80,
    bond: 30,
    totalFlights: 0,
    totalDistance: 0,
    assignedRoute: null,
    flightStatus: "idle",
    flightProgress: 0,
    flightDepartedAt: null,
    diaries: [],
    acquiredAt: Date.now(),
    color: "#B8A9E8", // lavender
  },
  {
    instanceId: "starter-breeze",
    modelId: "erj-175",
    nickname: "Breeze",
    personality: "steady",
    level: 1,
    exp: 0,
    mood: 70,
    bond: 30,
    totalFlights: 0,
    totalDistance: 0,
    assignedRoute: null,
    flightStatus: "idle",
    flightProgress: 0,
    flightDepartedAt: null,
    diaries: [],
    acquiredAt: Date.now(),
    color: "#7BC4E8", // sky blue
  },
  {
    instanceId: "starter-dash",
    modelId: "arj21",
    nickname: "Dash",
    personality: "adventurer",
    level: 1,
    exp: 0,
    mood: 90,
    bond: 30,
    totalFlights: 0,
    totalDistance: 0,
    assignedRoute: null,
    flightStatus: "idle",
    flightProgress: 0,
    flightDepartedAt: null,
    diaries: [],
    acquiredAt: Date.now(),
    color: "#F0A500", // amber
  },
];
