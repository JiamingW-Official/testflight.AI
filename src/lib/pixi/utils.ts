// ============================================
// SKYLOG — PixiJS Utility Functions (Complete)
// Isometric math, drawing helpers
// ============================================

/** Tile size for the isometric grid */
export const TILE_W = 64;
export const TILE_H = 32;

/** Convert cartesian grid (col, row) to isometric screen coordinates */
export function toIso(col: number, row: number): { x: number; y: number } {
  return {
    x: (col - row) * (TILE_W / 2),
    y: (col + row) * (TILE_H / 2),
  };
}

/** Convert screen coordinates back to grid (col, row) */
export function fromIso(screenX: number, screenY: number): { col: number; row: number } {
  return {
    col: (screenX / (TILE_W / 2) + screenY / (TILE_H / 2)) / 2,
    row: (screenY / (TILE_H / 2) - screenX / (TILE_W / 2)) / 2,
  };
}

/** Draw an isometric diamond (flat tile) */
export function isoTilePath(
  g: { moveTo: (x: number, y: number) => unknown; lineTo: (x: number, y: number) => unknown; closePath: () => unknown },
  cx: number, cy: number, w: number, h: number,
) {
  g.moveTo(cx, cy - h / 2);       // top
  g.lineTo(cx + w / 2, cy);       // right
  g.lineTo(cx, cy + h / 2);       // bottom
  g.lineTo(cx - w / 2, cy);       // left
  g.closePath();
}

/** Draw an isometric box (3D extruded tile) */
export function isoBoxPath(
  g: {
    moveTo: (x: number, y: number) => unknown;
    lineTo: (x: number, y: number) => unknown;
    closePath: () => unknown;
  },
  cx: number, cy: number,
  w: number, h: number, depth: number,
  face: "top" | "left" | "right",
) {
  if (face === "top") {
    g.moveTo(cx, cy - depth - h / 2);
    g.lineTo(cx + w / 2, cy - depth);
    g.lineTo(cx, cy - depth + h / 2);
    g.lineTo(cx - w / 2, cy - depth);
    g.closePath();
  } else if (face === "left") {
    g.moveTo(cx - w / 2, cy - depth);
    g.lineTo(cx, cy - depth + h / 2);
    g.lineTo(cx, cy + h / 2);
    g.lineTo(cx - w / 2, cy);
    g.closePath();
  } else {
    g.moveTo(cx + w / 2, cy - depth);
    g.lineTo(cx, cy - depth + h / 2);
    g.lineTo(cx, cy + h / 2);
    g.lineTo(cx + w / 2, cy);
    g.closePath();
  }
}

/** Lighten a hex color by a factor (0-1) */
export function lighten(color: number, factor: number): number {
  const r = Math.min(255, ((color >> 16) & 0xff) + Math.round(255 * factor));
  const g = Math.min(255, ((color >> 8) & 0xff) + Math.round(255 * factor));
  const b = Math.min(255, (color & 0xff) + Math.round(255 * factor));
  return (r << 16) | (g << 8) | b;
}

/** Darken a hex color by a factor (0-1) */
export function darken(color: number, factor: number): number {
  const r = Math.max(0, Math.round(((color >> 16) & 0xff) * (1 - factor)));
  const g = Math.max(0, Math.round(((color >> 8) & 0xff) * (1 - factor)));
  const b = Math.max(0, Math.round((color & 0xff) * (1 - factor)));
  return (r << 16) | (g << 8) | b;
}

/** Easing functions */
export const ease = {
  inOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  out: (t: number) => t * (2 - t),
  in: (t: number) => t * t,
  outBack: (t: number) => {
    const c = 1.70158;
    return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
  },
};
