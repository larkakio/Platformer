"use client";

import { useEffect, useRef, useState } from "react";

import { overlapsExit, resolvePhysics } from "@/lib/game/collision";
import { classifySwipe } from "@/lib/game/gestures";
import { LEVELS } from "@/lib/game/levels";
import {
  playableLevelClamp,
  readProgress,
  saveAfterCompletingLevel,
} from "@/lib/game/progress";

const VIEW_W = 400;
const VIEW_H = 600;
const PW = 26;
const PH = 34;
const GRAVITY = 2700;
const VY_CAP = 1020;
const H_IMPULSE = 740;
const VX_CAP = 620;
const JUMP_Y = -688;
const JUMP_AIR = JUMP_Y * 0.82;
const COYOTE_MAX = 0.11;
const AIR_DRAG = 0.75;
const GROUND_SLOW = 4.95;
const CAM_LERP_K = 10;

function groundDrag() {
  return GROUND_SLOW;
}

function levelWorldWidth(li: number) {
  const L = LEVELS[li];
  if (!L) return VIEW_W + 640;
  let r = L.exit.x + L.exit.w + 200;
  for (const b of L.platforms) r = Math.max(r, b.x + b.w + 320);
  return Math.max(VIEW_W + 600, r);
}

function abyssY(li: number) {
  const L = LEVELS[li];
  if (!L) return 900;
  let d = 0;
  for (const b of L.platforms) d = Math.max(d, b.y + b.h);
  return d + 320;
}

function doubleJumpAllowed(li: number) {
  return li >= 1;
}

