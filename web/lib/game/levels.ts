import type { LevelDefinition } from "./types";

/** Two curated tutorial-style sectors; swipe left/right to dash, swipe up to jump the void. */
export const LEVELS: readonly LevelDefinition[] = [
  {
    id: 0,
    title: "Voltage Deck",
    spawn: { x: 80, y: 386 },
    exit: { x: 1120, y: 356, w: 48, h: 84 },
    platforms: [
      { x: -40, y: 420, w: 480, h: 36 },
      { x: 420, y: 392, w: 160, h: 22 },
      { x: 640, y: 362, w: 160, h: 22 },
      { x: 860, y: 330, w: 380, h: 120 },
      { x: 1080, y: 280, w: 200, h: 22 },
      { x: 1240, y: 240, w: 800, h: 340 },
    ],
  },
  {
    id: 1,
    title: "Chromatic Shaft",
    spawn: { x: 96, y: 326 },
    exit: { x: 1460, y: 196, w: 52, h: 92 },
    platforms: [
      { x: 0, y: 360, w: 240, h: 28 },
      { x: 280, y: 320, w: 120, h: 20 },
      { x: 460, y: 388, w: 180, h: 76 },
      { x: 700, y: 300, w: 130, h: 20 },
      { x: 900, y: 260, w: 110, h: 20 },
      { x: 1070, y: 220, w: 90, h: 20 },
      { x: 1230, y: 300, w: 520, h: 340 },
      { x: 1290, y: 196, w: 120, h: 20 },
      { x: 1500, y: 150, w: 400, h: 40 },
      { x: 1520, y: 400, w: 600, h: 200 },
    ],
  },
];
