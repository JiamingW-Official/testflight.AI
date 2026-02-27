// ============================================
// SKYLOG — Day/Night Color Palettes for PixiJS
// ============================================

export interface SkyPalette {
  skyTop: number;
  skyBottom: number;
  ground: number;
  groundAccent: number;
  runway: number;
  runwayMarking: number;
  buildingBase: number;
  buildingAccent: number;
  windowGlow: number;
  ambient: number;
  shadow: number;
  starAlpha: number;
}

const PALETTES: Record<string, SkyPalette> = {
  dawn: {
    skyTop: 0x1a0a2e,
    skyBottom: 0xd4607a,
    ground: 0x2d4a3e,
    groundAccent: 0x3d5a4e,
    runway: 0x4a4a5a,
    runwayMarking: 0xccccdd,
    buildingBase: 0x3a3a4a,
    buildingAccent: 0x5a4a6a,
    windowGlow: 0xffd080,
    ambient: 0xd4607a,
    shadow: 0x1a1a2a,
    starAlpha: 0.3,
  },
  day: {
    skyTop: 0x4da8da,
    skyBottom: 0x87ceeb,
    ground: 0x5a9a6a,
    groundAccent: 0x6aaa7a,
    runway: 0x6a6a7a,
    runwayMarking: 0xffffff,
    buildingBase: 0x8a8a9a,
    buildingAccent: 0x9a9aaa,
    windowGlow: 0x8acfef,
    ambient: 0xffffff,
    shadow: 0x3a5a4a,
    starAlpha: 0,
  },
  dusk: {
    skyTop: 0x2d1b4e,
    skyBottom: 0xf0a500,
    ground: 0x4a5a3a,
    groundAccent: 0x5a6a4a,
    runway: 0x5a5a6a,
    runwayMarking: 0xddddcc,
    buildingBase: 0x5a4a3a,
    buildingAccent: 0x7a5a3a,
    windowGlow: 0xffaa40,
    ambient: 0xf0a500,
    shadow: 0x2a1a1a,
    starAlpha: 0.2,
  },
  night: {
    skyTop: 0x0a0a1a,
    skyBottom: 0x1a2332,
    ground: 0x1a2a2a,
    groundAccent: 0x2a3a3a,
    runway: 0x2a2a3a,
    runwayMarking: 0x6a6a8a,
    buildingBase: 0x2a2a3a,
    buildingAccent: 0x3a3a4a,
    windowGlow: 0xffd060,
    ambient: 0x4da8da,
    shadow: 0x0a0a1a,
    starAlpha: 1,
  },
};

export function getPalette(phase: string): SkyPalette {
  return PALETTES[phase] ?? PALETTES.day;
}

/** Interpolate between two palettes */
export function lerpPalette(a: SkyPalette, b: SkyPalette, t: number): SkyPalette {
  const lerp = (x: number, y: number) => {
    const xr = (x >> 16) & 0xff, xg = (x >> 8) & 0xff, xb = x & 0xff;
    const yr = (y >> 16) & 0xff, yg = (y >> 8) & 0xff, yb = y & 0xff;
    const r = Math.round(xr + (yr - xr) * t);
    const g = Math.round(xg + (yg - xg) * t);
    const bl = Math.round(xb + (yb - xb) * t);
    return (r << 16) | (g << 8) | bl;
  };
  return {
    skyTop: lerp(a.skyTop, b.skyTop),
    skyBottom: lerp(a.skyBottom, b.skyBottom),
    ground: lerp(a.ground, b.ground),
    groundAccent: lerp(a.groundAccent, b.groundAccent),
    runway: lerp(a.runway, b.runway),
    runwayMarking: lerp(a.runwayMarking, b.runwayMarking),
    buildingBase: lerp(a.buildingBase, b.buildingBase),
    buildingAccent: lerp(a.buildingAccent, b.buildingAccent),
    windowGlow: lerp(a.windowGlow, b.windowGlow),
    ambient: lerp(a.ambient, b.ambient),
    shadow: lerp(a.shadow, b.shadow),
    starAlpha: a.starAlpha + (b.starAlpha - a.starAlpha) * t,
  };
}
