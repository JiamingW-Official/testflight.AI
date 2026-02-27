"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CITIES } from "@/data/cities";
import { usePlayerStore } from "@/stores/playerStore";
import { usePlaneStore } from "@/stores/planeStore";

interface CityBarProps {
  filterCity: string | null;
  onSelectCity: (cityId: string | null) => void;
}

export default function CityBar({ filterCity, onSelectCity }: CityBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const level = usePlayerStore((s) => s.level);
  const unlockedCities = usePlayerStore((s) => s.unlockedCities);
  const unlockCity = usePlayerStore((s) => s.unlockCity);
  const refreshRoutes = usePlaneStore((s) => s.refreshRoutes);
  const [toastCity, setToastCity] = useState<string | null>(null);

  // Sort cities: unlocked first, then unlockable, then locked
  const sortedCities = [...CITIES].sort((a, b) => {
    const aUnlocked = unlockedCities.includes(a.id);
    const bUnlocked = unlockedCities.includes(b.id);
    if (aUnlocked && !bUnlocked) return -1;
    if (!aUnlocked && bUnlocked) return 1;
    const aCanUnlock = !aUnlocked && level >= a.unlockLevel;
    const bCanUnlock = !bUnlocked && level >= b.unlockLevel;
    if (aCanUnlock && !bCanUnlock) return -1;
    if (!aCanUnlock && bCanUnlock) return 1;
    return a.unlockLevel - b.unlockLevel;
  });

  const handleTap = (cityId: string) => {
    const isUnlocked = unlockedCities.includes(cityId);
    const city = CITIES.find((c) => c.id === cityId);
    if (!city) return;

    if (isUnlocked) {
      // Toggle filter
      onSelectCity(filterCity === cityId ? null : cityId);
    } else if (level >= city.unlockLevel) {
      // Unlock city
      unlockCity(cityId);
      const newCities = [...unlockedCities, cityId];
      refreshRoutes(newCities);
      setToastCity(city.name);
      setTimeout(() => setToastCity(null), 2000);
    }
  };

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-hide"
      >
        {/* "All" pill */}
        <button
          onClick={() => onSelectCity(null)}
          className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-all active:scale-95
            ${!filterCity ? "bg-skyblue/20 text-skyblue" : "bg-white/5 text-cream/40"}`}
        >
          全部
        </button>

        {sortedCities.map((city) => {
          const isUnlocked = unlockedCities.includes(city.id);
          const canUnlock = !isUnlocked && level >= city.unlockLevel;
          const isLocked = !isUnlocked && !canUnlock;
          const isActive = filterCity === city.id;

          return (
            <button
              key={city.id}
              onClick={() => handleTap(city.id)}
              disabled={isLocked}
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-all active:scale-95
                ${isActive ? "bg-skyblue/20 text-skyblue" : ""}
                ${isUnlocked && !isActive ? "bg-white/5 text-cream/60 hover:text-cream/80" : ""}
                ${canUnlock ? "border border-amber/40 bg-amber/5 text-amber/80" : ""}
                ${isLocked ? "bg-white/3 text-cream/20 cursor-not-allowed" : ""}
              `}
            >
              {canUnlock && <span className="mr-0.5">+</span>}
              {city.name}
              {isLocked && (
                <span className="ml-1 text-[9px] text-cream/15">
                  Lv.{city.unlockLevel}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Unlock toast */}
      <AnimatePresence>
        {toastCity && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-1/2 top-full z-10 -translate-x-1/2 rounded-full bg-amber/20 px-4 py-1.5 text-[11px] font-medium text-amber"
          >
            {toastCity} 已解锁！新航线已开通
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
