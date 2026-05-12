/**
 * Interpret pointer drag as platformer intents. Distances are in CSS pixels relative to canvas.
 */
export function classifySwipe(
  dx: number,
  dy: number,
  minDist = 42,
): "jump" | "left" | "right" | null {
  const d = Math.hypot(dx, dy);
  if (d < minDist) return null;
  const verticalDominant =
    Math.abs(dy) > Math.abs(dx) * 1.08;
  if (verticalDominant && dy < 0) return "jump";
  if (!verticalDominant) {
    if (dx >= 0) return "right";
    return "left";
  }
  return null;
}
