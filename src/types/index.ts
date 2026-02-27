// ============================================
// SKYLOG — Core Type Definitions (Complete)
// ============================================

// ── Enums & Unions ──

export type PlanePersonality =
  | "dreamer"    // 爱幻想，日记充满诗意
  | "steady"     // 冷静可靠，关注数据和效率
  | "adventurer" // 热血冒险，渴望新航线
  | "gentle"     // 温柔体贴，关心乘客
  | "proud"      // 骄傲自信，在乎自己的表现
  | "shy";       // 害羞内向，慢热但忠诚

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type PlaneType = "narrow" | "wide" | "regional" | "cargo" | "private";

export type DiaryMood = "happy" | "tired" | "excited" | "melancholy" | "peaceful";

export type DayPhase = "dawn" | "day" | "dusk" | "night";

export type FlightStatus = "idle" | "boarding" | "taxiing" | "airborne" | "landing" | "arrived";

export type BuildingType =
  | "terminal"
  | "hangar"
  | "control_tower"
  | "fuel_depot"
  | "cargo_hub"
  | "lounge"
  | "shop"
  | "restaurant"
  | "hotel"
  | "garden";

// ── Static Data ──

export interface PlaneModel {
  id: string;
  name: string;
  manufacturer: string;
  type: PlaneType;
  capacity: number;
  range: number;           // km
  speed: number;           // km/h
  fuelEfficiency: number;  // 0-1, higher = better
  rarity: Rarity;
  unlockLevel: number;
  basePrice: number;
  description: string;
}

export interface City {
  id: string;
  name: string;
  nameEn: string;
  country: string;
  iata: string;
  lat: number;
  lng: number;
  timezone: string;
  unlockLevel: number;
  description: string;
}

export interface BuildingTemplate {
  type: BuildingType;
  name: string;
  description: string;
  maxLevel: number;
  baseCost: number;
  buildTime: number;       // seconds
  effect: string;
  icon: string;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: AchievementCondition;
  reward: { coins?: number; gems?: number; exp?: number };
}

export interface AchievementCondition {
  type: "flights" | "distance" | "planes" | "cities" | "stories" | "level" | "coins" | "diary";
  target: number;
}

// ── Live Game Objects ──

export interface Plane {
  instanceId: string;
  modelId: string;
  nickname: string;
  personality: PlanePersonality;
  level: number;
  exp: number;
  mood: number;            // 0-100
  bond: number;            // 0-100
  totalFlights: number;
  totalDistance: number;    // km
  assignedRoute: string | null;
  flightStatus: FlightStatus;
  flightProgress: number;  // 0-1, current flight completion
  flightDepartedAt: number | null;
  diaries: Diary[];
  acquiredAt: number;
  color: string;
}

export interface Diary {
  id: string;
  planeId: string;
  content: string;
  mood: DiaryMood;
  weather: string;
  routeId: string | null;
  createdAt: number;
}

export interface Route {
  id: string;
  from: string;
  to: string;
  distance: number;        // km
  flightDuration: number;  // minutes
  baseRevenue: number;
  demand: number;          // 0-1
  unlocked: boolean;
  assignedPlaneId: string | null;
}

export interface PassengerStory {
  id: string;
  routeId: string;
  planeId: string;
  passengerName: string;
  content: string;
  choices: StoryChoice[];
  chosenId: string | null;
  outcome: string | null;
  butterflyEffects: string[];
  createdAt: number;
}

export interface StoryChoice {
  id: string;
  text: string;
  consequence: string;
}

export interface Building {
  id: string;
  type: BuildingType;
  level: number;
  position: { x: number; y: number };
  constructedAt: number;
  completesAt: number;
  isBuilding: boolean;
}

export interface CollectionEntry {
  modelId: string;
  discovered: boolean;
  discoveredAt: number | null;
  ownedCount: number;
  firstOwnedAt: number | null;
}

export interface GameEvent {
  id: string;
  type: "weather" | "festival" | "incident" | "special";
  title: string;
  description: string;
  effects: Record<string, number>;  // e.g. { revenueMultiplier: 1.5 }
  startAt: number;
  endAt: number;
  cityId: string | null;
}

export interface Notification {
  id: string;
  type: "flight_complete" | "diary" | "story" | "level_up" | "achievement" | "event" | "welcome_back";
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: number;
}

// ── Player ──

export interface PlayerState {
  name: string;
  level: number;
  exp: number;
  coins: number;
  gems: number;
  reputation: number;
  unlockedCities: string[];
  achievements: string[];
  totalStoriesRead: number;
  totalDiariesRead: number;
  settings: GameSettings;
  lastOnline: number;
  createdAt: number;
}

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  language: "zh" | "en" | "ja";
  notifications: boolean;
}

// ── Offline / Welcome Back ──

export interface OfflineReport {
  offlineDuration: number;   // ms
  coinsEarned: number;
  flightsCompleted: number;
  newDiaries: Diary[];
  events: string[];
}

// ── Level Curve ──

export function expForLevel(level: number): number {
  // Quadratic curve: each level needs more EXP
  return Math.floor(80 * level + 20 * level * level);
}

export function levelFromTotalExp(totalExp: number): { level: number; currentExp: number } {
  let level = 1;
  let remaining = totalExp;
  while (remaining >= expForLevel(level)) {
    remaining -= expForLevel(level);
    level++;
  }
  return { level, currentExp: remaining };
}
