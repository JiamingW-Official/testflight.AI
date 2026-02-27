import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile PixiJS for compatibility
  transpilePackages: ["pixi.js"],

  // Optimize for production
  poweredByHeader: false,

  // Allow PWA service worker
  headers: async () => [
    {
      source: "/manifest.json",
      headers: [
        { key: "Content-Type", value: "application/manifest+json" },
      ],
    },
  ],
};

export default nextConfig;
