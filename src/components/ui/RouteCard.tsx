"use client";

import { motion } from "framer-motion";
import type { Route, Plane } from "@/types";
import { CITIES } from "@/data/cities";

interface RouteCardProps {
  route: Route;
  plane: Plane | undefined;
  onTap: () => void;
}

export default function RouteCard({ route, plane, onTap }: RouteCardProps) {
  const fromCity = CITIES.find((c) => c.id === route.from);
  const toCity = CITIES.find((c) => c.id === route.to);
  if (!fromCity || !toCity) return null;

  const isFlying =
    plane?.flightStatus === "airborne" ||
    plane?.flightStatus === "taxiing" ||
    plane?.flightStatus === "landing";
  const isAssigned = !!plane;

  const accentClass = isFlying
    ? "border-amber/30"
    : isAssigned
      ? "border-skyblue/30"
      : "border-white/5";

  return (
    <motion.button
      layout
      onClick={onTap}
      className={`glass-dark w-full rounded-xl border p-3 text-left transition-colors active:scale-[0.98] ${accentClass}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Top row: route + distance */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-cream">
            {fromCity.name}
          </span>
          <span className="text-[10px] text-cream/30">→</span>
          <span className="text-xs font-bold text-cream">
            {toCity.name}
          </span>
        </div>
        <span className="text-[10px] text-cream/40 font-mono">
          {route.distance.toLocaleString()} km
        </span>
      </div>

      {/* Bottom row: revenue, demand, plane status */}
      <div className="mt-1.5 flex items-center gap-3">
        <span className="text-[10px] text-amber/80">
          ¥{route.baseRevenue}
        </span>
        <span className="text-[10px] text-skyblue/60">
          需求{Math.round(route.demand * 100)}%
        </span>
        <span className="text-[10px] text-cream/30">
          {Math.floor(route.flightDuration / 60)}h{route.flightDuration % 60}m
        </span>

        <span className="ml-auto">
          {isFlying ? (
            <span className="flex items-center gap-1 text-[10px] text-amber">
              <span className="animate-pulse">✈</span>
              {plane.nickname} {Math.round(plane.flightProgress * 100)}%
            </span>
          ) : isAssigned ? (
            <span className="text-[10px] text-skyblue/70">
              ✈ {plane.nickname}
            </span>
          ) : (
            <span className="text-[10px] text-cream/20">空闲</span>
          )}
        </span>
      </div>
    </motion.button>
  );
}
