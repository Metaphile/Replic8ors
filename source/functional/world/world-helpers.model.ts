// Pure helpers for the functional world tick.
//
// Functional port of source/simulation/world-helpers.ts. `areCloserThan` is a
// pure predicate (unchanged). `transferEnergy` replaces the prototype's
// `transferEnergyBetween`, which mutated both bodies' energy and emitted
// gained/lost-energy events: here it returns both bodies with their new energy
// plus an explicit `aGained`/`bGained` so the caller can drive the cosmetic
// effects the events used to trigger.

import { Replicator } from "../replicator/replicator.model";

// Are the two bodies' edges within `distance` of each other? Center-to-center
// comparison in squared space (no sqrt). Pure predicate.
export const areCloserThan = (
  a: { position: { x: number; y: number }; radius: number },
  b: { position: { x: number; y: number }; radius: number },
  distance: number,
): boolean => {
  const dx = b.position.x - a.position.x;
  const dy = b.position.y - a.position.y;

  const actual = dx * dx + dy * dy; // center to center
  const reach = b.radius + a.radius + distance;
  const minimum = reach * reach;

  return actual < minimum;
};

export interface EnergyTransfer {
  readonly a: Replicator;
  readonly b: Replicator;
  // sign of each body's energy change this collision (for cosmetic effects)
  readonly aGained: number;
  readonly bGained: number;
}

// Exchange energy on collision: each body's energy changes by its valuation of
// the other's type (e.g. a predator gains from prey). Only transfers when both
// bodies have positive energy. Returns both bodies and the per-body deltas.
export const transferEnergy = (a: Replicator, b: Replicator): EnergyTransfer => {
  if (a.energy > 0 && b.energy > 0) {
    const aChange = valueOf(a, b.type);
    const bChange = valueOf(b, a.type);
    return {
      a: { ...a, energy: a.energy + aChange },
      b: { ...b, energy: b.energy + bChange },
      aGained: aChange,
      bGained: bChange,
    };
  }

  return { a, b, aGained: 0, bGained: 0 };
};

// a's valuation of colliding with a body of `otherType` (predatorValue etc.)
const valueOf = (replicator: Replicator, otherType: string): number => {
  switch (otherType) {
    case "predator":
      return replicator.predatorValue;
    case "prey":
      return replicator.preyValue;
    case "blue":
      return replicator.blueValue;
    default:
      return 0;
  }
};
