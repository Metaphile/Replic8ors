// Pure-functional world model.
//
// Functional port of source/simulation/world.ts. A world is a plain-data set of
// replicators (partitioned reds/greens/blues, matching the prototype's arrays)
// plus the collider bookkeeping needed to detect *new* collisions. The
// prototype wired lifecycle and collisions through events and mutated collider
// arrays in place; here `tick` is one pure transition returning the next world
// plus inspectable effects (collisions, deaths, replications).
//
// Determinism note: `tick` reproduces the prototype's exact operation order so
// the assembled functional sim matches the characterization snapshot —
//   phase 1: pairwise (i<j over [reds, greens, blues]) sense -> collide ->
//            energy-transfer-on-new-collision;
//   phase 2: update each start-of-tick replicator in order, removing the dead
//            and appending newborn children to the end of their type array
//            (exactly as the prototype's add/remove events did).
// The `afterReplicate` hook fires synchronously in-loop right after a
// replication, so the scenario's gene-bank copy (which draws RNG) lands at the
// same point in the RNG stream the prototype's 'replicated' event did.

import * as Math2 from "../../engine/math-2";
import { Replicator, update as updateReplicator, sense } from "../replicator/replicator.model";
import { collide } from "../physics/physics.model";
import { areCloserThan, transferEnergy } from "./world-helpers.model";

// id prefix per replicator type (reds/greens/blues)
const PREFIX: Record<string, string> = { predator: "r", prey: "g", blue: "b" };

export interface World {
  readonly reds: readonly Replicator[];
  readonly greens: readonly Replicator[];
  readonly blues: readonly Replicator[];
  readonly radius: number;
  // for the sense curve (height 700, width 5) strength is ~0 past 200 units
  readonly maxSenseRadius: number;
  // ids each replicator collided with last tick, keyed by replicator id —
  // drives "is this a *new* collision?" (only new collisions transfer energy)
  readonly previousColliders: Readonly<Record<string, readonly string[]>>;
  // monotonic id counters per type
  readonly idCounters: Readonly<{ r: number; g: number; b: number }>;
}

export const createWorld = (): World => ({
  reds: [],
  greens: [],
  blues: [],
  radius: 460,
  maxSenseRadius: 200,
  previousColliders: {},
  idCounters: { r: 0, g: 0, b: 0 },
});

const allReplicators = (world: World): Replicator[] => [
  ...world.reds,
  ...world.greens,
  ...world.blues,
];

const partition = (replicators: readonly Replicator[]) => ({
  reds: replicators.filter((r) => r.type === "predator"),
  greens: replicators.filter((r) => r.type === "prey"),
  blues: replicators.filter((r) => r.type === "blue"),
});

// Add a replicator to the world: stamp it with a fresh id, seed its collider set
// against everything it already overlaps (so an overlapping spawn isn't counted
// as a fresh collision next tick), and append it to its type's array. Returns
// the new world and the stamped replicator.
export const addReplicator = (
  world: World,
  replicator: Replicator,
): { world: World; replicator: Replicator } => {
  const prefix = PREFIX[replicator.type] ?? "x";
  const counter = { ...world.idCounters };
  const id = `${prefix}:${counter[prefix as "r" | "g" | "b"]}`;
  counter[prefix as "r" | "g" | "b"]++;

  const added: Replicator = { ...replicator, id };

  // seed colliders bidirectionally against current members
  const previousColliders: Record<string, string[]> = {};
  for (const key of Object.keys(world.previousColliders)) {
    previousColliders[key] = world.previousColliders[key].slice();
  }
  previousColliders[id] = [];
  for (const existing of allReplicators(world)) {
    if (areCloserThan(added, existing, 0)) {
      previousColliders[id].push(existing.id);
      (previousColliders[existing.id] ??= []).push(id);
    }
  }

  const byType = added.type === "predator" ? "reds" : added.type === "prey" ? "greens" : "blues";

  return {
    world: {
      ...world,
      [byType]: [...world[byType], added],
      previousColliders,
      idCounters: counter,
    },
    replicator: added,
  };
};

