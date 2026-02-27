// ============================================
// SKYLOG — Plane Sprite Drawing
// Programmatic plane shapes with color
// ============================================

import { Graphics, Container, Text } from "pixi.js";

export interface PlaneVisual {
  container: Container;
  body: Graphics;
  nameLabel: Text;
  update: (color: number) => void;
}

/**
 * Create a plane sprite drawn with Graphics.
 * Viewed from isometric top-down: body is an elongated shape
 * pointing right (positive x = heading direction).
 * Scale ~0.6-1.0 depending on plane type.
 */
export function createPlaneSprite(
  nickname: string,
  hexColor: string,
  scale: number = 0.8,
): PlaneVisual {
  const container = new Container();
  const body = new Graphics();
  const color = parseInt(hexColor.replace("#", ""), 16);

  drawPlaneShape(body, color, scale);

  // Name label
  const nameLabel = new Text({
    text: nickname,
    style: {
      fontFamily: "system-ui, sans-serif",
      fontSize: 10,
      fill: 0xfaf8f5,
      letterSpacing: 0.5,
      dropShadow: {
        alpha: 0.5,
        blur: 2,
        color: 0x000000,
        distance: 1,
      },
    },
  });
  nameLabel.anchor.set(0.5, 1);
  nameLabel.y = -22 * scale;

  container.addChild(body);
  container.addChild(nameLabel);

  return {
    container,
    body,
    nameLabel,
    update: (newColor: number) => {
      body.clear();
      drawPlaneShape(body, newColor, scale);
    },
  };
}

function drawPlaneShape(g: Graphics, color: number, scale: number) {
  const s = scale;

  // Shadow on ground
  g.ellipse(0, 4 * s, 18 * s, 5 * s);
  g.fill({ color: 0x000000, alpha: 0.15 });

  // Fuselage (main body)
  g.ellipse(0, 0, 20 * s, 5 * s);
  g.fill(color);

  // Cockpit (front)
  g.ellipse(16 * s, 0, 6 * s, 4 * s);
  g.fill(lightenHex(color, 0.15));

  // Cockpit window
  g.ellipse(18 * s, 0, 3 * s, 2.5 * s);
  g.fill({ color: 0xaaddff, alpha: 0.8 });

  // Wings
  g.moveTo(-2 * s, 0);
  g.lineTo(-6 * s, -16 * s);
  g.lineTo(2 * s, -14 * s);
  g.lineTo(4 * s, 0);
  g.closePath();
  g.fill(darkenHex(color, 0.1));

  g.moveTo(-2 * s, 0);
  g.lineTo(-6 * s, 16 * s);
  g.lineTo(2 * s, 14 * s);
  g.lineTo(4 * s, 0);
  g.closePath();
  g.fill(darkenHex(color, 0.15));

  // Engine nacelles
  g.ellipse(-2 * s, -10 * s, 4 * s, 2 * s);
  g.fill(darkenHex(color, 0.2));
  g.ellipse(-2 * s, 10 * s, 4 * s, 2 * s);
  g.fill(darkenHex(color, 0.2));

  // Tail fin (vertical stabilizer)
  g.moveTo(-18 * s, 0);
  g.lineTo(-22 * s, -6 * s);
  g.lineTo(-16 * s, -5 * s);
  g.lineTo(-14 * s, 0);
  g.closePath();
  g.fill(lightenHex(color, 0.1));

  // Horizontal stabilizers (tail)
  g.moveTo(-16 * s, 0);
  g.lineTo(-20 * s, -7 * s);
  g.lineTo(-14 * s, -6 * s);
  g.closePath();
  g.fill(darkenHex(color, 0.05));

  g.moveTo(-16 * s, 0);
  g.lineTo(-20 * s, 7 * s);
  g.lineTo(-14 * s, 6 * s);
  g.closePath();
  g.fill(darkenHex(color, 0.1));

  // Fuselage highlight stripe
  g.rect(-14 * s, -1 * s, 28 * s, 2 * s);
  g.fill({ color: 0xffffff, alpha: 0.2 });
}

function lightenHex(color: number, factor: number): number {
  const r = Math.min(255, ((color >> 16) & 0xff) + Math.round(255 * factor));
  const gv = Math.min(255, ((color >> 8) & 0xff) + Math.round(255 * factor));
  const b = Math.min(255, (color & 0xff) + Math.round(255 * factor));
  return (r << 16) | (gv << 8) | b;
}

function darkenHex(color: number, factor: number): number {
  const r = Math.max(0, Math.round(((color >> 16) & 0xff) * (1 - factor)));
  const gv = Math.max(0, Math.round(((color >> 8) & 0xff) * (1 - factor)));
  const b = Math.max(0, Math.round((color & 0xff) * (1 - factor)));
  return (r << 16) | (gv << 8) | b;
}
