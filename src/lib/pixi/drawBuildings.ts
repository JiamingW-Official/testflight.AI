// ============================================
// SKYLOG — Building Drawing (Isometric)
// Terminal, control tower, hangars — all Graphics
// ============================================

import type { Graphics } from "pixi.js";
import type { SkyPalette } from "./colors";
import { toIso, TILE_W, TILE_H, lighten, darken } from "./utils";

/** Draw the main terminal building */
export function drawTerminal(g: Graphics, palette: SkyPalette, cx: number, cy: number) {
  // Terminal sits at rows 17-19, cols 6-14
  const baseCol = 6;
  const baseRow = 17;
  const width = 8;
  const depth = 2;
  const height = 40;

  const bl = toIso(baseCol, baseRow + depth);
  const br = toIso(baseCol + width, baseRow + depth);
  const fl = toIso(baseCol, baseRow);
  const fr = toIso(baseCol + width, baseRow);

  const bx = cx, by = cy;

  // Left face
  g.moveTo(bx + bl.x, by + bl.y);
  g.lineTo(bx + fl.x, by + fl.y);
  g.lineTo(bx + fl.x, by + fl.y - height);
  g.lineTo(bx + bl.x, by + bl.y - height);
  g.closePath();
  g.fill(darken(palette.buildingBase, 0.15));

  // Right face
  g.moveTo(bx + br.x, by + br.y);
  g.lineTo(bx + fr.x, by + fr.y);
  g.lineTo(bx + fr.x, by + fr.y - height);
  g.lineTo(bx + br.x, by + br.y - height);
  g.closePath();
  g.fill(palette.buildingBase);

  // Top face
  g.moveTo(bx + bl.x, by + bl.y - height);
  g.lineTo(bx + fl.x, by + fl.y - height);
  g.lineTo(bx + fr.x, by + fr.y - height);
  g.lineTo(bx + br.x, by + br.y - height);
  g.closePath();
  g.fill(lighten(palette.buildingBase, 0.1));

  // Roof accent line
  g.moveTo(bx + bl.x, by + bl.y - height - 3);
  g.lineTo(bx + fl.x, by + fl.y - height - 3);
  g.lineTo(bx + fr.x, by + fr.y - height - 3);
  g.lineTo(bx + br.x, by + br.y - height - 3);
  g.closePath();
  g.fill(palette.buildingAccent);

  // Windows on right face (the longer visible side)
  const windowRows = 3;
  const windowCols = 6;
  for (let wr = 0; wr < windowRows; wr++) {
    for (let wc = 0; wc < windowCols; wc++) {
      const t1 = (wc + 0.3) / windowCols;
      const t2 = (wc + 0.7) / windowCols;
      const yOff = height * (0.2 + wr * 0.25);

      // Interpolate along right face
      const x1 = bx + fr.x + (br.x - fr.x) * t1;
      const y1 = by + fr.y + (br.y - fr.y) * t1 - height + yOff;
      const x2 = bx + fr.x + (br.x - fr.x) * t2;
      const y2 = by + fr.y + (br.y - fr.y) * t2 - height + yOff;

      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.lineTo(x2, y2 + 6);
      g.lineTo(x1, y1 + 6);
      g.closePath();
      g.fill({ color: palette.windowGlow, alpha: 0.7 });
    }
  }

  // Windows on left face
  for (let wr = 0; wr < windowRows; wr++) {
    for (let wc = 0; wc < 3; wc++) {
      const t1 = (wc + 0.3) / 3;
      const t2 = (wc + 0.7) / 3;
      const yOff = height * (0.2 + wr * 0.25);

      const x1 = bx + fl.x + (bl.x - fl.x) * t1;
      const y1 = by + fl.y + (bl.y - fl.y) * t1 - height + yOff;
      const x2 = bx + fl.x + (bl.x - fl.x) * t2;
      const y2 = by + fl.y + (bl.y - fl.y) * t2 - height + yOff;

      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.lineTo(x2, y2 + 6);
      g.lineTo(x1, y1 + 6);
      g.closePath();
      g.fill({ color: palette.windowGlow, alpha: 0.5 });
    }
  }
}

/** Draw the control tower */
export function drawControlTower(g: Graphics, palette: SkyPalette, cx: number, cy: number) {
  const pos = toIso(4, 17);
  const x = cx + pos.x;
  const y = cy + pos.y;
  const towerH = 70;
  const baseW = 20;
  const topW = 30;

  // Tower shaft
  g.rect(x - baseW / 2, y - towerH, baseW, towerH);
  g.fill(palette.buildingBase);

  // Tower shaft highlight
  g.rect(x - baseW / 2 + 2, y - towerH, 4, towerH);
  g.fill({ color: palette.buildingAccent, alpha: 0.3 });

  // Control room (wider top section)
  g.rect(x - topW / 2, y - towerH - 18, topW, 18);
  g.fill(palette.buildingAccent);

  // Glass windows (wrap around)
  g.rect(x - topW / 2 + 2, y - towerH - 15, topW - 4, 12);
  g.fill({ color: palette.windowGlow, alpha: 0.8 });

  // Roof
  g.rect(x - topW / 2 - 2, y - towerH - 20, topW + 4, 3);
  g.fill(darken(palette.buildingBase, 0.2));

  // Antenna
  g.rect(x - 1, y - towerH - 32, 2, 12);
  g.fill(palette.buildingAccent);

  // Antenna light (blinks)
  g.circle(x, y - towerH - 33, 3);
  g.fill({ color: 0xff3333, alpha: 0.9 });
}

/** Draw a hangar */
export function drawHangar(
  g: Graphics, palette: SkyPalette,
  cx: number, cy: number,
  col: number, row: number,
) {
  const pos = toIso(col, row);
  const x = cx + pos.x;
  const y = cy + pos.y;
  const w = TILE_W * 1.2;
  const h = 30;

  // Base
  g.rect(x - w / 2, y - h, w, h);
  g.fill(darken(palette.buildingBase, 0.1));

  // Curved roof (approximated with a wide arc)
  g.ellipse(x, y - h, w / 2, 10);
  g.fill(palette.buildingAccent);

  // Door opening
  g.rect(x - w * 0.3, y - h * 0.7, w * 0.6, h * 0.7);
  g.fill({ color: palette.shadow, alpha: 0.6 });
}

/** Draw the windsock */
export function drawWindsock(g: Graphics, palette: SkyPalette, cx: number, cy: number) {
  const pos = toIso(19, 10);
  const x = cx + pos.x;
  const y = cy + pos.y;

  // Pole
  g.rect(x - 1, y - 25, 2, 25);
  g.fill(palette.buildingAccent);

  // Sock (triangle)
  g.moveTo(x + 1, y - 24);
  g.lineTo(x + 16, y - 20);
  g.lineTo(x + 1, y - 17);
  g.closePath();
  g.fill(0xff6633);

  // Sock stripes
  g.moveTo(x + 6, y - 23);
  g.lineTo(x + 6, y - 18);
  g.setStrokeStyle({ width: 1, color: 0xffffff });
  g.stroke();
  g.moveTo(x + 11, y - 22);
  g.lineTo(x + 11, y - 19);
  g.stroke();
}
