// ============================================
// SKYLOG — Player Store (Complete)
// Economy, leveling, collection, achievements
// ============================================

import { create } from "zustand";
import { persist, loadState } from "@/lib/persistence";
import { expForLevel } from "@/types";
import type { PlayerState, GameSettings, CollectionEntry, Notification, OfflineReport } from "@/types";
import { PLANE_MODELS } from "@/data/planes";

interface PlayerStoreData extends PlayerState {
  collection: CollectionEntry[];
  notifications: Notification[];
}

interface PlayerActions {
  // Economy
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addGems: (amount: number) => void;
  spendGems: (amount: number) => boolean;

  // Progression
  addExp: (amount: number) => void;
  addReputation: (amount: number) => void;

  // Cities
  unlockCity: (cityId: string) => void;
  isCityUnlocked: (cityId: string) => boolean;

  // Collection (Pokédex)
  discoverPlane: (modelId: string) => void;
  ownPlane: (modelId: string) => void;
  getCollectionProgress: () => { discovered: number; total: number };

  // Achievements
  unlockAchievement: (achievementId: string) => void;
  hasAchievement: (achievementId: string) => boolean;

  // Stats
  incrementStoriesRead: () => void;
  incrementDiariesRead: () => void;

  // Settings
  updateSettings: (updates: Partial<GameSettings>) => void;

  // Notifications
  addNotification: (n: Omit<Notification, "id" | "read" | "createdAt">) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  // Offline
  processOfflineReturn: (report: OfflineReport) => void;
  updateLastOnline: () => void;

  // Persistence
  hydrate: () => Promise<void>;
  _hydrated: boolean;
}

type PlayerStore = PlayerStoreData & PlayerActions;

function initCollection(): CollectionEntry[] {
  return PLANE_MODELS.map((m) => ({
    modelId: m.id,
    discovered: false,
    discoveredAt: null,
    ownedCount: 0,
    firstOwnedAt: null,
  }));
}

