"use client";

import { useGameLoop } from "@/hooks/useGameLoop";
import { usePlayerStore } from "@/stores/playerStore";
import { usePlaneStore } from "@/stores/planeStore";
import { useGameStore } from "@/stores/gameStore";
import { PLANE_MODELS } from "@/data/planes";
import { RARITY_COLORS, RARITY_LABELS } from "@/lib/gameUtils";
import { expForLevel } from "@/types";
import GameCanvas from "@/components/game/GameCanvas";
import PlanePanel from "@/components/ui/PlanePanel";

export default function Home() {
  useGameLoop();

  const player = usePlayerStore();
  const planes = usePlaneStore((s) => s.planes);
  const routes = usePlaneStore((s) => s.routes);
  const dayPhase = useGameStore((s) => s.dayPhase);
  const setSelectedPlane = useGameStore((s) => s.setSelectedPlane);

  const expNeeded = expForLevel(player.level);
  const expPercent = Math.min(100, Math.round((player.exp / expNeeded) * 100));

  const dayLabel: Record<string, string> = {
    dawn: "🌅 黎明",
    day: "☀ 白天",
    dusk: "🌇 黄昏",
    night: "🌙 夜晚",
  };

  return (
    <>
      {/* PixiJS Canvas — full screen background */}
      <GameCanvas />

      {/* UI Overlay — pointer-events: none on container, auto on children */}
      <div className="ui-overlay">
        {/* ── HUD: Top Bar ── */}
        <header className="glass-dark flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-skyblue/20">
              <span className="text-base">✈</span>
            </div>
            <div>
              <p className="text-xs font-bold text-cream">
                Lv.{player.level} {player.name}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <div className="h-1 w-16 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-skyblue transition-all duration-500"
                    style={{ width: `${expPercent}%` }}
                  />
                </div>
                <span className="text-[9px] text-cream/40">{player.exp}/{expNeeded}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-full bg-amber/10 px-2.5 py-1">
              <span className="text-[10px]">🪙</span>
              <span className="text-xs font-bold text-amber font-mono">
                {player.coins.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-1">
              <span className="text-[10px]">💎</span>
              <span className="text-xs font-bold text-purple-300 font-mono">
                {player.gems}
              </span>
            </div>
          </div>
        </header>

        {/* ── Day Phase + Info Bar ── */}
        <div className="mx-4 mt-2 flex items-center justify-between">
          <span className="glass-dark rounded-full px-3 py-1 text-[11px] text-cream/70">
            {dayLabel[dayPhase]} · {routes.length} 条航线
          </span>
          <span className="glass-dark rounded-full px-3 py-1 text-[11px] text-cream/70">
            {planes.filter((p) => p.flightStatus === "airborne" || p.flightStatus === "taxiing" || p.flightStatus === "landing").length} 架飞行中
          </span>
        </div>

        {/* ── Fleet Mini Cards (bottom-left) ── */}
        <div className="fixed bottom-16 left-3 right-3 max-h-[35vh] overflow-y-auto space-y-2 pb-2">
          {planes.map((plane) => {
            const model = PLANE_MODELS.find((m) => m.id === plane.modelId);
            if (!model) return null;
            const moodEmoji =
              plane.mood > 70 ? "😊" : plane.mood > 40 ? "😐" : "😟";

            const isFlying = plane.flightStatus === "airborne" || plane.flightStatus === "taxiing" || plane.flightStatus === "landing";

            return (
              <button
                key={plane.instanceId}
                onClick={() => setSelectedPlane(plane.instanceId)}
                className="glass-dark flex w-full items-center gap-2.5 rounded-xl p-2.5 text-left transition-all active:scale-[0.97]"
              >
                {/* Plane accent */}
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
                  style={{ backgroundColor: plane.color + "25" }}
                >
                  <span className={`text-base ${isFlying ? "animate-pulse" : ""}`}>✈</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-cream truncate">
                      {plane.nickname}
                    </span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: RARITY_COLORS[model.rarity] + "20",
                        color: RARITY_COLORS[model.rarity],
                      }}
                    >
                      {RARITY_LABELS[model.rarity]}
                    </span>
                  </div>
                  <p className="text-[10px] text-cream/40 truncate">
                    {model.name} · Lv.{plane.level}
                  </p>
                </div>

                {/* Status */}
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  <span className="text-[11px]">
                    {moodEmoji} {plane.mood}
                  </span>
                  <span className={`text-[10px] ${isFlying ? "text-amber" : "text-skyblue/60"}`}>
                    {plane.flightStatus === "idle" && "待命"}
                    {plane.flightStatus === "taxiing" && "滑行..."}
                    {plane.flightStatus === "airborne" && `${Math.round(plane.flightProgress * 100)}%`}
                    {plane.flightStatus === "landing" && "降落..."}
                    {plane.flightStatus === "arrived" && "已到达"}
                    {plane.flightStatus === "boarding" && "登机..."}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Bottom Nav ── */}
        <nav className="glass-dark fixed bottom-0 left-0 right-0 flex items-center justify-around px-1 py-1.5">
          {[
            { icon: "🏠", label: "机场", active: true },
            { icon: "✈", label: "机队", active: false },
            { icon: "🗺", label: "航线", active: false },
            { icon: "📖", label: "图鉴", active: false },
            { icon: "⚙", label: "更多", active: false },
          ].map((tab) => (
            <button
              key={tab.label}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-4 py-1 transition-all active:scale-90
                ${tab.active ? "text-skyblue" : "text-cream/40 hover:text-cream/60"}`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-[9px] font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* ── Plane Detail Panel ── */}
      <PlanePanel />
    </>
  );
}
