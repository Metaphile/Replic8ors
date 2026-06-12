// Pure-functional scenario model.
//
// Functional port of source/simulation/scenario.ts. The scenario owns the world
// plus the machinery that keeps populations balanced: a per-type gene bank
// (successful replicators are banked and re-seeded) and radial "spoke" placement
// of new arrivals. The prototype held the world by reference and mutated it,
// drove gene-banking through a 'replicator-replicated' event, and kept the gene
// bank / spoke cursors in closures. Here all of that is plain, serializable
// state and `update` is one pure transition.
//
// Determinism: `update` reproduces the prototype's RNG draw order exactly so the
// assembled sim matches the characterization snapshot —
//   1. world tick (gene-bank copies drawn in-loop via the afterReplicate hook,
//      matching the 'replicated' event's stream position);
//   2. balancePopulations over reds, then greens, then blues — each either
//      culling the oldest excess (energy -> -Infinity, dies next tick) or adding
//      the shortfall: every new member's brain is drawn first (whole population),
//      then each member's placement (radiusScale, angle) is drawn.
//
// The prototype's live settings-edit handler is intentionally omitted here; it
// only fires on setting changes (inert for the characterization) and moves into
// the worker's message handler in Phase 6.

import * as Math2 from "../../engine/math-2";
import settings from "../../settings/settings";
import {
  Replicator,
  createReplicator,
  replicate,
  getOwnWeights,
} from "../replicator/replicator.model";
import { World, createWorld, addReplicator, tick, Collision } from "../world/world.model";

const NUM_SPECIMENS_PER_TYPE = 32;
const NUM_REPLICATOR_TYPES = 3;
const NUM_SPOKES = NUM_REPLICATOR_TYPES * 3;

type ReplicatorType = "predator" | "prey" | "blue";

// where each type clusters on the radial layout
const SPOKE_OFFSET: Record<ReplicatorType, number> = { blue: 0, prey: 1, predator: 2 };
// world array name per type
const ARRAY_OF: Record<ReplicatorType, "reds" | "greens" | "blues"> = {
  predator: "reds",
  prey: "greens",
  blue: "blues",
};

// --- functional ring buffer (the gene bank) ---------------------------------

export interface RingBuffer {
  readonly items: readonly (Replicator | undefined)[];
  readonly length: number;
  readonly pushIndex: number;
  readonly nextIndex: number;
}

const createRing = (length: number): RingBuffer => ({
  items: [],
  length,
  pushIndex: 0,
  nextIndex: 0,
});

const pushRing = (ring: RingBuffer, value: Replicator): RingBuffer => {
  const items = ring.items.slice();
  items[ring.pushIndex] = value;
  return { ...ring, items, pushIndex: (ring.pushIndex + 1) % ring.length };
};

// advance the cursor, then read (matches the prototype's RingBuffer.next)
const nextRing = (ring: RingBuffer): { ring: RingBuffer; value: Replicator | undefined } => {
  const nextIndex = (ring.nextIndex + 1) % ring.length;
  return { ring: { ...ring, nextIndex }, value: ring.items[nextIndex] };
};

// --- scenario ---------------------------------------------------------------

export interface Scenario {
  readonly world: World;
  readonly minReds: number;
  readonly maxReds: number;
  readonly minGreens: number;
  readonly maxGreens: number;
  readonly minBlues: number;
  readonly maxBlues: number;
  readonly geneBank: Readonly<Record<ReplicatorType, RingBuffer>>;
  readonly spokeIndices: Readonly<Record<ReplicatorType, number>>;
}

export interface ScenarioOpts {
  minReds?: number;
  maxReds?: number;
  minGreens?: number;
  maxGreens?: number;
  minBlues?: number;
  maxBlues?: number;
}

export const createScenario = (opts: ScenarioOpts = {}): Scenario => ({
  world: createWorld(),
  minReds: opts.minReds ?? settings.scenario.minReds,
  maxReds: opts.maxReds ?? settings.scenario.maxReds,
  minGreens: opts.minGreens ?? settings.scenario.minGreens,
  maxGreens: opts.maxGreens ?? settings.scenario.maxGreens,
  minBlues: opts.minBlues ?? settings.scenario.minBlues,
  maxBlues: opts.maxBlues ?? settings.scenario.maxBlues,
  geneBank: {
    predator: createRing(NUM_SPECIMENS_PER_TYPE),
    prey: createRing(NUM_SPECIMENS_PER_TYPE),
    blue: createRing(NUM_SPECIMENS_PER_TYPE),
  },
  spokeIndices: { predator: 0, prey: 0, blue: 0 },
});

// a brand-new founder: grow one, replicate (mutated) once, reset energy and
// re-base its ancestor weights — exactly the prototype's createReplicator.
const createFounder = (type: ReplicatorType, rng: Math2.Rng): Replicator => {
  const grown = createReplicator(settings[type], rng);
  const child = replicate(grown, undefined, rng).child;
  return {
    ...child,
    energy: settings[type].energy,
    ancestorWeights: getOwnWeights(child),
  };
};

// a banked specimen's offspring: mutated copy, energy reset (prototype's
// replicateReplicator).
const reseedFounder = (founder: Replicator, type: ReplicatorType, rng: Math2.Rng): Replicator => {
  const child = replicate(founder, undefined, rng).child;
  return { ...child, energy: settings[type].energy };
};

