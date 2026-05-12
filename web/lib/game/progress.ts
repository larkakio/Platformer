/** Highest level index **inclusive** the player may select (starts at `0`). */
export type GameSave = {
  highestUnlockedIndex: number;
};

export const STORAGE_KEY = "neon-flux-platformer-v1";

const DEFAULT_SAVE: GameSave = { highestUnlockedIndex: 0 };

export function defaultSave(): GameSave {
  return { ...DEFAULT_SAVE };
}

export function readProgress(storage: Pick<Storage, "getItem"> | undefined): GameSave {
  if (!storage?.getItem) return defaultSave();
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as Partial<GameSave>;
    if (
      typeof parsed?.highestUnlockedIndex !== "number" ||
      Number.isNaN(parsed.highestUnlockedIndex)
    ) {
      return defaultSave();
    }
    const idx = Math.max(
      0,
      Math.floor(parsed.highestUnlockedIndex),
    );
    return { highestUnlockedIndex: idx };
  } catch {
    return defaultSave();
  }
}

export function persistProgress(
  storage: Pick<Storage, "setItem"> | undefined,
  next: GameSave,
): GameSave {
  if (!storage?.setItem) return next;
  const clamped = {
    highestUnlockedIndex: Math.max(0, Math.floor(next.highestUnlockedIndex)),
  };
  storage.setItem(STORAGE_KEY, JSON.stringify(clamped));
  return clamped;
}

/** After beating `completedIndex`, caller may advance reachable levels. */
export function saveAfterCompletingLevel(
  storage: Pick<Storage, "getItem" | "setItem"> | undefined,
  completedLevelIndex: number,
  totalLevelsExclusive: number,
): GameSave {
  const prev = readProgress(storage);
  const bumped = Math.max(
    prev.highestUnlockedIndex,
    Math.min(completedLevelIndex + 1, totalLevelsExclusive - 1),
  );
  return persistProgress(storage, { highestUnlockedIndex: bumped });
}

export function playableLevelClamp(
  wantedIndex: number,
  save: GameSave,
): number {
  const cap = Math.max(0, save.highestUnlockedIndex);
  return Math.min(cap, Math.max(0, wantedIndex));
}
