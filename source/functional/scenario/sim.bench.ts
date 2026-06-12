// Functional sim throughput benchmark — the counterpart to
// source/simulation/sim.bench.ts. Same seed, same worst-case population (96
// replicators / 1,536 neurons), so timing deltas vs the prototype bench are
// pure representation cost (the trajectory is provably identical — see
// equivalence.spec.ts). Run with `npm run bench`.
//
// Budget (from the plan): >=1,800 ticks/sec floor, target >=2,500, p99 < ~2x p50.

import { bench, describe } from "vitest";
import { setRng } from "../../engine/math-2";
import { createScenario, update, Scenario } from "./scenario.model";

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

const DT = 1 / 30;
const WARMUP_TICKS = 200;

// Build a full-population scenario (32 of each = 96 replicators) at steady state.
function makeFullScenario(): Scenario {
  setRng(mulberry32(0x5eed));
  let scenario = createScenario({
    minReds: 32,
    maxReds: 32,
    minGreens: 32,
    maxGreens: 32,
    minBlues: 32,
    maxBlues: 32,
  });
  for (let i = 0; i < WARMUP_TICKS; i++) scenario = update(scenario, DT).scenario;
  return scenario;
}

describe("functional sim throughput @ 96 replicators", () => {
  let scenario = makeFullScenario();

  const total =
    scenario.world.reds.length + scenario.world.greens.length + scenario.world.blues.length;
  if (total < 90) {
    throw new Error(`expected ~96 replicators, got ${total}`);
  }

  bench(
    "functional scenario.update (one tick)",
    () => {
      scenario = update(scenario, DT).scenario;
    },
    { time: 2000, warmupTime: 500 },
  );
});
