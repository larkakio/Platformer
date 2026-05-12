import { describe, expect, it } from "vitest";

import {
  readProgress,
  saveAfterCompletingLevel,
  STORAGE_KEY,
} from "./progress";

class MemoryStorage implements Storage {
  private map = new Map<string, string>();

  get length() {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

describe("progress", () => {
  it("starts locked to level zero", () => {
    const m = new MemoryStorage();
    expect(readProgress(m).highestUnlockedIndex).toBe(0);
  });

  it("advances reachable index after finishing level 1", () => {
    const m = new MemoryStorage();
    const next = saveAfterCompletingLevel(m, 0, 2);
    expect(next.highestUnlockedIndex).toBe(1);
    expect(readProgress(m).highestUnlockedIndex).toBe(1);
    expect(m.getItem(STORAGE_KEY)).toContain("1");
  });
});
