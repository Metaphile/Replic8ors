// Simulation throughput benchmark.
//
// Forks the deterministic harness from characterization.spec.ts: a seeded RNG
// makes the trajectory identical across runs, so timing deltas between the
// prototype sim and any functional variant are pure representation cost (not
// behavioral drift). Run with `npm run bench`.
//
// Headline metric: ticks/sec (hz) at worst-case population (96 replicators).
// Also watch p99/max single-tick latency — mean throughput hides GC-pause
// stutter, which is exactly what makes turbo feel janky. Budget: >=1,800
// ticks/sec floor (30 ticks/frame x 60fps), target >=2,500, p99 < ~2x p50.

import { bench, describe } from "vitest";
import { setRng } from "../engine/math-2";
import World from "./world";
import Scenario from "./scenario";

// mulberry32 — tiny seeded PRNG, deterministic across platforms.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const dt = 1 / 30;
const WARMUP_TICKS = 200;

// Build a full-population world (32 of each type = 96 replicators, 1,536
// neurons) and let it reach steady state before timing.
function makeFullWorld() {
  setRng(mulberry32(0x5eed));
  // prototype sim is @ts-nocheck, so its factories return loosely-typed objects
  const world: any = World();
  const scenario: any = Scenario(world, {
    minReds: 32,
    maxReds: 32,
    minGreens: 32,
    maxGreens: 32,
    minBlues: 32,
    maxBlues: 32,
  });
  for (let i = 0; i < WARMUP_TICKS; i++) scenario.update(dt);
  return { world, scenario };
}

describe("simulation throughput @ 96 replicators", () => {
  const { world, scenario } = makeFullWorld();

  // sanity: confirm we're actually benchmarking a full world
  const total = world.reds.length + world.greens.length + world.blues.length;
  if (total < 90) {
    throw new Error(`expected ~96 replicators, got ${total}`);
  }

  bench(
    "prototype scenario.update (one tick)",
    () => {
      scenario.update(dt);
    },
    { time: 2000, warmupTime: 500 },
  );
});