const INITIAL_STATE: PlayerState = {
  name: "机长",
  level: 1,
  exp: 0,
  coins: 10000,
  gems: 50,
  reputation: 0,
  unlockedCities: ["beijing", "shanghai"],
  achievements: [],
  totalStoriesRead: 0,
  totalDiariesRead: 0,
  settings: {
    musicVolume: 0.7,
    sfxVolume: 0.8,
    language: "zh",
    notifications: true,
  },
  lastOnline: Date.now(),
  createdAt: Date.now(),
};

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,
      collection: initCollection(),
      notifications: [],
      _hydrated: false,

      // ── Economy ──

      addCoins: (amount) =>
        set((s) => ({ coins: Math.max(0, s.coins + amount) })),

      spendCoins: (amount) => {
        if (get().coins < amount) return false;
        set((s) => ({ coins: s.coins - amount }));
        return true;
      },

      addGems: (amount) =>
        set((s) => ({ gems: Math.max(0, s.gems + amount) })),

      spendGems: (amount) => {
        if (get().gems < amount) return false;
        set((s) => ({ gems: s.gems - amount }));
        return true;
      },

      // ── Progression ──

      addExp: (amount) =>
        set((s) => {
          let { level, exp } = s;
          exp += amount;
          let leveled = false;

          while (exp >= expForLevel(level)) {
            exp -= expForLevel(level);
            level++;
            leveled = true;
          }

          if (leveled) {
            // Auto-add level-up notification
            const notif: Notification = {
              id: `levelup-${level}-${Date.now()}`,
              type: "level_up",
              title: "升级了！",
              message: `恭喜你升到了 ${level} 级！`,
              read: false,
              createdAt: Date.now(),
            };
            return { level, exp, notifications: [...s.notifications, notif] };
          }

          return { exp };
        }),

      addReputation: (amount) =>
        set((s) => ({ reputation: Math.max(0, s.reputation + amount) })),

      // ── Cities ──

      unlockCity: (cityId) =>
        set((s) => ({
          unlockedCities: [...new Set([...s.unlockedCities, cityId])],
        })),

      isCityUnlocked: (cityId) => get().unlockedCities.includes(cityId),

      // ── Collection ──

      discoverPlane: (modelId) =>
        set((s) => ({
          collection: s.collection.map((c) =>
            c.modelId === modelId && !c.discovered
              ? { ...c, discovered: true, discoveredAt: Date.now() }
              : c
          ),
        })),

      ownPlane: (modelId) =>
        set((s) => ({
          collection: s.collection.map((c) =>
            c.modelId === modelId
              ? {
                  ...c,
                  discovered: true,
                  discoveredAt: c.discoveredAt ?? Date.now(),
                  ownedCount: c.ownedCount + 1,
                  firstOwnedAt: c.firstOwnedAt ?? Date.now(),
                }
              : c
          ),
        })),

      getCollectionProgress: () => {
        const col = get().collection;
        return {
          discovered: col.filter((c) => c.discovered).length,
          total: col.length,
        };
      },

      // ── Achievements ──

      unlockAchievement: (achievementId) =>
        set((s) => {
          if (s.achievements.includes(achievementId)) return {};
          return {
            achievements: [...s.achievements, achievementId],
            notifications: [
              ...s.notifications,
              {
                id: `ach-${achievementId}-${Date.now()}`,
                type: "achievement" as const,
                title: "成就解锁！",
                message: achievementId,
                read: false,
                createdAt: Date.now(),
              },
            ],
          };
        }),

      hasAchievement: (id) => get().achievements.includes(id),

      // ── Stats ──

      incrementStoriesRead: () =>
        set((s) => ({ totalStoriesRead: s.totalStoriesRead + 1 })),

      incrementDiariesRead: () =>
        set((s) => ({ totalDiariesRead: s.totalDiariesRead + 1 })),

      // ── Settings ──

      updateSettings: (updates) =>
        set((s) => ({ settings: { ...s.settings, ...updates } })),

      // ── Notifications ──

      addNotification: (n) =>
        set((s) => ({
          notifications: [
            ...s.notifications,
            { ...n, id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, read: false, createdAt: Date.now() },
          ],
        })),

      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      clearNotifications: () => set({ notifications: [] }),

      // ── Offline ──

      processOfflineReturn: (report) =>
        set((s) => {
          const notif: Notification = {
            id: `wb-${Date.now()}`,
            type: "welcome_back",
            title: "欢迎回来！",
            message: `你离开了 ${formatDuration(report.offlineDuration)}。你的飞机们完成了 ${report.flightsCompleted} 次飞行，赚取了 ${report.coinsEarned} 金币。`,
            data: report as unknown as Record<string, unknown>,
            read: false,
            createdAt: Date.now(),
          };
          return {
            coins: s.coins + report.coinsEarned,
            notifications: [...s.notifications, notif],
          };
        }),

      updateLastOnline: () => set({ lastOnline: Date.now() }),

      // ── Persistence ──

      hydrate: async () => {
        const saved = await loadState<PlayerStore>("player");
        if (saved) {
          // Merge saved state, keeping action functions intact
          const { _hydrated, ...data } = saved as Record<string, unknown>;
          // Ensure collection has all plane models (new ones might have been added)
          const savedCollection = (data.collection as CollectionEntry[] | undefined) ?? [];
          const fullCollection = initCollection().map((entry) => {
            const saved = savedCollection.find((c) => c.modelId === entry.modelId);
            return saved ?? entry;
          });
          set({ ...data, collection: fullCollection, _hydrated: true } as Partial<PlayerStore>);
        } else {
          set({ _hydrated: true });
        }
      },
    }),
    "player",
  ),
);

function formatDuration(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 24) return `${Math.floor(hours / 24)} 天 ${hours % 24} 小时`;
  if (hours > 0) return `${hours} 小时 ${minutes} 分钟`;
  return `${minutes} 分钟`;
}
