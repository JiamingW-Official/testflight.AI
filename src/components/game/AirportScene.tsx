"use client";

// ============================================
// SKYLOG — Full Isometric Airport Scene (PixiJS 8)
// Sky, ground, runway, buildings, planes, particles
// Day/night cycle, camera drag/zoom, animations
// ============================================

import { useEffect, useRef, useCallback } from "react";
import { useGameStore } from "@/stores/gameStore";
import { usePlaneStore } from "@/stores/planeStore";

export default function AirportScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<import("pixi.js").Application | null>(null);
  const destroyedRef = useRef(false);

  const initScene = useCallback(async () => {
    if (!containerRef.current || destroyedRef.current) return;

    const PIXI = await import("pixi.js");
    const { getPalette } = await import("@/lib/pixi/colors");
    const { toIso, TILE_W, TILE_H, ease } = await import("@/lib/pixi/utils");
    const { drawGround, drawRunway, drawApron, RUNWAY } = await import("@/lib/pixi/drawGround");
    const { drawTerminal, drawControlTower, drawHangar, drawWindsock } = await import("@/lib/pixi/drawBuildings");
    const { createPlaneSprite } = await import("@/lib/pixi/drawPlane");

    if (destroyedRef.current) return;

    // ── Create App ──
    const app = new PIXI.Application();
    await app.init({
      background: 0x1a2332,
      resizeTo: containerRef.current,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });

    if (destroyedRef.current) { app.destroy(true); return; }

    containerRef.current.appendChild(app.canvas as HTMLCanvasElement);
    appRef.current = app;

    const W = app.screen.width;
    const H = app.screen.height;

    // ── Scene Layers ──
    const worldContainer = new PIXI.Container();
    const skyLayer = new PIXI.Graphics();
    const starsLayer = new PIXI.Container();
    const celestialLayer = new PIXI.Container();
    const groundLayer = new PIXI.Graphics();
    const runwayLayer = new PIXI.Graphics();
    const apronLayer = new PIXI.Graphics();
    const buildingsLayer = new PIXI.Graphics();
    const planesLayer = new PIXI.Container();
    const particlesLayer = new PIXI.Container();

    app.stage.addChild(skyLayer);
    app.stage.addChild(starsLayer);
    app.stage.addChild(celestialLayer);
    app.stage.addChild(worldContainer);
    app.stage.addChild(particlesLayer);

    worldContainer.addChild(groundLayer);
    worldContainer.addChild(runwayLayer);
    worldContainer.addChild(apronLayer);
    worldContainer.addChild(buildingsLayer);
    worldContainer.addChild(planesLayer);

    // ── World offset (center the iso grid on screen) ──
    const gridCenter = toIso(10, 10);
    const worldOffsetX = W / 2 - gridCenter.x;
    const worldOffsetY = H / 2 - gridCenter.y + 20;
    worldContainer.x = worldOffsetX;
    worldContainer.y = worldOffsetY;

    // ── Stars ──
    interface Star { g: InstanceType<typeof PIXI.Graphics>; speed: number; baseAlpha: number }
    const stars: Star[] = [];
    for (let i = 0; i < 80; i++) {
      const sg = new PIXI.Graphics();
      const size = Math.random() * 2 + 0.5;
      sg.circle(0, 0, size);
      sg.fill(0xffffff);
      sg.x = Math.random() * W;
      sg.y = Math.random() * H * 0.6;
      sg.alpha = 0;
      starsLayer.addChild(sg);
      stars.push({ g: sg, speed: Math.random() * 0.02 + 0.005, baseAlpha: Math.random() * 0.5 + 0.5 });
    }

    // ── Sun / Moon ──
    const sun = new PIXI.Graphics();
    sun.circle(0, 0, 20);
    sun.fill(0xffdd44);
    // Sun glow
    sun.circle(0, 0, 30);
    sun.fill({ color: 0xffdd44, alpha: 0.2 });
    celestialLayer.addChild(sun);

    const moon = new PIXI.Graphics();
    moon.circle(0, 0, 14);
    moon.fill(0xddddff);
    moon.circle(0, 0, 20);
    moon.fill({ color: 0xddddff, alpha: 0.15 });
    celestialLayer.addChild(moon);

    // ── Clouds ──
    interface Cloud { g: InstanceType<typeof PIXI.Graphics>; vx: number; baseY: number }
    const clouds: Cloud[] = [];
    for (let i = 0; i < 6; i++) {
      const cg = new PIXI.Graphics();
      const cw = 60 + Math.random() * 80;
      const ch = 15 + Math.random() * 10;
      // Fluffy cloud shape (overlapping ellipses)
      cg.ellipse(0, 0, cw / 2, ch / 2);
      cg.fill({ color: 0xffffff, alpha: 0.25 });
      cg.ellipse(-cw * 0.2, -ch * 0.2, cw * 0.3, ch * 0.4);
      cg.fill({ color: 0xffffff, alpha: 0.2 });
      cg.ellipse(cw * 0.15, -ch * 0.15, cw * 0.35, ch * 0.35);
      cg.fill({ color: 0xffffff, alpha: 0.2 });

      cg.x = Math.random() * W;
      cg.y = 40 + Math.random() * (H * 0.25);
      particlesLayer.addChild(cg);
      clouds.push({ g: cg, vx: (Math.random() * 0.3 + 0.1) * (Math.random() > 0.5 ? 1 : -1), baseY: cg.y });
    }

    // ── Plane Sprites (tied to store) ──
    interface PlaneAnim {
      visual: ReturnType<typeof createPlaneSprite>;
      instanceId: string;
      gateIndex: number;
    }
    const planeAnims: PlaneAnim[] = [];

    function syncPlanes() {
      const storePlanes = usePlaneStore.getState().planes;

      // Remove sprites for planes no longer in store
      for (let i = planeAnims.length - 1; i >= 0; i--) {
        if (!storePlanes.find((p) => p.instanceId === planeAnims[i].instanceId)) {
          planesLayer.removeChild(planeAnims[i].visual.container);
          planeAnims.splice(i, 1);
        }
      }

      // Add sprites for new planes
      storePlanes.forEach((plane, index) => {
        if (!planeAnims.find((a) => a.instanceId === plane.instanceId)) {
          const scale = plane.modelId.includes("a380") || plane.modelId.includes("b747") ? 1.0 :
                        plane.modelId.includes("b787") || plane.modelId.includes("a350") || plane.modelId.includes("b777") ? 0.9 :
                        plane.modelId.includes("b737") || plane.modelId.includes("a320") || plane.modelId.includes("a321") || plane.modelId.includes("c919") ? 0.75 :
                        0.6;
          const visual = createPlaneSprite(plane.nickname, plane.color, scale);
          planesLayer.addChild(visual.container);
          planeAnims.push({ visual, instanceId: plane.instanceId, gateIndex: index });
        }
      });
    }

    syncPlanes();

    // ── Gate positions (where idle planes park) ──
    function gatePosition(index: number) {
      const col = RUNWAY.gateStartCol + (index % 4) * RUNWAY.gateSpacing;
      const row = RUNWAY.apronRow + 1;
      return toIso(col, row);
    }

    // ── Runway path for takeoff/landing animation ──
    function runwayPosition(progress: number, status: string) {
      if (status === "taxiing") {
        // Taxi from gate to runway start
        const t = Math.min(1, progress / 0.08);
        const gatePos = toIso(RUNWAY.taxiCol, RUNWAY.taxiEndRow);
        const rwStart = toIso(RUNWAY.startCol + 2, RUNWAY.row);
        return {
          x: gatePos.x + (rwStart.x - gatePos.x) * ease.inOut(t),
          y: gatePos.y + (rwStart.y - gatePos.y) * ease.inOut(t),
          rotation: -Math.PI * 0.15 * ease.inOut(t),
          scale: 1,
          alpha: 1,
        };
      }

      if (status === "airborne") {
        // Takeoff roll then climb
        const t = (progress - 0.08) / 0.84;
        if (t < 0.15) {
          // Accelerating on runway
          const rt = t / 0.15;
          const startPos = toIso(RUNWAY.startCol + 2, RUNWAY.row);
          const midPos = toIso(RUNWAY.endCol - 2, RUNWAY.row);
          return {
            x: startPos.x + (midPos.x - startPos.x) * ease.in(rt),
            y: startPos.y + (midPos.y - startPos.y) * ease.in(rt),
            rotation: -Math.PI * 0.15,
            scale: 1,
            alpha: 1,
          };
        }
        // In the air — shrink and float up
        const climbT = (t - 0.15) / 0.85;
        const endPos = toIso(RUNWAY.endCol, RUNWAY.row);
        return {
          x: endPos.x + climbT * 200,
          y: endPos.y - climbT * 300,
          rotation: -Math.PI * 0.25,
          scale: Math.max(0.1, 1 - climbT * 0.9),
          alpha: Math.max(0, 1 - climbT * 1.2),
        };
      }

      if (status === "landing") {
        // Descend and land
        const t = (progress - 0.92) / 0.08;
        const approachPos = { x: toIso(RUNWAY.endCol, RUNWAY.row).x + 200, y: toIso(RUNWAY.endCol, RUNWAY.row).y - 300 };
        const touchdownPos = toIso(RUNWAY.endCol - 3, RUNWAY.row);
        return {
          x: approachPos.x + (touchdownPos.x - approachPos.x) * ease.out(t),
          y: approachPos.y + (touchdownPos.y - approachPos.y) * ease.out(t),
          rotation: -Math.PI * 0.15,
          scale: 0.1 + t * 0.9,
          alpha: Math.min(1, t * 2),
        };
      }

      // Default: gate
      return { x: 0, y: 0, rotation: 0, scale: 1, alpha: 1 };
    }

    // ── Draw Static Scene ──
    let currentPhase = useGameStore.getState().dayPhase;
    let palette = getPalette(currentPhase);

    function drawScene() {
      palette = getPalette(currentPhase);

      // Sky gradient
      skyLayer.clear();
      const steps = 20;
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const color = lerpHex(palette.skyTop, palette.skyBottom, t);
        skyLayer.rect(0, (H / steps) * i, W, H / steps + 1);
        skyLayer.fill(color);
      }

      // Ground, runway, buildings
      drawGround(groundLayer, palette, 0, 0);
      drawRunway(runwayLayer, palette, 0, 0);
      drawApron(apronLayer, palette, 0, 0);

      buildingsLayer.clear();
      drawTerminal(buildingsLayer, palette, 0, 0);
      drawControlTower(buildingsLayer, palette, 0, 0);
      drawHangar(buildingsLayer, palette, 0, 0, 16, 17);
      drawHangar(buildingsLayer, palette, 0, 0, 3, 15);
      drawWindsock(buildingsLayer, palette, 0, 0);
    }

    drawScene();

    // ── Camera Controls ──
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let camStartX = 0;
    let camStartY = 0;

    const canvas = app.canvas as HTMLCanvasElement;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      camStartX = worldContainer.x;
      camStartY = worldContainer.y;
      canvas.style.cursor = "grabbing";
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      worldContainer.x = camStartX + dx;
      worldContainer.y = camStartY + dy;
    };

    const onPointerUp = () => {
      isDragging = false;
      canvas.style.cursor = "grab";
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.92 : 1.08;
      const newScale = Math.max(0.4, Math.min(2.5, worldContainer.scale.x * zoomFactor));

      // Zoom toward cursor position
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      const worldX = (mouseX - worldContainer.x) / worldContainer.scale.x;
      const worldY = (mouseY - worldContainer.y) / worldContainer.scale.y;

      worldContainer.scale.set(newScale);
      worldContainer.x = mouseX - worldX * newScale;
      worldContainer.y = mouseY - worldY * newScale;

      useGameStore.getState().setCameraZoom(newScale);
    };

    // Touch pinch zoom
    let lastPinchDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinchDist = Math.sqrt(dx * dx + dy * dy);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (lastPinchDist > 0) {
          const zoomFactor = dist / lastPinchDist;
          const newScale = Math.max(0.4, Math.min(2.5, worldContainer.scale.x * zoomFactor));
          worldContainer.scale.set(newScale);
        }
        lastPinchDist = dist;
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.style.cursor = "grab";

    // ── Animation Loop ──
    let elapsed = 0;
    let lastPhaseCheck = 0;

    app.ticker.add((ticker) => {
      elapsed += ticker.deltaMS;

      // ─ Stars twinkle ─
      for (const star of stars) {
        star.g.alpha = palette.starAlpha * star.baseAlpha *
          (0.5 + 0.5 * Math.sin(elapsed * star.speed));
      }

      // ─ Celestial bodies ─
      const now = new Date();
      const dayFrac = (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400;

      // Sun arc (visible during day)
      const sunAngle = (dayFrac - 0.25) * Math.PI * 2; // peaks at noon
      sun.x = W / 2 + Math.cos(sunAngle) * W * 0.4;
      sun.y = H * 0.35 - Math.sin(sunAngle) * H * 0.3;
      sun.alpha = currentPhase === "day" ? 0.9 : currentPhase === "dawn" || currentPhase === "dusk" ? 0.5 : 0;

      // Moon (visible at night)
      const moonAngle = (dayFrac + 0.25) * Math.PI * 2;
      moon.x = W / 2 + Math.cos(moonAngle) * W * 0.35;
      moon.y = H * 0.25 - Math.sin(moonAngle) * H * 0.2;
      moon.alpha = currentPhase === "night" ? 0.8 : currentPhase === "dusk" ? 0.3 : 0;

      // ─ Clouds drift ─
      for (const cloud of clouds) {
        cloud.g.x += cloud.vx;
        cloud.g.y = cloud.baseY + Math.sin(elapsed * 0.0005 + cloud.g.x * 0.01) * 3;
        if (cloud.g.x > W + 100) cloud.g.x = -100;
        if (cloud.g.x < -100) cloud.g.x = W + 100;
        cloud.g.alpha = currentPhase === "night" ? 0.08 : 0.25;
      }

      // ─ Day/night phase check (every 5 seconds) ─
      if (elapsed - lastPhaseCheck > 5000) {
        lastPhaseCheck = elapsed;
        const newPhase = useGameStore.getState().dayPhase;
        if (newPhase !== currentPhase) {
          currentPhase = newPhase;
          drawScene();
        }
        // Sync plane sprites
        syncPlanes();
      }

      // ─ Animate planes ─
      const storePlanes = usePlaneStore.getState().planes;
      for (const anim of planeAnims) {
        const storeData = storePlanes.find((p) => p.instanceId === anim.instanceId);
        if (!storeData) continue;

        const c = anim.visual.container;

        if (storeData.flightStatus === "idle" || storeData.flightStatus === "arrived") {
          // Parked at gate
          const gate = gatePosition(anim.gateIndex);
          c.x += (gate.x - c.x) * 0.05;
          c.y += (gate.y - c.y) * 0.05;
          c.rotation += (Math.PI * 0.5 - c.rotation) * 0.05; // point upward in iso
          c.scale.set(1);
          c.alpha = 1;

          // Subtle idle bob
          c.y += Math.sin(elapsed * 0.001 + anim.gateIndex) * 0.3;
        } else {
          // Flying animation
          const pos = runwayPosition(storeData.flightProgress, storeData.flightStatus);
          c.x += (pos.x - c.x) * 0.1;
          c.y += (pos.y - c.y) * 0.1;
          c.rotation += (pos.rotation - c.rotation) * 0.08;
          c.scale.x += (pos.scale - c.scale.x) * 0.08;
          c.scale.y += (pos.scale - c.scale.y) * 0.08;
          c.alpha += (pos.alpha - c.alpha) * 0.1;
        }
      }

      // ─ Control tower antenna blink ─
      // Handled via the drawBuildings redraw on phase change
    });

    // ── Resize handler ──
    const onResize = () => {
      app.renderer.resize(window.innerWidth, window.innerHeight);
      drawScene();
    };
    window.addEventListener("resize", onResize);

    // ── Cleanup ──
    return () => {
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      app.destroy(true, { children: true });
      appRef.current = null;
    };
  }, []);

  useEffect(() => {
    destroyedRef.current = false;
    let cleanup: (() => void) | undefined;

    initScene().then((fn) => {
      if (destroyedRef.current) {
        fn?.();
      } else {
        cleanup = fn;
      }
    });

    return () => {
      destroyedRef.current = true;
      cleanup?.();
    };
  }, [initScene]);

  return (
    <div
      ref={containerRef}
      id="game-canvas"
      style={{
        width: "100vw",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 0,
        touchAction: "none",
      }}
    />
  );
}

// ── Helper ──
function lerpHex(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}