export interface Collision {
  readonly a: string;
  readonly b: string;
}

export interface Replication {
  readonly parent: Replicator;
  readonly child: Replicator;
}

export interface WorldTick {
  readonly world: World;
  readonly collisions: readonly Collision[];
  readonly deaths: readonly string[];
  readonly replications: readonly Replication[];
}

// Advance the whole world by `dt`. See the file header for the ordering
// guarantees. `afterReplicate(parent)` runs inside the parent's own update,
// immediately after the split and before metabolism — the prototype's exact
// 'replicated' stream position — so the scenario's gene-bank copy (which draws
// RNG and, in the prototype, halved the parent again) lands correctly. It
// returns the further-transformed parent.
export const tick = (
  world: World,
  dt: number,
  rng: Math2.Rng = Math2.random,
  afterReplicate: (parent: Replicator) => Replicator = (parent) => parent,
): WorldTick => {
  const states = allReplicators(world);
  const n = states.length;
  const ids = states.map((r) => r.id);

  // phase 1 — pairwise sense / collide / energy transfer
  const currentColliders: string[][] = ids.map(() => []);
  const collisions: Collision[] = [];

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (!areCloserThan(states[i], states[j], world.maxSenseRadius)) continue;

      states[i] = sense(states[i], states[j], dt);
      states[j] = sense(states[j], states[i], dt);

      if (!areCloserThan(states[i], states[j], 0)) continue;

      const collided = collide(states[i], states[j], dt, rng);
      states[i] = collided.a;
      states[j] = collided.b;

      currentColliders[i].push(ids[j]);
      currentColliders[j].push(ids[i]);

      const wasColliding = (world.previousColliders[ids[i]] ?? []).includes(ids[j]);
      if (!wasColliding) {
        collisions.push({ a: ids[i], b: ids[j] });
        const transferred = transferEnergy(states[i], states[j]);
        states[i] = transferred.a;
        states[j] = transferred.b;
      }
    }
  }

  // phase 2 — update each start-of-tick replicator in order; remove the dead;
  // append newborn children. `live` tracks current membership so children seed
  // their colliders against the right set; `nextColliders` becomes next tick's
  // previousColliders.
  const live: Replicator[] = states.slice();
  const nextColliders: Record<string, string[]> = {};
  for (let k = 0; k < n; k++) nextColliders[ids[k]] = currentColliders[k].slice();

  const counter = { ...world.idCounters };
  const deaths: string[] = [];
  const replications: Replication[] = [];

  for (let k = 0; k < n; k++) {
    // the parent's update runs afterReplicate in-stream if it replicates
    const step = updateReplicator(states[k], dt, rng, afterReplicate);
    const parent = step.replicator;

    const liveIndex = live.findIndex((r) => r.id === ids[k]);

    if (step.died) {
      deaths.push(ids[k]);
      if (liveIndex !== -1) live.splice(liveIndex, 1);
      delete nextColliders[ids[k]];
      continue;
    }

    // keep the post-update parent in the live set
    if (liveIndex !== -1) live[liveIndex] = parent;

    if (step.child) {
      const prefix = PREFIX[parent.type] ?? "x";
      const childId = `${prefix}:${counter[prefix as "r" | "g" | "b"]}`;
      counter[prefix as "r" | "g" | "b"]++;
      const child: Replicator = { ...step.child, id: childId };

      // seed child colliders against the current live set (bidirectional)
      const childColliders: string[] = [];
      for (const other of live) {
        if (areCloserThan(child, other, 0)) {
          childColliders.push(other.id);
          (nextColliders[other.id] ??= []).push(childId);
        }
      }
      nextColliders[childId] = childColliders;

      live.push(child);
      replications.push({ parent, child });
    }
  }

  const { reds, greens, blues } = partition(live);

  return {
    world: {
      ...world,
      reds,
      greens,
      blues,
      previousColliders: nextColliders,
      idCounters: counter,
    },
    collisions,
    deaths,
    replications,
  };
};
