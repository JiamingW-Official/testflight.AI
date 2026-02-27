"use client";

// ============================================
// SKYLOG — Game Canvas Wrapper
// Dynamic import with SSR disabled for PixiJS
// ============================================

import dynamic from "next/dynamic";

const AirportScene = dynamic(
  () => import("@/components/game/AirportScene"),
  { ssr: false }
);

export default function GameCanvas() {
  return <AirportScene />;
}
