// A/B equivalence gate: the functional sim must reproduce the prototype sim's
// trajectory tick-for-tick under the same seed. This is the Phase-5 behavior
// oracle — the sim is chaotic, so any ordering/float divergence shows up fast.
//
// Both runs re-seed the shared Math2 RNG, so they're independent; we capture a
// rounded digest every tick and compare. The digest rounds to a few decimals,
// but because the sim is chaotic, only a genuinely bit-faithful port keeps the
// digests matching out to 300 ticks.

import { describe, it, expect } from "vitest";
import { setRng } from "../../engine/math-2";
import World from "../../simulation/world";
import Scenario from "../../simulation/scenario";
import { createScenario, update } from "./scenario.model";

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

const round = (x: number, places = 4): number => {
  if (!Number.isFinite(x)) return x;
  const f = 10 ** places;
  return Math.round(x * f) / f;
};

function replicatorDigest(r: any) {
  return {
    type: r.type,
    pos: [round(r.position.x, 2), round(r.position.y, 2)],
    vel: [round(r.velocity.x, 2), round(r.velocity.y, 2)],
    rotation: round(r.rotation),
    energy: round(r.energy),
    age: round(r.age),
    potentials: r.brain.neurons.map((n: any) => round(n.potential)),
    firing: r.brain.neurons.map((n: any) => n.firing),
  };
}

function worldDigest(reds: any[], greens: any[], blues: any[]) {
  const all = [...reds, ...greens, ...blues];
  return {
    counts: { reds: reds.length, greens: greens.length, blues: blues.length },
    totalEnergy: round(all.reduce((s, r) => s + r.energy, 0)),
    replicators: all.map(replicatorDigest),
  };
}

const SEED = 0x5eed;
const DT = 1 / 30;

interface Pops {
  minReds: number;
  maxReds: number;
  minGreens: number;
  maxGreens: number;
  minBlues: number;
  maxBlues: number;
}

function runPrototype(pops: Pops, ticks: number): unknown[] {
  setRng(mulberry32(SEED));
  const world: any = World();
  const scenario: any = Scenario(world, pops);
  const digests: unknown[] = [];
  for (let tick = 1; tick <= ticks; tick++) {
    scenario.update(DT);
    digests.push(worldDigest(world.reds, world.greens, world.blues));
  }
  return digests;
}

function runFunctional(pops: Pops, ticks: number): { digests: unknown[]; births: number } {
  setRng(mulberry32(SEED));
  let scenario = createScenario(pops);
  const digests: unknown[] = [];
  for (let tick = 1; tick <= ticks; tick++) {
    scenario = update(scenario, DT).scenario;
    const w = scenario.world;
    digests.push(worldDigest([...w.reds], [...w.greens], [...w.blues]));
  }
  // total replicators ever created beyond the initial seeding indicates the
  // replication / death / gene-bank paths were exercised
  const c = scenario.world.idCounters;
  return { digests, births: c.r + c.g + c.b };
}

function assertTrajectoriesMatch(proto: unknown[], func: unknown[], ticks: number) {
  for (let i = 0; i < ticks; i++) {
    if (JSON.stringify(proto[i]) !== JSON.stringify(func[i])) {
      throw new Error(
        `diverged at tick ${i + 1}\n` +
          `prototype: ${JSON.stringify(proto[i], null, 2)}\n` +
          `functional: ${JSON.stringify(func[i], null, 2)}`,
      );
    }
  }
}

describe("functional sim ≡ prototype sim", () => {
  it("reproduces a small run tick-for-tick (300 ticks, 2 of each)", () => {
    const pops = { minReds: 2, maxReds: 2, minGreens: 2, maxGreens: 2, minBlues: 2, maxBlues: 2 };
    const proto = runPrototype(pops, 300);
    const func = runFunctional(pops, 300);
    setRng(Math.random);

    assertTrajectoriesMatch(proto, func.digests, 300);
  });

  it("reproduces a dense run that replicates, dies and gene-banks (250 ticks, 12 of each)", () => {
    // dense, capped populations force collisions -> energy gain -> replication
    // -> over-cap culling, exercising the gene bank, child spawning and death.
    const pops = {
      minReds: 12,
      maxReds: 12,
      minGreens: 12,
      maxGreens: 12,
      minBlues: 12,
      maxBlues: 12,
    };
    const proto = runPrototype(pops, 250);
    const func = runFunctional(pops, 250);
    setRng(Math.random);

    // sanity: the run must actually exercise replication (more than the initial 36)
    expect(func.births).toBeGreaterThan(36);

    assertTrajectoriesMatch(proto, func.digests, 250);
  });
});
