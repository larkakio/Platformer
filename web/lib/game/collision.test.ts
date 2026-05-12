import { describe, expect, it } from "vitest";

import { overlapsExit, resolvePhysics } from "./collision";

describe("collision helpers", () => {
  it("detects overlapping exit rectangles", () => {
    expect(
      overlapsExit(
        { x: 0, y: 0, w: 10, h: 10 },
        { x: 5, y: 5, w: 10, h: 10 },
      ),
    ).toBe(true);
    expect(
      overlapsExit(
        { x: 0, y: 0, w: 10, h: 10 },
        { x: 40, y: 40, w: 4, h: 4 },
      ),
    ).toBe(false);
  });

  it("pins falling motion when passing through thin platforms", () => {
    let pos = { x: 140, y: 0, w: 26, h: 34 };
    let vel = { x: 0, y: 2000 };

    let grounded = false;
    for (let i = 0; i < 40; i++) {
      const res = resolvePhysics(pos, vel, 0.02, [{ x: 0, y: 390, w: 500, h: 40 }]);
      pos = res.position;
      vel = res.velocity;
      grounded = res.grounded;
      if (grounded) break;
    }
    expect(grounded).toBe(true);
    expect(vel.y).toBe(0);
    expect(pos.y + pos.h).toBeLessThanOrEqual(390.1);
  });
});
