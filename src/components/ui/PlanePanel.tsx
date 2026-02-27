"use client";

// ============================================
// SKYLOG — PlanePanel
// Slide-out side panel showing plane soul:
// identity, stats, mood/bond, diary entries
// ============================================

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/stores/gameStore";
import { usePlaneStore } from "@/stores/planeStore";
import { usePlayerStore } from "@/stores/playerStore";
import { useDiary } from "@/hooks/useDiary";
import { PLANE_MODELS } from "@/data/planes";
import { CITIES } from "@/data/cities";
import { RARITY_COLORS, RARITY_LABELS } from "@/lib/gameUtils";
import { planeExpForLevel } from "@/lib/gameUtils";
import type { Plane, PlanePersonality, DiaryMood } from "@/types";

const PERSONALITY_LABELS: Record<PlanePersonality, { name: string; desc: string }> = {
  dreamer: { name: "梦想家", desc: "爱幻想，日记充满诗意" },
  steady: { name: "可靠者", desc: "冷静稳重，关注数据" },
  adventurer: { name: "冒险家", desc: "热血冲动，渴望新航线" },
  gentle: { name: "温柔者", desc: "关心乘客，细腻体贴" },
  proud: { name: "骄傲者", desc: "自信出众，追求完美" },
  shy: { name: "害羞者", desc: "内向安静，慢热深刻" },
};

const MOOD_EMOJI: Record<DiaryMood, string> = {
  happy: "😊",
  tired: "😴",
  excited: "🤩",
  melancholy: "🥺",
  peaceful: "😌",
};

const MOOD_LABEL: Record<DiaryMood, string> = {
  happy: "开心",
  tired: "疲惫",
  excited: "兴奋",
  melancholy: "忧郁",
  peaceful: "平静",
};

