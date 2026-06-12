// Render snapshot layer (Phase 6).
//
// `toSnapshot(world)` projects the live functional world to a lean, fully
// serializable render schema — the contract between the simulation (which will
// run in a Web Worker) and the renderer (which reconciles successive snapshots
// by stable id). It carries only what the visualization reads, not the sim's
// internal neuron bookkeeping (bufferedInput, refractoryPeriod, metabolism, …),
// keeping the postMessage payload small.
//
// Neurons are projected to a flat per-replicator array; flippers/receptors/
// hunger/think reference them by index (as the functional replicator already
// does), so the renderer looks neurons up rather than holding live references.
// The schema is plain data only (no functions/prototypes) so it survives
// structured clone across the worker boundary.

import { World } from "./world.model";
import { Replicator } from "../replicator/replicator.model";
import { Neuron } from "../neuron/neuron.model";

export interface NeuronSnapshot {
  readonly index: number;
  readonly potential: number;
  readonly firing: boolean;
  readonly sensoryPotential: number;
  readonly inhibitoryInput: number;
  readonly potentialDecayRate: number;
  readonly weights: readonly number[];
}

export interface FlipperSnapshot {
  readonly angle: number;
  readonly flipProgress: number;
  readonly neuronIndex: number;
}

export interface ReceptorSnapshot {
  readonly angle: number;
  readonly neuronIndices: Readonly<{ blue: number; prey: number; predator: number }>;
}

export interface ReplicatorSnapshot {
  readonly id: string;
  readonly type: string;
  readonly dead: boolean;
  readonly position: Readonly<{ x: number; y: number }>;
  readonly velocity: Readonly<{ x: number; y: number }>;
  readonly rotation: number;
  readonly radius: number;
  readonly energy: number;
  readonly numBodySegments: number;
  readonly receptorOffset: number;
  readonly flipperOffset: number;
  readonly neurons: readonly NeuronSnapshot[];
  readonly flippers: readonly FlipperSnapshot[];
  readonly receptors: readonly ReceptorSnapshot[];
  readonly hungerNeuronIndex: number;
  readonly thinkNeuronIndices: readonly number[];
  readonly ancestorWeights: readonly { readonly weights: readonly number[] }[];
}

export interface WorldSnapshot {
  readonly radius: number;
  // reds, then greens, then blues (the prototype's draw/iteration order)
  readonly replicators: readonly ReplicatorSnapshot[];
  // population counts, for the HUD
  readonly counts: Readonly<{ reds: number; greens: number; blues: number }>;
}

const neuronSnapshot = (neuron: Neuron): NeuronSnapshot => ({
  index: neuron.index,
  potential: neuron.potential,
  firing: neuron.firing,
  sensoryPotential: neuron.sensoryPotential,
  inhibitoryInput: neuron.inhibitoryInput,
  potentialDecayRate: neuron.potentialDecayRate,
  // weights only change on replication, but they're cheap and the renderer
  // draws connection strengths from them
  weights: neuron.weights,
});

const replicatorSnapshot = (replicator: Replicator): ReplicatorSnapshot => ({
  id: replicator.id,
  type: replicator.type,
  dead: replicator.dead,
  position: { x: replicator.position.x, y: replicator.position.y },
  velocity: { x: replicator.velocity.x, y: replicator.velocity.y },
  rotation: replicator.rotation,
  radius: replicator.radius,
  energy: replicator.energy,
  numBodySegments: replicator.numBodySegments,
  receptorOffset: replicator.receptorOffset,
  flipperOffset: replicator.flipperOffset,
  neurons: replicator.brain.neurons.map(neuronSnapshot),
  flippers: replicator.flippers.map((f) => ({
    angle: f.angle,
    flipProgress: f.flipProgress,
    neuronIndex: f.neuronIndex,
  })),
  receptors: replicator.receptors.map((r) => ({
    angle: r.angle,
    neuronIndices: { ...r.neuronIndices },
  })),
  hungerNeuronIndex: replicator.hungerNeuronIndex,
  thinkNeuronIndices: replicator.thinkNeuronIndices,
  ancestorWeights: replicator.ancestorWeights.map((w) => ({ weights: w.weights })),
});

// Project the world to a serializable render snapshot.
export const toSnapshot = (world: World): WorldSnapshot => ({
  radius: world.radius,
  replicators: [...world.reds, ...world.greens, ...world.blues].map(replicatorSnapshot),
  counts: {
    reds: world.reds.length,
    greens: world.greens.length,
    blues: world.blues.length,
  },
});
