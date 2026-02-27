"use client";

import { usePlaneStore } from "@/stores/planeStore";
import { useGameStore } from "@/stores/gameStore";
import { useRouteFilters } from "@/hooks/useRouteFilters";
import type { SortKey } from "@/hooks/useRouteFilters";
import CityBar from "./CityBar";
import RouteCard from "./RouteCard";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "distance", label: "距离" },
  { key: "revenue", label: "收入" },
  { key: "demand", label: "需求" },
];

export default function RoutePanel() {
  const routes = usePlaneStore((s) => s.routes);
  const planes = usePlaneStore((s) => s.planes);
  const setActivePanel = useGameStore((s) => s.setActivePanel);

  const {
    filtered,
    sortKey,
    setSortKey,
    filterCity,
    setFilterCity,
    activeCount,
  } = useRouteFilters(routes);

  const handleRouteTap = (routeId: string) => {
    setActivePanel(`route:${routeId}`);
  };

  return (
    <div className="flex flex-col gap-0 pt-2">
      {/* City Bar */}
      <CityBar filterCity={filterCity} onSelectCity={setFilterCity} />

      {/* Filter bar */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-cream/30">排序:</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortKey(opt.key)}
              className={`rounded-full px-2 py-0.5 text-[10px] transition-all active:scale-95
                ${sortKey === opt.key ? "bg-skyblue/20 text-skyblue" : "bg-white/5 text-cream/40"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-cream/30">
          {activeCount}条运营中 / 共{filtered.length}条航线
        </span>
      </div>

      {/* Route list */}
      <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-20">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <span className="text-3xl opacity-30">🗺</span>
            <p className="text-xs text-cream/30">
              {filterCity ? "该城市暂无航线" : "暂无可用航线"}
            </p>
          </div>
        ) : (
          filtered.map((route) => {
            const plane = route.assignedPlaneId
              ? planes.find((p) => p.instanceId === route.assignedPlaneId)
              : undefined;
            return (
              <RouteCard
                key={route.id}
                route={route}
                plane={plane}
                onTap={() => handleRouteTap(route.id)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
