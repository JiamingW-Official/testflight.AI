import { useMemo, useState } from "react";
import type { Route } from "@/types";

export type SortKey = "distance" | "revenue" | "demand";

export function useRouteFilters(routes: Route[]) {
  const [sortKey, setSortKey] = useState<SortKey>("distance");
  const [filterCity, setFilterCity] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = routes;

    if (filterCity) {
      result = result.filter(
        (r) => r.from === filterCity || r.to === filterCity,
      );
    }

    result = [...result].sort((a, b) => {
      switch (sortKey) {
        case "distance":
          return a.distance - b.distance;
        case "revenue":
          return b.baseRevenue - a.baseRevenue;
        case "demand":
          return b.demand - a.demand;
        default:
          return 0;
      }
    });

    return result;
  }, [routes, sortKey, filterCity]);

  const activeCount = filtered.filter((r) => r.assignedPlaneId).length;

  return {
    filtered,
    sortKey,
    setSortKey,
    filterCity,
    setFilterCity,
    activeCount,
  };
}
