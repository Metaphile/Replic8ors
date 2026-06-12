// Pure-functional rigid-body physics.
//
// Functional port of source/engine/physics.ts. The prototype mixes a physics
// behavior onto an object and mutates `position`/`velocity`/`rotation` in place.
// Here a Body is immutable plain data and every transition is a pure function
// returning a new Body. The vector math is delegated to the engine's Vector2
// helpers via fresh `{}` out-objects, so the float results are bit-identical to
// the prototype while leaving the inputs untouched.

import Vector2 from "../../engine/vector-2";
import * as Math2 from "../../engine/math-2";

export type Vec2 = Readonly<{ x: number; y: number }>;

// typed view of the engine's untyped (@ts-nocheck) Vector2 statics. Each writes
// into the provided `out` and returns it, leaving the input vector untouched.
type MutVec2 = { x: number; y: number };
const V = Vector2 as unknown as {
  lengthSquared(v: MutVec2): number;
  normalize(v: MutVec2, out: MutVec2): MutVec2;
  scale(v: MutVec2, s: number, out: MutVec2): MutVec2;
};

export interface Body {
  readonly position: Vec2;
  readonly velocity: Vec2;
  readonly rotation: number;
  readonly angularVelocity: number;
  readonly mass: number;
  readonly drag: number;
  readonly radius: number;
  readonly elasticity: number;
}

// Apply a force over `dt`, scaled by inverse mass. Returns a new body.
export const applyForce = <T extends Body>(body: T, force: Vec2, dt: number): T => ({
  ...body,
  velocity: {
    x: body.velocity.x + (force.x / body.mass) * dt,
    y: body.velocity.y + (force.y / body.mass) * dt,
  },
});

// Apply a torque over `dt`, scaled by inverse mass. Returns a new body.
export const applyTorque = <T extends Body>(body: T, torque: number, dt: number): T => ({
  ...body,
  angularVelocity: body.angularVelocity + (torque / body.mass) * dt,
});

// Integrate one step: apply drag (mass-weighted), then advance position and
// rotation by the post-drag velocity. Returns a new body.
export const updatePhysics = <T extends Body>(body: T, dt: number): T => {
  // high mass bodies are less affected by drag and vice versa; effect scales
  // with time, then mapped to 0..1
  let scale = body.drag / body.mass;
  scale *= dt;
  scale = 1 / (scale + 1);

  const vx = body.velocity.x * scale;
  const vy = body.velocity.y * scale;
  const av = body.angularVelocity * scale;

  return {
    ...body,
    velocity: { x: vx, y: vy },
    angularVelocity: av,
    position: { x: body.position.x + vx * dt, y: body.position.y + vy * dt },
    rotation: body.rotation + av * dt,
  };
};

export interface Collision<A extends Body, B extends Body> {
  readonly a: A;
  readonly b: B;
}

// Resolve overlap between two bodies as a repulsive impulse over `dt`. If the
// bodies don't overlap, both are returned unchanged. When they're exactly
// coincident, a random repulsion direction is drawn from `rng` (matching the
// prototype's degenerate-case handling). Returns new bodies for both.
export const collide = <A extends Body, B extends Body>(
  a: A,
  b: B,
  dt: number,
  rng: Math2.Rng = Math2.random,
): Collision<A, B> => {
  let offset: { x: number; y: number } = {
    x: b.position.x - a.position.x,
    y: b.position.y - a.position.y,
  };

  // if bodies are exactly on top of each other, pick a random direction to repel
  if (offset.x === 0 && offset.y === 0) {
    const angle = rng() * Math.PI * 2;
    offset = { x: Math.cos(angle) * 0.001, y: Math.sin(angle) * 0.001 };
  }

  const overlap = Math.pow(a.radius + b.radius, 2) - V.lengthSquared(offset);

  if (overlap <= 0) return { a, b };

  // repurpose offset as a repulsive force vector (engine helpers write into the
  // fresh out objects, leaving `offset` and the inputs untouched)
  const force = V.normalize(offset, { x: 0, y: 0 });

  return {
    a: applyForce(a, V.scale(force, -overlap / a.elasticity, { x: 0, y: 0 }), dt),
    b: applyForce(b, V.scale(force, overlap / b.elasticity, { x: 0, y: 0 }), dt),
  };
};
