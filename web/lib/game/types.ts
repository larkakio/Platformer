export type AABB = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Vec2 = { x: number; y: number };

export interface LevelDefinition {
  id: number;
  title: string;
  spawn: Vec2;
  exit: AABB;
  platforms: readonly AABB[];
}
