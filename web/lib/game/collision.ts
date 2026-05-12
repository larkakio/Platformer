import type { AABB } from "./types";

export function testOverlap(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function verticalBandsOverlap(py: number, ph: number, by: number, bh: number) {
  return py < by + bh && py + ph > by;
}

function horizontalBandsOverlap(px: number, pw: number, bx: number, bw: number) {
  return px < bx + bw && px + pw > bx;
}

/**
 * Lightweight platform collision: separate-axis resolution.
 */
export function resolvePhysics(
  pos: AABB,
  vel: { x: number; y: number },
  dt: number,
  platforms: readonly AABB[],
): {
  position: AABB;
  velocity: { x: number; y: number };
  grounded: boolean;
  hitCeiling: boolean;
} {
  let x = pos.x;
  let y = pos.y;
  const { w, h } = pos;
  let vx = vel.x;
  let vy = vel.y;

  let xNext = x + vx * dt;
  for (const p of platforms) {
    if (!verticalBandsOverlap(y, h, p.y, p.h)) continue;

    const cand: AABB = { x: xNext, y, w, h };
    if (!testOverlap(cand, p)) continue;

    const centerX = x + w / 2;
    const platMid = p.x + p.w / 2;
    const pushLeft = centerX < platMid;
    if (pushLeft) {
      xNext = p.x - w - 0.02;
      vx = Math.min(vx, 0);
    } else {
      xNext = p.x + p.w + 0.02;
      vx = Math.max(vx, 0);
    }
  }

  x = xNext;

  let yNext = y + vy * dt;
  let grounded = false;
  let hitCeiling = false;

  for (const p of platforms) {
    if (!horizontalBandsOverlap(x, w, p.x, p.w)) continue;

    const cand: AABB = { x, y: yNext, w, h };
    if (!testOverlap(cand, p)) continue;

    if (vy > 0) {
      yNext = p.y - h - 0.02;
      vy = 0;
      grounded = true;
    } else if (vy < 0) {
      yNext = p.y + p.h + 0.02;
      vy = 0;
      hitCeiling = true;
    }
  }

  y = yNext;

  return {
    position: { x, y, w, h },
    velocity: { x: vx, y: vy },
    grounded,
    hitCeiling,
  };
}

export function overlapsExit(player: AABB, exitDoor: AABB): boolean {
  return testOverlap(player, exitDoor);
}
