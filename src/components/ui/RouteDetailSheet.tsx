"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePlaneStore } from "@/stores/planeStore";
import { useGameStore } from "@/stores/gameStore";
import { CITIES } from "@/data/cities";
import { PLANE_MODELS } from "@/data/planes";
import { RARITY_COLORS, RARITY_LABELS } from "@/lib/gameUtils";
import type { Route, Plane } from "@/types";

export default function RouteDetailSheet() {
  const activePanel = useGameStore((s) => s.activePanel);
  const setActivePanel = useGameStore((s) => s.setActivePanel);
  const routes = usePlaneStore((s) => s.routes);
  const planes = usePlaneStore((s) => s.planes);
  const assignRoute = usePlaneStore((s) => s.assignRoute);
  const unassignRoute = usePlaneStore((s) => s.unassignRoute);
  const startFlight = usePlaneStore((s) => s.startFlight);

  // Parse "route:<routeId>" from activePanel
  const routeId =
    activePanel && activePanel.startsWith("route:") ? activePanel.slice(6) : null;
  const route = routeId ? routes.find((r) => r.id === routeId) : null;

  const fromCity = route ? CITIES.find((c) => c.id === route.from) : null;
  const toCity = route ? CITIES.find((c) => c.id === route.to) : null;
  const assignedPlane = route?.assignedPlaneId
    ? planes.find((p) => p.instanceId === route.assignedPlaneId)
    : null;

  const isFlying =
    assignedPlane?.flightStatus === "airborne" ||
    assignedPlane?.flightStatus === "taxiing" ||
    assignedPlane?.flightStatus === "landing";

  const close = () => setActivePanel(null);

  const handleAssign = (planeId: string) => {
    if (!route) return;
    assignRoute(planeId, route.id);
  };

  const handleUnassign = () => {
    if (!assignedPlane) return;
    unassignRoute(assignedPlane.instanceId);
  };

  const handleStartFlight = () => {
    if (!assignedPlane) return;
    startFlight(assignedPlane.instanceId);
  };

  // Idle/arrived planes available for assignment
  const availablePlanes = planes.filter(
    (p) =>
      p.flightStatus === "idle" || p.flightStatus === "arrived",
  );

  return (
    <AnimatePresence>
      {route && fromCity && toCity && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={close}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-hidden rounded-t-2xl"
          >
            <div className="flex flex-col bg-navy/98 backdrop-blur-xl">
              {/* Handle */}
              <div className="flex justify-center py-2">
                <div className="h-1 w-10 rounded-full bg-white/10" />
              </div>

              {/* Route header */}
              <div className="px-5 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-cream">
                    {fromCity.name}
                  </span>
                  <span className="text-sm text-cream/30">→</span>
                  <span className="text-lg font-bold text-cream">
                    {toCity.name}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-cream/30">
                  {fromCity.iata} → {toCity.iata}
                </p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-2 px-5 pb-4">
                <StatCell label="距离" value={`${route.distance.toLocaleString()}km`} />
                <StatCell
                  label="时长"
                  value={`${Math.floor(route.flightDuration / 60)}h${route.flightDuration % 60}m`}
                />
                <StatCell label="收入" value={`¥${route.baseRevenue}`} />
                <StatCell label="需求" value={`${Math.round(route.demand * 100)}%`} />
              </div>

              {/* Assigned plane section */}
              {assignedPlane ? (
                <AssignedSection
                  plane={assignedPlane}
                  route={route}
                  isFlying={isFlying}
                  onUnassign={handleUnassign}
                  onStartFlight={handleStartFlight}
                />
              ) : (
                <PlanePickerSection
                  availablePlanes={availablePlanes}
                  route={route}
                  onAssign={handleAssign}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/5 px-2 py-2 text-center">
      <p className="text-[9px] text-cream/30">{label}</p>
      <p className="text-xs font-bold text-cream">{value}</p>
    </div>
  );
}

function AssignedSection({
  plane,
  route,
  isFlying,
  onUnassign,
  onStartFlight,
}: {
  plane: Plane;
  route: Route;
  isFlying: boolean;
  onUnassign: () => void;
  onStartFlight: () => void;
}) {
  const model = PLANE_MODELS.find((m) => m.id === plane.modelId);
  const canStart =
    plane.flightStatus === "idle" || plane.flightStatus === "arrived";

  return (
    <div className="px-5 pb-6">
      <p className="mb-2 text-[10px] text-cream/30">已分配飞机</p>
      <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: plane.color + "25" }}
        >
          <span className={`text-lg ${isFlying ? "animate-pulse" : ""}`}>
            ✈
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-cream truncate">
              {plane.nickname}
            </span>
            {model && (
              <span
                className="text-[9px] rounded-full px-1.5 py-0.5"
                style={{
                  backgroundColor: RARITY_COLORS[model.rarity] + "20",
                  color: RARITY_COLORS[model.rarity],
                }}
              >
                {RARITY_LABELS[model.rarity]}
              </span>
            )}
          </div>
          <p className="text-[10px] text-cream/40">
            {model?.name} · Lv.{plane.level}
            {isFlying && (
              <span className="ml-2 text-amber">
                {Math.round(plane.flightProgress * 100)}%
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-3 flex gap-2">
        {!isFlying && (
          <button
            onClick={onUnassign}
            className="flex-1 rounded-xl bg-white/5 py-2.5 text-xs text-cream/50 transition-all hover:bg-white/10 active:scale-[0.98]"
          >
            取消分配
          </button>
        )}
        {canStart && (
          <button
            onClick={onStartFlight}
            className="flex-1 rounded-xl bg-skyblue/20 py-2.5 text-xs font-bold text-skyblue transition-all hover:bg-skyblue/30 active:scale-[0.98]"
          >
            起飞！
          </button>
        )}
        {isFlying && (
          <div className="flex-1 rounded-xl bg-amber/10 py-2.5 text-center text-xs text-amber/70">
            飞行中...
          </div>
        )}
      </div>
    </div>
  );
}

function PlanePickerSection({
  availablePlanes,
  route,
  onAssign,
}: {
  availablePlanes: Plane[];
  route: Route;
  onAssign: (planeId: string) => void;
}) {
  return (
    <div className="px-5 pb-6">
      <p className="mb-2 text-[10px] text-cream/30">
        选择飞机 ({availablePlanes.length} 架可用)
      </p>
      <div className="max-h-[30vh] space-y-2 overflow-y-auto">
        {availablePlanes.length === 0 ? (
          <div className="py-8 text-center">
            <span className="text-2xl opacity-20">✈</span>
            <p className="mt-1 text-[10px] text-cream/20">
              没有可用的飞机，所有飞机都在飞行中
            </p>
          </div>
        ) : (
          availablePlanes.map((plane) => {
            const model = PLANE_MODELS.find((m) => m.id === plane.modelId);
            if (!model) return null;

            const inRange = model.range >= route.distance;
            const moodEmoji =
              plane.mood > 70 ? "😊" : plane.mood > 40 ? "😐" : "😟";

            return (
              <button
                key={plane.instanceId}
                onClick={() => inRange && onAssign(plane.instanceId)}
                disabled={!inRange}
                className={`flex w-full items-center gap-2.5 rounded-xl p-2.5 text-left transition-all active:scale-[0.98]
                  ${inRange ? "bg-white/5 hover:bg-white/10" : "bg-white/[0.02] opacity-40 cursor-not-allowed"}`}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: plane.color + "25" }}
                >
                  <span className="text-base">✈</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-cream truncate">
                      {plane.nickname}
                    </span>
                    <span
                      className="text-[9px] rounded-full px-1.5 py-0.5"
                      style={{
                        backgroundColor: RARITY_COLORS[model.rarity] + "20",
                        color: RARITY_COLORS[model.rarity],
                      }}
                    >
                      {RARITY_LABELS[model.rarity]}
                    </span>
                  </div>
                  <p className="text-[10px] text-cream/40">
                    {model.name} · 航程{model.range.toLocaleString()}km
                    {!inRange && (
                      <span className="ml-1 text-red-400/70">航程不足</span>
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  <span className="text-[11px]">
                    {moodEmoji} {plane.mood}
                  </span>
                  <span className="text-[10px] text-cream/30">
                    Lv.{plane.level}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
