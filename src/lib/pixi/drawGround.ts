// ============================================
// SKYLOG — Ground & Runway Drawing
// Isometric ground tiles, runway, taxiway
// ============================================

import type { Graphics } from "pixi.js";
import type { SkyPalette } from "./colors";
import { TILE_W, TILE_H, toIso, darken, lighten } from "./utils";

const GRID_SIZE = 20; // 20x20 tile grid

/** Draw the isometric ground plane */
export function drawGround(g: Graphics, palette: SkyPalette, cx: number, cy: number) {
  g.clear();

  // Draw grass tiles
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const pos = toIso(col, row);
      const x = cx + pos.x;
      const y = cy + pos.y;

      // Checkerboard grass pattern
      const isAlt = (col + row) % 2 === 0;
      const color = isAlt ? palette.ground : palette.groundAccent;

      g.moveTo(x, y - TILE_H / 2);
      g.lineTo(x + TILE_W / 2, y);
      g.lineTo(x, y + TILE_H / 2);
      g.lineTo(x - TILE_W / 2, y);
      g.closePath();
      g.fill(color);
    }
  }
}

/** Draw the main runway */
export function drawRunway(g: Graphics, palette: SkyPalette, cx: number, cy: number) {
  g.clear();

  // Runway runs from ~col 2 to col 18, at row 10 (center-ish)
  const runwayRow = 10;
  const startCol = 1;
  const endCol = 18;

  // Runway surface (3 tiles wide)
  for (let col = startCol; col <= endCol; col++) {
    for (let rowOff = -1; rowOff <= 1; rowOff++) {
      const pos = toIso(col, runwayRow + rowOff);
      const x = cx + pos.x;
      const y = cy + pos.y;

      g.moveTo(x, y - TILE_H / 2);
      g.lineTo(x + TILE_W / 2, y);
      g.lineTo(x, y + TILE_H / 2);
      g.lineTo(x - TILE_W / 2, y);
      g.closePath();
      g.fill(palette.runway);
    }
  }

  // Center line markings (dashed)
  for (let col = startCol + 1; col <= endCol - 1; col += 2) {
    const pos = toIso(col, runwayRow);
    const x = cx + pos.x;
    const y = cy + pos.y;

    // Small diamond marking
    const mw = TILE_W * 0.3;
    const mh = TILE_H * 0.3;
    g.moveTo(x, y - mh / 2);
    g.lineTo(x + mw / 2, y);
    g.lineTo(x, y + mh / 2);
    g.lineTo(x - mw / 2, y);
    g.closePath();
    g.fill(palette.runwayMarking);
  }

  // Threshold markings (start)
  for (let rowOff = -1; rowOff <= 1; rowOff++) {
    const pos = toIso(startCol, runwayRow + rowOff);
    const x = cx + pos.x;
    const y = cy + pos.y;
    const mw = TILE_W * 0.6;
    const mh = TILE_H * 0.6;
    g.moveTo(x, y - mh / 2);
    g.lineTo(x + mw / 2, y);
    g.lineTo(x, y + mh / 2);
    g.lineTo(x - mw / 2, y);
    g.closePath();
    g.fill(palette.runwayMarking);
  }

  // Threshold markings (end)
  for (let rowOff = -1; rowOff <= 1; rowOff++) {
    const pos = toIso(endCol, runwayRow + rowOff);
    const x = cx + pos.x;
    const y = cy + pos.y;
    const mw = TILE_W * 0.6;
    const mh = TILE_H * 0.6;
    g.moveTo(x, y - mh / 2);
    g.lineTo(x + mw / 2, y);
    g.lineTo(x, y + mh / 2);
    g.lineTo(x - mw / 2, y);
    g.closePath();
    g.fill(palette.runwayMarking);
  }

  // Taxiway (connects runway to terminal area)
  const taxiCol = 10;
  for (let row = runwayRow + 2; row <= runwayRow + 5; row++) {
    const pos = toIso(taxiCol, row);
    const x = cx + pos.x;
    const y = cy + pos.y;
    g.moveTo(x, y - TILE_H / 2);
    g.lineTo(x + TILE_W / 2, y);
    g.lineTo(x, y + TILE_H / 2);
    g.lineTo(x - TILE_W / 2, y);
    g.closePath();
    g.fill(lighten(palette.runway, 0.05));
  }

  // Runway edge lights (small dots)
  for (let col = startCol; col <= endCol; col += 1) {
    for (const rowOff of [-1.5, 1.5]) {
      const pos = toIso(col, runwayRow + rowOff);
      const x = cx + pos.x;
      const y = cy + pos.y;
      g.circle(x, y, 1.5);
      g.fill(palette.ambient);
    }
  }
}

/** Draw apron / parking area */
export function drawApron(g: Graphics, palette: SkyPalette, cx: number, cy: number) {
  // Parking apron near terminal
  const apronRow = 16;
  for (let col = 6; col <= 14; col++) {
    for (let rowOff = 0; rowOff <= 2; rowOff++) {
      const pos = toIso(col, apronRow + rowOff);
      const x = cx + pos.x;
      const y = cy + pos.y;
      g.moveTo(x, y - TILE_H / 2);
      g.lineTo(x + TILE_W / 2, y);
      g.lineTo(x, y + TILE_H / 2);
      g.lineTo(x - TILE_W / 2, y);
      g.closePath();
      g.fill(darken(palette.runway, 0.1));
    }
  }

  // Gate markings (parking lines)
  for (let col = 7; col <= 13; col += 2) {
    const pos = toIso(col, apronRow + 1);
    const x = cx + pos.x;
    const y = cy + pos.y;
    g.rect(x - 1, y - 8, 2, 16);
    g.fill(palette.runwayMarking);
  }
}

/** Runway position info for plane animations */
export const RUNWAY = {
  startCol: 1,
  endCol: 18,
  row: 10,
  taxiCol: 10,
  taxiEndRow: 15,
  apronRow: 16,
  gateStartCol: 7,
  gateSpacing: 2,
};