export function PlatformGame() {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const [levelIndex, setLevelIndex] = useState(() => {
    if (typeof window === "undefined") return 0;
    return playableLevelClamp(
      0,
      readProgress(window.localStorage),
    );
  });
  const [toast, setToast] = useState<string | null>(null);
  const levelIndexRef = useRef(levelIndex);
  levelIndexRef.current = levelIndex;

  const winHandlerRef = useRef<(completedIdx: number) => void>(() => {});
  winHandlerRef.current = (completedIdx: number): void => {
    if (typeof window === "undefined") return;
    saveAfterCompletingLevel(
      window.localStorage,
      completedIdx,
      LEVELS.length,
    );
    const unlocked = playableLevelClamp(
      completedIdx + 1,
      readProgress(window.localStorage),
    );
    setToast(`Sector ${completedIdx + 1} synced · warp ahead`);
    window.setTimeout(() => {
      setToast(null);
      setLevelIndex(unlocked);
    }, 1480);
  };

  useEffect(() => {
    const surface = canvasEl.current;
    if (!surface) return undefined;

    type Grab = { id: number; sx: number; sy: number };
    let last = performance.now();
    let rafId = 0;
    let lastLoadedLevelIndex = levelIndexRef.current;

    const sim = {
      li: lastLoadedLevelIndex,
      px: LEVELS[lastLoadedLevelIndex]?.spawn.x ?? 60,
      py: LEVELS[lastLoadedLevelIndex]?.spawn.y ?? 360,
      vx: 0,
      vy: 0,
      grounded: false,
      coyote: 0 as number,
      doubleSpent: false,
      cx: 0,
      hue: Math.random(),
      trails: [] as { x: number; y: number }[],
      grab: undefined as Grab | undefined,
      winLatch: false,
      groundedBefore: false,
    };

    const resetPhysicsForLevel = (): void => {
      const ln = LEVELS[sim.li];
      if (!ln) return;
      sim.px = ln.spawn.x;
      sim.py = ln.spawn.y;
      sim.vx = 0;
      sim.vy = 0;
      sim.grounded = false;
      sim.coyote = 0;
      sim.doubleSpent = false;
      sim.trails.length = 0;
      sim.winLatch = false;
      sim.grab = undefined;
      sim.groundedBefore = false;
      sim.cx = Math.max(
        0,
        Math.min(sim.px - VIEW_W * 0.36, levelWorldWidth(sim.li) - VIEW_W),
      );
    };

    resetPhysicsForLevel();

    const pb = (): { x: number; y: number; w: number; h: number } => ({
      x: sim.px,
      y: sim.py,
      w: PW,
      h: PH,
    });

    const pushJump = (): void => {
      if (sim.winLatch) return;
      if (sim.grounded || sim.coyote > 0) {
        sim.vy = JUMP_Y;
        sim.doubleSpent = false;
        sim.coyote = 0;
      } else if (doubleJumpAllowed(sim.li) && !sim.doubleSpent) {
        sim.vy = JUMP_AIR;
        sim.doubleSpent = true;
      }
    };

    function applySwipe(dx: number, dy: number) {
      if (sim.winLatch) return;
      const g = classifySwipe(dx, dy, 40);
      if (!g) return;
      if (g === "jump") {
        pushJump();
      } else {
        const mul = g === "right" ? 1 : -1;
        sim.vx += mul * H_IMPULSE;
        sim.vx = Math.min(VX_CAP, Math.max(-VX_CAP, sim.vx));
      }
    }

    const onDown = (e: PointerEvent) => {
      surface.setPointerCapture(e.pointerId);
      sim.grab = { id: e.pointerId, sx: e.offsetX, sy: e.offsetY };
      e.preventDefault();
    };

    const onUp = (e: PointerEvent) => {
      if (!sim.grab || sim.grab.id !== e.pointerId) return;
      applySwipe(e.offsetX - sim.grab.sx, e.offsetY - sim.grab.sy);
      surface.releasePointerCapture(e.pointerId);
      sim.grab = undefined;
      e.preventDefault();
    };

    const onCancel = (e: PointerEvent) => {
      if (sim.grab && sim.grab.id === e.pointerId) sim.grab = undefined;
      e.preventDefault();
    };

    surface.addEventListener("pointerdown", onDown);
    surface.addEventListener("pointerup", onUp);
    surface.addEventListener("pointercancel", onCancel);

    function fitCanvas(c: HTMLCanvasElement) {
      const dpr =
        typeof window.devicePixelRatio === "number"
          ? window.devicePixelRatio
          : 1;
      c.width = Math.round(VIEW_W * dpr);
      c.height = Math.round(VIEW_H * dpr);
      c.style.width = `${VIEW_W}px`;
      c.style.height = `${VIEW_H}px`;
      const cxt = c.getContext("2d");
      return { ctx: cxt!, dpr };
    }

    let { ctx, dpr } = fitCanvas(surface);

    const resize = (): void => {
      ({ ctx, dpr } = fitCanvas(surface));
    };
    window.addEventListener("resize", resize);

    const tick = (): void => {
      const now = performance.now();
      let dt = (now - last) / 1000;
      last = now;
      dt = Math.min(dt, 0.046);

      if (levelIndexRef.current !== lastLoadedLevelIndex) {
        lastLoadedLevelIndex = levelIndexRef.current;
        sim.li = lastLoadedLevelIndex;
        resetPhysicsForLevel();
      }

      sim.hue += dt * 0.28;
      const LNow = LEVELS[sim.li];
      sim.vy = Math.min(VY_CAP, sim.vy + GRAVITY * dt);

      sim.vx *= Math.exp(-dt * (sim.grounded ? groundDrag() : AIR_DRAG));

      const res = resolvePhysics(
        pb(),
        { x: sim.vx, y: sim.vy },
        dt,
        LNow?.platforms ?? [],
      );

      sim.vx = res.velocity.x;
      sim.vy = res.velocity.y;
      sim.px = res.position.x;
      sim.py = res.position.y;

      const groundedNow = res.grounded;
      if (!groundedNow) {
        if (sim.groundedBefore) sim.coyote = COYOTE_MAX;
        sim.coyote -= dt;
      } else {
        sim.doubleSpent = false;
        sim.coyote = COYOTE_MAX;
      }
      if (sim.coyote < 0) sim.coyote = 0;
      sim.groundedBefore = groundedNow;
      sim.grounded = groundedNow;

      if (sim.py > abyssY(sim.li)) resetPhysicsForLevel();

      const targetCam = Math.max(
        0,
        Math.min(sim.px - VIEW_W * 0.36, levelWorldWidth(sim.li) - VIEW_W),
      );
      sim.cx += (targetCam - sim.cx) * Math.min(1, CAM_LERP_K * dt);

      if (LNow && !sim.winLatch && overlapsExit(pb(), LNow.exit)) {
        sim.winLatch = true;
        winHandlerRef.current(sim.li);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, VIEW_W + 2, VIEW_H + 2);

      const sky = ctx.createLinearGradient(
        VIEW_W * 0.2,
        0,
        VIEW_W,
        VIEW_H + 420,
      );
      sky.addColorStop(0, "#050113");
      sky.addColorStop(0.62, "#120036");
      sky.addColorStop(1, "#01030c");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);

      ctx.save();
      ctx.translate(-sim.cx, Math.sin(sim.hue) * 1.65);

      ctx.strokeStyle = "rgba(148,239,239,0.16)";
      ctx.lineWidth = 1;
      for (
        let gx = Math.floor(sim.cx / 76) * 76;
        gx <= sim.cx + VIEW_W + 120;
        gx += 76
      ) {
        const sx = gx - sim.cx;
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, VIEW_H);
        ctx.stroke();
      }

      ctx.shadowBlur = 16;
      for (const plat of LNow?.platforms ?? []) {
        const grad = ctx.createLinearGradient(
          plat.x,
          plat.y,
          plat.x + plat.w,
          plat.y + plat.h,
        );
        grad.addColorStop(0, "#f972f5cc");
        grad.addColorStop(1, "#36fcefbb");
        ctx.fillStyle = grad;
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        ctx.strokeStyle = "rgba(239,239,239,0.4)";
        ctx.lineWidth = 2;
        ctx.strokeRect(plat.x + 1, plat.y + 1, plat.w - 2, plat.h - 2);
      }
      ctx.shadowBlur = 0;

      if (LNow) {
        const gx = LNow.exit.x + LNow.exit.w / 2;
        const gy = LNow.exit.y + LNow.exit.h / 2;
        const puls = Math.sin(now * 0.0089) * 14 + 32;
        const glow = ctx.createRadialGradient(gx, gy, 6, gx, gy, puls * 2.5);
        glow.addColorStop(0, "#f8fdff");
        glow.addColorStop(0.45, "#4afdf5aa");
        glow.addColorStop(1, "#1b003300");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(gx, gy, puls * 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#f43cff";
        ctx.lineWidth = 2;
        ctx.strokeRect(LNow.exit.x, LNow.exit.y, LNow.exit.w, LNow.exit.h);
      }

      sim.trails.push({ x: sim.px + PW / 2, y: sim.py + PH / 2 });
      while (sim.trails.length > 18) sim.trails.shift();

      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < sim.trails.length; i++) {
        const tDot = sim.trails[i];
        if (!tDot) continue;
        const k =
          sim.trails.length > 1 ? i / Math.max(sim.trails.length - 1, 1) : 1;
        ctx.fillStyle = `rgba(96,239,239,${0.035 + k * 0.5})`;
        ctx.beginPath();
        ctx.arc(tDot.x + 12, tDot.y + 8, k * 20 + 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      const coreGrad = ctx.createRadialGradient(
        sim.px + PW * 0.4,
        sim.py + PH * 0.35,
        2,
        sim.px + PW * 0.45,
        sim.py + PH * 0.6,
        PW * 1.1,
      );
      coreGrad.addColorStop(0, "#fff");
      coreGrad.addColorStop(0.45, "#36fcef");
      coreGrad.addColorStop(1, "#7e2bfb");
      ctx.fillStyle = coreGrad;
      ctx.shadowBlur = 22;
      ctx.shadowColor = "rgba(112,239,239,0.55)";
      ctx.fillRect(sim.px, sim.py, PW, PH);
      ctx.shadowBlur = 0;

      ctx.restore();

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.font =
        "12px ui-monospace, SFMono-Regular, Menlo, Monaco, monospace";
      ctx.fillStyle = "rgba(244,239,249,0.92)";
      ctx.shadowBlur = 8;
      ctx.shadowColor = "rgba(239,239,239,0.43)";
      const titleLbl = LEVELS[sim.li]?.title ?? "relay";
      ctx.fillText(`${titleLbl} · LEVEL ${sim.li + 1}/${LEVELS.length}`, 12, 24);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(239,239,239,0.74)";
      ctx.font = '11px ui-monospace, Menlo, monospace';
      ctx.fillText(
        "Swipe sideways to impulse · swipe ↑ to flux-jump",
        12,
        VIEW_H - 12,
      );
      if (doubleJumpAllowed(sim.li)) {
        ctx.fillStyle = "rgba(255,117,239,0.9)";
        ctx.fillText(
          sim.doubleSpent ? "aux flux spent" : "aux flux ready",
          VIEW_W - 154,
          24,
        );
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      surface.removeEventListener("pointerdown", onDown);
      surface.removeEventListener("pointerup", onUp);
      surface.removeEventListener("pointercancel", onCancel);
    };
  }, [levelIndex]);

  return (
    <div className="relative w-full max-w-xl">
      <div className="pointer-events-none absolute left-4 top-24 z-[1] rounded-lg border border-cyan-400/50 bg-black/58 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-200/90 backdrop-blur">
        NEON FIELD · SWIPE ZONE
      </div>
      {toast ?
        <div
          aria-live="polite"
          className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 text-center backdrop-blur-sm"
          role="status"
        >
          <p className="max-w-[16rem] text-sm font-semibold uppercase tracking-[0.31em] text-fuchsia-200 drop-shadow-[0_0_12px_rgba(248,131,239,0.75)]">
            {toast}
          </p>
          <span className="mt-5 text-[0.62rem] text-cyan-100/95">
            Decrypting next sector…
          </span>
        </div>
      : null}
      <canvas
        ref={canvasEl}
        className="mx-auto rounded-2xl border border-cyan-400/65 bg-black shadow-[0_0_50px_-6px_rgba(57,239,239,0.55)] outline-none touch-none"
      />
    </div>
  );
}