export default function PlanePanel() {
  const selectedPlaneId = useGameStore((s) => s.selectedPlaneId);
  const setSelectedPlane = useGameStore((s) => s.setSelectedPlane);
  const planes = usePlaneStore((s) => s.planes);
  const routes = usePlaneStore((s) => s.routes);
  const incrementDiariesRead = usePlayerStore((s) => s.incrementDiariesRead);
  const { generateDiary, isGenerating } = useDiary();
  const scrollRef = useRef<HTMLDivElement>(null);

  const plane = planes.find((p) => p.instanceId === selectedPlaneId);
  const model = plane ? PLANE_MODELS.find((m) => m.id === plane.modelId) : null;

  // Scroll to bottom when new diary appears
  useEffect(() => {
    if (scrollRef.current && plane?.diaries.length) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [plane?.diaries.length]);

  const handleGenerateDiary = async () => {
    if (!plane) return;
    const diary = await generateDiary(plane);
    if (diary) {
      incrementDiariesRead();
    }
  };

  // Find assigned route info
  const assignedRoute = plane?.assignedRoute
    ? routes.find((r) => r.id === plane.assignedRoute)
    : null;
  const fromCity = assignedRoute ? CITIES.find((c) => c.id === assignedRoute.from) : null;
  const toCity = assignedRoute ? CITIES.find((c) => c.id === assignedRoute.to) : null;

  return (
    <AnimatePresence>
      {plane && model && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setSelectedPlane(null)}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm overflow-hidden"
          >
            <div className="flex h-full flex-col bg-navy/95 backdrop-blur-xl">

              {/* ── Header ── */}
              <div className="relative px-5 pt-5 pb-4">
                {/* Accent gradient */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: `linear-gradient(135deg, ${plane.color}40, transparent)`,
                  }}
                />

                <div className="relative flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {/* Plane avatar */}
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: plane.color + "30" }}
                    >
                      <span className="text-2xl">✈</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-cream">{plane.nickname}</h2>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-cream/50">{model.name}</span>
                        <span
                          className="text-[10px] rounded-full px-1.5 py-0.5"
                          style={{
                            backgroundColor: RARITY_COLORS[model.rarity] + "20",
                            color: RARITY_COLORS[model.rarity],
                          }}
                        >
                          {RARITY_LABELS[model.rarity]}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedPlane(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-cream/50 transition-colors hover:bg-white/10 hover:text-cream"
                  >
                    ✕
                  </button>
                </div>

                {/* Personality badge */}
                <div className="relative mt-3 flex items-center gap-2">
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={{ backgroundColor: plane.color + "20", color: plane.color }}
                  >
                    {PERSONALITY_LABELS[plane.personality].name}
                  </span>
                  <span className="text-[11px] text-cream/40">
                    {PERSONALITY_LABELS[plane.personality].desc}
                  </span>
                </div>
              </div>

              {/* ── Stats Grid ── */}
              <div className="grid grid-cols-2 gap-2 px-5 pb-4">
                <StatCard label="等级" value={`Lv.${plane.level}`} sub={`${plane.exp}/${planeExpForLevel(plane.level)} EXP`} />
                <StatCard label="心情" value={moodBar(plane.mood)} sub={plane.mood > 70 ? "状态很好" : plane.mood > 40 ? "还行" : "需要休息"} />
                <StatCard label="羁绊" value={bondBar(plane.bond)} sub={bondLabel(plane.bond)} />
                <StatCard
                  label="飞行"
                  value={`${plane.totalFlights} 次`}
                  sub={`${Math.round(plane.totalDistance).toLocaleString()} km`}
                />
              </div>

              {/* ── Current Route ── */}
              {assignedRoute && fromCity && toCity && (
                <div className="mx-5 mb-3 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
                  <span className="text-xs text-skyblue">🗺</span>
                  <span className="text-xs text-cream/70">
                    {fromCity.name} → {toCity.name}
                  </span>
                  <span className="ml-auto text-[10px] text-cream/40">
                    {assignedRoute.distance} km
                  </span>
                </div>
              )}

              {/* ── Diary Section ── */}
              <div className="flex items-center justify-between px-5 pb-2">
                <h3 className="text-sm font-bold text-cream/70">
                  {plane.nickname} 的日记 ({plane.diaries.length})
                </h3>
                <button
                  onClick={handleGenerateDiary}
                  disabled={isGenerating}
                  className="flex items-center gap-1 rounded-full bg-skyblue/20 px-3 py-1 text-[11px] text-skyblue transition-all hover:bg-skyblue/30 active:scale-95 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <span className="inline-block animate-spin">⟳</span>
                      写日记中...
                    </>
                  ) : (
                    <>✏ 写日记</>
                  )}
                </button>
              </div>

              {/* ── Diary Entries (scrollable) ── */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pb-6 space-y-3">
                {plane.diaries.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <span className="text-3xl opacity-30">📓</span>
                    <p className="text-xs text-cream/30">
                      {plane.nickname} 还没有写过日记。
                      <br />
                      点击"写日记"让 {plane.nickname} 记录今天。
                    </p>
                  </div>
                ) : (
                  plane.diaries.map((diary) => (
                    <motion.div
                      key={diary.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="rounded-xl bg-white/5 p-3"
                    >
                      {/* Diary header */}
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{MOOD_EMOJI[diary.mood]}</span>
                          <span className="text-[10px] text-cream/40">
                            {MOOD_LABEL[diary.mood]}
                          </span>
                        </div>
                        <span className="text-[10px] text-cream/30">
                          {formatTime(diary.createdAt)}
                        </span>
                      </div>

                      {/* Diary content */}
                      <p className="text-[13px] leading-relaxed text-cream/80">
                        {diary.content}
                      </p>

                      {/* Diary footer */}
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-cream/30">
                        {diary.weather && <span>🌤 {diary.weather}</span>}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Sub-components ──

function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub: string }) {
  return (
    <div className="rounded-xl bg-white/5 px-3 py-2">
      <p className="text-[10px] text-cream/40">{label}</p>
      <div className="text-sm font-bold text-cream">{value}</div>
      <p className="text-[10px] text-cream/30">{sub}</p>
    </div>
  );
}

function moodBar(mood: number) {
  const emoji = mood > 70 ? "😊" : mood > 40 ? "😐" : "😟";
  return (
    <div className="flex items-center gap-1.5">
      <span>{emoji}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${mood}%`,
            backgroundColor: mood > 70 ? "#34D399" : mood > 40 ? "#FBBF24" : "#EF4444",
          }}
        />
      </div>
      <span className="text-[10px] text-cream/50 font-mono w-6 text-right">{mood}</span>
    </div>
  );
}

function bondBar(bond: number) {
  return (
    <div className="flex items-center gap-1.5">
      <span>💕</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-pink-400 transition-all duration-500"
          style={{ width: `${bond}%` }}
        />
      </div>
      <span className="text-[10px] text-cream/50 font-mono w-6 text-right">{bond}</span>
    </div>
  );
}

function bondLabel(bond: number): string {
  if (bond > 80) return "灵魂伴侣";
  if (bond > 60) return "亲密伙伴";
  if (bond > 40) return "好朋友";
  if (bond > 20) return "逐渐熟悉";
  return "初次见面";
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);

  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin} 分钟前`;
  if (diffHour < 24) return `${diffHour} 小时前`;

  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}
