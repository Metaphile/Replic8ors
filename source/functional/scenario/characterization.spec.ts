// Characterization (golden-master) test for the functional simulation.
//
// This is the behavior oracle for the sim now that the prototype is gone (it
// replaces the deleted source/simulation/characterization.spec.ts, and the
// A/B equivalence test that proved the port faithful). It seeds the RNG, runs a
// small fixed world, and snapshots a digest of world state at fixed checkpoints.
// Any unintended change to sim logic must reproduce this snapshot; a deliberate
// change re-baselines it (`vitest -u`).
//
// Determinism relies on setRng() routing every random source in the sim
// (replicator weights/mutation, scenario placement, physics overlap-nudge).

import { describe, it, expect } from "vitest";
import { setRng } from "../../engine/math-2";
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
    // neuron potentials capture the brain's internal state precisely
    potentials: r.brain.neurons.map((n: any) => round(n.potential)),
    firing: r.brain.neurons.map((n: any) => n.firing),
  };
}

function worldDigest(world: any) {
  const all = [...world.reds, ...world.greens, ...world.blues];
  return {
    counts: { reds: world.reds.length, greens: world.greens.length, blues: world.blues.length },
    totalEnergy: round(all.reduce((s: number, r: any) => s + r.energy, 0)),
    replicators: all.map(replicatorDigest),
  };
}

describe("functional simulation characterization", () => {
  it("reproduces a deterministic run", () => {
    setRng(mulberry32(0x5eed));

    // small, fixed populations so the digest stays readable but still exercises
    // predator/prey/blue sensing, collisions and energy transfer.
    let scenario = createScenario({
      minReds: 2,
      maxReds: 2,
      minGreens: 2,
      maxGreens: 2,
      minBlues: 2,
      maxBlues: 2,
    });

    const dt = 1 / 30;
    const checkpoints = [1, 30, 90, 300];
    const digests: Record<number, unknown> = {};

    const maxTick = Math.max(...checkpoints);
    for (let tick = 1; tick <= maxTick; tick++) {
      scenario = update(scenario, dt).scenario;
      if (checkpoints.includes(tick)) {
        digests[tick] = worldDigest(scenario.world);
      }
    }

    expect(digests).toMatchSnapshot();

    // restore production RNG for any subsequent tests in the same worker
    setRng(Math.random);
  });
});
