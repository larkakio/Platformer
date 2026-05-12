import { describe, expect, it } from "vitest";

import { classifySwipe } from "./gestures";

describe("gestures", () => {
  it("ignores tiny drags", () => {
    expect(classifySwipe(3, 4, 40)).toBeNull();
  });

  it("classifies upward jumps", () => {
    expect(classifySwipe(10, -120, 40)).toBe("jump");
  });

  it("classifies horizontal impulses", () => {
    expect(classifySwipe(190, 12, 40)).toBe("right");
    expect(classifySwipe(-200, 8, 40)).toBe("left");
  });
});
