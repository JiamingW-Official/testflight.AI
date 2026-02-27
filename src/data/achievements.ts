// ============================================
// SKYLOG — Achievement Definitions
// ============================================

import type { AchievementDef } from "@/types";

export const ACHIEVEMENTS: AchievementDef[] = [
  // ── First Steps ──
  {
    id: "first_flight",
    name: "初次起飞",
    description: "完成第一次飞行",
    icon: "🛫",
    condition: { type: "flights", target: 1 },
    reward: { coins: 500, exp: 50 },
  },
  {
    id: "frequent_flyer",
    name: "常旅客",
    description: "完成 50 次飞行",
    icon: "✈",
    condition: { type: "flights", target: 50 },
    reward: { coins: 2000, exp: 200 },
  },
  {
    id: "sky_veteran",
    name: "天空老兵",
    description: "完成 500 次飞行",
    icon: "🎖",
    condition: { type: "flights", target: 500 },
    reward: { coins: 10000, gems: 10, exp: 1000 },
  },

  // ── Distance ──
  {
    id: "around_the_world",
    name: "环游世界",
    description: "累计飞行 40,000 公里",
    icon: "🌍",
    condition: { type: "distance", target: 40000 },
    reward: { coins: 5000, exp: 500 },
  },
  {
    id: "to_the_moon",
    name: "飞向月球",
    description: "累计飞行 384,400 公里",
    icon: "🌙",
    condition: { type: "distance", target: 384400 },
    reward: { coins: 50000, gems: 50, exp: 5000 },
  },

  // ── Collection ──
  {
    id: "collector_5",
    name: "入门收藏家",
    description: "发现 5 种飞机",
    icon: "📖",
    condition: { type: "planes", target: 5 },
    reward: { coins: 1000, exp: 100 },
  },
  {
    id: "collector_15",
    name: "资深收藏家",
    description: "发现 15 种飞机",
    icon: "📚",
    condition: { type: "planes", target: 15 },
    reward: { coins: 5000, gems: 5, exp: 500 },
  },
  {
    id: "collector_all",
    name: "大师图鉴",
    description: "发现所有飞机",
    icon: "🏆",
    condition: { type: "planes", target: 30 },
    reward: { coins: 100000, gems: 100, exp: 10000 },
  },

  // ── Cities ──
  {
    id: "explorer_5",
    name: "初级旅行者",
    description: "解锁 5 个城市",
    icon: "🗺",
    condition: { type: "cities", target: 5 },
    reward: { coins: 2000, exp: 200 },
  },
  {
    id: "explorer_all",
    name: "全球通",
    description: "解锁所有城市",
    icon: "🌐",
    condition: { type: "cities", target: 15 },
    reward: { coins: 20000, gems: 20, exp: 2000 },
  },

  // ── Stories ──
  {
    id: "storyteller",
    name: "故事收集者",
    description: "阅读 10 个乘客故事",
    icon: "📝",
    condition: { type: "stories", target: 10 },
    reward: { coins: 1500, exp: 150 },
  },

  // ── Diaries ──
  {
    id: "diary_reader",
    name: "日记爱好者",
    description: "阅读 20 篇飞机日记",
    icon: "📓",
    condition: { type: "diary", target: 20 },
    reward: { coins: 1000, exp: 100 },
  },

  // ── Leveling ──
  {
    id: "level_5",
    name: "成长中的机长",
    description: "达到 5 级",
    icon: "⭐",
    condition: { type: "level", target: 5 },
    reward: { coins: 3000, exp: 0 },
  },
  {
    id: "level_10",
    name: "资深机长",
    description: "达到 10 级",
    icon: "🌟",
    condition: { type: "level", target: 10 },
    reward: { coins: 10000, gems: 10 },
  },
  {
    id: "level_20",
    name: "传奇机长",
    description: "达到 20 级",
    icon: "💫",
    condition: { type: "level", target: 20 },
    reward: { coins: 50000, gems: 50 },
  },

  // ── Wealth ──
  {
    id: "first_million",
    name: "百万富翁",
    description: "累计拥有 1,000,000 金币",
    icon: "💰",
    condition: { type: "coins", target: 1000000 },
    reward: { gems: 100 },
  },
];