// Add `howMany` replicators of `type`: draw the whole population's brains first
// (pulling from the gene bank when it has specimens, else fresh founders), then
// place each on its radial spoke. Returns the updated scenario.
const addNum = (
  scenario: Scenario,
  type: ReplicatorType,
  howMany: number,
  rng: Math2.Rng,
): Scenario => {
  // build the population (gene-bank cursor advances as we pull founders)
  let ring = scenario.geneBank[type];
  const population: Replicator[] = [];
  for (let i = 0; i < howMany; i++) {
    const pulled = nextRing(ring);
    ring = pulled.ring;
    population.push(
      pulled.value ? reseedFounder(pulled.value, type, rng) : createFounder(type, rng),
    );
  }

  // place each member, then add to the world
  let world = scenario.world;
  let spokeIndex = scenario.spokeIndices[type];
  const offset = SPOKE_OFFSET[type];
  const tau = Math.PI * 2;

  for (const member of population) {
    const radiusScale = Math.pow(rng(), 1 / Math.PI);
    const radius = radiusScale * world.radius;

    const center = (offset + spokeIndex) * (tau / NUM_SPOKES) - radiusScale * Math.PI * 0.5;
    const half = tau / NUM_SPOKES / 2;
    const minAngle = center - half;
    const maxAngle = center + half;
    const angle = minAngle + rng() * (maxAngle - minAngle);

    const placed: Replicator = {
      ...member,
      position: { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius },
    };

    world = addReplicator(world, placed).world;
    spokeIndex = (spokeIndex + NUM_REPLICATOR_TYPES) % NUM_SPOKES;
  }

  return {
    ...scenario,
    world,
    geneBank: { ...scenario.geneBank, [type]: ring },
    spokeIndices: { ...scenario.spokeIndices, [type]: spokeIndex },
  };
};

// Cull the oldest `excess` replicators of `type` (energy -> -Infinity; they die
// next tick, as in the prototype). Returns the updated scenario.
const cullOldest = (scenario: Scenario, type: ReplicatorType, excess: number): Scenario => {
  const arrayName = ARRAY_OF[type];
  const members = scenario.world[arrayName];

  const doomedIds = new Set(
    members
      .slice()
      .sort((a, b) => b.age - a.age)
      .slice(0, excess)
      .map((r) => r.id),
  );

  const culled = members.map((r) => (doomedIds.has(r.id) ? { ...r, energy: -Infinity } : r));

  return { ...scenario, world: { ...scenario.world, [arrayName]: culled } };
};

// Bring one type's population within [min, max]: cull excess or add shortfall.
const balanceType = (
  scenario: Scenario,
  type: ReplicatorType,
  min: number,
  max: number,
  rng: Math2.Rng,
): Scenario => {
  const count = scenario.world[ARRAY_OF[type]].length;
  const excess = count - max;
  const needed = Math.min(min, max) - count;

  if (excess > 0) return cullOldest(scenario, type, excess);
  if (needed > 0) return addNum(scenario, type, needed, rng);
  return scenario;
};

const balancePopulations = (scenario: Scenario, rng: Math2.Rng): Scenario => {
  let s = scenario;
  s = balanceType(s, "predator", s.minReds, s.maxReds, rng);
  s = balanceType(s, "prey", s.minGreens, s.maxGreens, rng);
  s = balanceType(s, "blue", s.minBlues, s.maxBlues, rng);
  return s;
};

export interface ScenarioTick {
  readonly scenario: Scenario;
  readonly collisions: readonly Collision[];
  readonly deaths: readonly string[];
}

// Advance the scenario by `dt`: world tick (gene-banking the parents of any
// replications in-loop), then rebalance populations. Returns the new scenario
// plus the tick's cosmetic effects (collisions, deaths) for the renderer.
export const update = (
  scenario: Scenario,
  dt: number,
  rng: Math2.Rng = Math2.random,
): ScenarioTick => {
  // gene-bank copies of replication parents, drawn in-loop (RNG-stream-correct).
  // The prototype cloned the genome with `parent.replicate(true, 0)`, whose
  // parent-energy-halving side effect leaked onto the live parent — so banking a
  // successful replicator penalized it an extra half its energy (it ended a
  // reproduction tick at E/4 instead of E/2). That's a latent bug: banking a
  // genome is bookkeeping and must not touch the live simulation. We still draw
  // the clone (preserving the RNG stream) and bank its genome, but return the
  // parent UNCHANGED — fixing the energy drain. This intentionally diverges from
  // the prototype at the first replication (see equivalence.spec).
  const banked: { type: ReplicatorType; specimen: Replicator }[] = [];
  const afterReplicate = (parent: Replicator): Replicator => {
    const result = replicate(parent, 0, rng);
    banked.push({ type: parent.type as ReplicatorType, specimen: result.child });
    return parent;
  };

  const tickResult = tick(scenario.world, dt, rng, afterReplicate);

  // apply the banked specimens to the gene bank (no RNG)
  const geneBank = { ...scenario.geneBank };
  for (const { type, specimen } of banked) {
    geneBank[type] = pushRing(geneBank[type], specimen);
  }

  let next: Scenario = { ...scenario, world: tickResult.world, geneBank };
  next = balancePopulations(next, rng);

  return { scenario: next, collisions: tickResult.collisions, deaths: tickResult.deaths };
};
