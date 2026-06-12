// Pure-functional replicator (creature) model.
//
// Functional port of source/simulation/replic8or.ts — the most composed module
// in the sim. A replicator is a physical Body that also owns a brain (neural
// network), a ring of flippers, and a ring of receptors. The prototype wires
// everything together with events: a motor neuron's 'fire' flips a flipper, any
// neuron's 'fire' costs energy, a flipper's 'flipping' applies force. Here the
// whole tick is one pure transition: `update` reads which neurons the network
// reports as fired and applies those consequences directly, in the same order,
// returning a new replicator plus the effects the world cares about — the
// `child` produced on replication and a `died` flag.
//
// State is plain, serializable data (no events, no prototype methods, no live
// object references): flippers/receptors refer to their neurons by index, not
// by reference, so a replicator can cross the Phase-6 worker boundary by
// structured clone.
//
// RNG draw order is preserved exactly against the prototype so the assembled
// functional world reproduces the characterization snapshot: `createReplicator`
// randomizes every weight (neuron-major, then weight-major) before syncing
// symmetry, and `replicate` constructs the child (drawing those same weights,
// which are then overwritten) before mutating the inherited weights.

import * as Math2 from "../../engine/math-2";
import { clamp, createRandRange } from "../../engine/math-2";
import Vector2 from "../../engine/vector-2";
import settings from "../../settings/settings";
import {
  Network,
  createNetwork,
  addNeuron,
  update as updateNetwork,
} from "../network/network.model";
import { createNeuron, stimulate } from "../neuron/neuron.model";
import { Body, Vec2, applyForce, updatePhysics } from "../physics/physics.model";
import { Flipper, createFlipper, flip, update as updateFlipper } from "../flipper/flipper.model";

// typed view of the engine's untyped (@ts-nocheck) Vector2.rotate: rotates `v`
// by `angle`, writing into `out` and returning it (leaving `v` untouched)
type MutVec2 = { x: number; y: number };
const rotate = (Vector2 as unknown as { rotate(v: MutVec2, angle: number, out: MutVec2): MutVec2 })
  .rotate;

// number of neurons contributed per body segment: one motor + three receptor
// (blue/prey/predator). Used for radial-symmetry weight syncing.
const NEURONS_PER_SEGMENT = 4;

export type StimulusType = "blue" | "prey" | "predator";

export interface Receptor {
  readonly angle: number;
  // brain neuron index sensitive to each stimulus type
  readonly neuronIndices: Readonly<Record<StimulusType, number>>;
}

// a snapshot of one neuron's weights, used for ancestor-weight bookkeeping
export interface WeightRecord {
  readonly weights: readonly number[];
}

// anything a replicator can sense: itself (collisions) or, in tests, a bare body
export interface Stimulus {
  readonly position: Vec2;
  readonly radius: number;
  readonly type: string;
}

export interface Replicator extends Body {
  // stable identity assigned by the world at birth (e.g. "r:3"). Empty until
  // added to a world. Replaces the prototype's object-identity tracking and is
  // what the Phase-6 renderer reconciles snapshots by.
  readonly id: string;
  readonly type: string;
  readonly brain: Network;
  readonly flippers: readonly Flipper[];
  readonly receptors: readonly Receptor[];
  readonly hungerNeuronIndex: number;
  readonly thinkNeuronIndices: readonly number[];
  readonly energy: number;
  readonly age: number;
  readonly dead: boolean;
  // settings carried on the instance so a replicator can reproduce itself
  // without re-reading the global settings (and so live edits propagate)
  readonly metabolism: number;
  readonly energyCostPerNeuronSpike: number;
  readonly numBodySegments: number;
  readonly numInternalNeurons: number;
  readonly potentialDecayRate: number;
  readonly flipperStrength: number;
  readonly receptorOffset: number;
  readonly flipperOffset: number;
  readonly predatorValue: number;
  readonly preyValue: number;
  readonly blueValue: number;
  readonly ancestorWeights: readonly WeightRecord[];
}

export type ReplicatorOpts = Record<string, unknown>;

// settings keys that define a replicator's "kind" — copied to offspring. Mirrors
// the prototype's `getOwnSettings()` (everything under settings[type]).
const settingsKeysFor = (type: string): string[] =>
  Object.keys((settings as Record<string, object>)[type] ?? settings.replicator);

// the kind-defining settings of a replicator, read from its current fields
const getOwnSettings = (replicator: Replicator): ReplicatorOpts => {
  const out: ReplicatorOpts = {};
  for (const key of settingsKeysFor(replicator.type)) {
    out[key] = (replicator as unknown as Record<string, unknown>)[key];
  }
  return out;
};

// Snapshot every neuron's weights (deep-copied) — the prototype's getOwnWeights.
export const getOwnWeights = (replicator: Replicator): WeightRecord[] =>
  replicator.brain.neurons.map((neuron) => ({ weights: neuron.weights.slice() }));

// Enforce radial symmetry: copy each segment-0 neuron's weights (rotated to the
// segment's frame) and decay rate onto the matching neuron in every other
// segment, and fold "free" (non-segment) neurons' inbound weights onto the first
// segment. Pure: reads only the original network, returns a new one. Faithful
// port of Replic8or.syncSymmetricWeights.
export const syncSymmetricWeights = (
  network: Network,
  numSegments: number,
  numNeuronsPerSegment: number,
): Network => {
  const orig = network.neurons;
  const numSymmetric = numSegments * numNeuronsPerSegment;

  const neurons = orig.map((neuron, idx) => {
    // symmetric neurons outside the first segment: mirror segment 0
    if (idx < numSymmetric && idx >= numNeuronsPerSegment) {
      const segmentIndex = Math.floor(idx / numNeuronsPerSegment);
      const sourceIndex = idx - segmentIndex * numNeuronsPerSegment;
      const source = orig[sourceIndex];

      const weights = source.weights.map((weight, weightIndex) => {
        if (weightIndex < numSymmetric) {
          let sourceWeightIndex = weightIndex;
          sourceWeightIndex -= segmentIndex * numNeuronsPerSegment;
          // source indexes for low-index weights are negative; wrap them
          sourceWeightIndex += numSymmetric;
          sourceWeightIndex %= numSymmetric;
          return source.weights[sourceWeightIndex];
        }
        return weight;
      });

      return { ...neuron, potentialDecayRate: source.potentialDecayRate, weights };
    }

    // free neurons: inbound connections mirror the first segment
    // TODO (from prototype) almost certainly wrong with >1 free neuron
    if (idx >= numSymmetric) {
      const weights = neuron.weights.map((weight, weightIndex, weights) =>
        weightIndex < numSymmetric ? weights[weightIndex % numNeuronsPerSegment] : weight,
      );
      return { ...neuron, weights };
    }

    // first-segment symmetric neurons: unchanged (they're the source of truth)
    return neuron;
  });

  return { neurons };
};

// Randomize every weight in -1..1 (neuron-major then weight-major, matching the
// prototype's draw order), then enforce radial symmetry.
const programNonsense = (
  network: Network,
  numBodySegments: number,
  randRange: Math2.RandRange,
): Network => {
  const neurons = network.neurons.map((neuron) => ({
    ...neuron,
    weights: neuron.weights.map(() => randRange(-1.0, 1.0)),
  }));

  return syncSymmetricWeights({ neurons }, numBodySegments, NEURONS_PER_SEGMENT);
};

// Build a replicator with a freshly-grown, randomly-weighted brain. Neurons are
// added in the prototype's exact order — per segment: motor, blue, prey,
// predator — then the hunger neuron, then the internal "think" neurons — so
// neuron indices line up with the prototype's. RNG is injectable for
// determinism; it defaults to the shared seeded source.
export const createReplicator = (
  opts: ReplicatorOpts = {},
  rng: Math2.Rng = Math2.random,
): Replicator => {
  const config = { ...settings.replicator, ...opts } as Record<string, number | string>;
  const randRange = createRandRange(rng);

  const numBodySegments = config.numBodySegments as number;
  const numInternalNeurons = config.numInternalNeurons as number;
  const potentialDecayRate = config.potentialDecayRate as number;
  const flipperStrength = config.flipperStrength as number;
  const receptorOffset = config.receptorOffset as number;
  const flipperOffset = config.flipperOffset as number;

  let brain = createNetwork();
  const flippers: Flipper[] = [];
  const receptors: Receptor[] = [];
  const tau = Math.PI * 2;

  for (let i = 0; i < numBodySegments; i++) {
    // motor neuron + its flipper
    const motorIndex = brain.neurons.length;
    brain = addNeuron(brain, createNeuron({ potentialDecayRate }));
    const flipperAngle = flipperOffset + (i / numBodySegments) * tau;
    flippers.push(
      createFlipper(flipperAngle, { strength: flipperStrength, neuronIndex: motorIndex }),
    );

    // three receptor neurons (blue, prey, predator) + their receptor
    const blue = brain.neurons.length;
    brain = addNeuron(brain, createNeuron({ potentialDecayRate }));
    const prey = brain.neurons.length;
    brain = addNeuron(brain, createNeuron({ potentialDecayRate }));
    const predator = brain.neurons.length;
    brain = addNeuron(brain, createNeuron({ potentialDecayRate }));
    const receptorAngle = receptorOffset + (i / numBodySegments) * tau;
    receptors.push({ angle: receptorAngle, neuronIndices: { blue, prey, predator } });
  }

  const hungerNeuronIndex = brain.neurons.length;
  brain = addNeuron(brain, createNeuron({ potentialDecayRate }));

  const thinkNeuronIndices: number[] = [];
  for (let n = numInternalNeurons; n > 0; n--) {
    thinkNeuronIndices.push(brain.neurons.length);
    brain = addNeuron(brain, createNeuron({ potentialDecayRate }));
  }

  brain = programNonsense(brain, numBodySegments, randRange);

  const replicator: Replicator = {
    id: "",
    type: config.type as string,
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    rotation: 0,
    angularVelocity: 0,
    mass: config.mass as number,
    drag: config.drag as number,
    radius: config.radius as number,
    elasticity: config.elasticity as number,
    brain,
    flippers,
    receptors,
    hungerNeuronIndex,
    thinkNeuronIndices,
    energy: config.energy as number,
    age: 0,
    dead: false,
    metabolism: config.metabolism as number,
    energyCostPerNeuronSpike: config.energyCostPerNeuronSpike as number,
    numBodySegments,
    numInternalNeurons,
    potentialDecayRate,
    flipperStrength,
    receptorOffset,
    flipperOffset,
    predatorValue: config.predatorValue as number,
    preyValue: config.preyValue as number,
    blueValue: config.blueValue as number,
    ancestorWeights: [],
  };

  const ancestorWeights = (opts.ancestorWeights as WeightRecord[]) ?? getOwnWeights(replicator);
  return { ...replicator, ancestorWeights };
};

// Stimulate the brain with sensory input from `stimulus`. Each receptor feeds
// the neuron matching the stimulus's type; input follows an inverse-square-ish
// falloff from the receptor's point on the body to the stimulus's nearest edge.
// Returns a new replicator. Throws on an unknown stimulus type, as the prototype
// did.
export const sense = (replicator: Replicator, stimulus: Stimulus, dt: number): Replicator => {
  const neurons = replicator.brain.neurons.slice();

  const repPosX = replicator.position.x;
  const repPosY = replicator.position.y;
  const repRadius = replicator.radius;
  const repRotation = replicator.rotation;

  for (const receptor of replicator.receptors) {
    const neuronIndex = receptor.neuronIndices[stimulus.type as StimulusType];

    if (neuronIndex === undefined) {
      throw new Error(`can't sense unknown stimulus type ${stimulus.type}`);
    }

    // receptor's point on the body's edge
    const receptPosX = repPosX + Math.cos(repRotation + receptor.angle) * repRadius;
    const receptPosY = repPosY + Math.sin(repRotation + receptor.angle) * repRadius;

    // distance from pointlike receptor to nearest edge of stimulus
    const dx = stimulus.position.x - receptPosX;
    const dy = stimulus.position.y - receptPosY;
    const distance = Math.sqrt(dx * dx + dy * dy) - stimulus.radius;

    const curveWidth = 5;
    const curveHeight = 700;
    // inverse-square-like falloff with no asymptote at distance 0
    const input = curveHeight * (1 / (1 + Math.pow(distance / curveWidth, 2))) * dt;

    neurons[neuronIndex] = stimulate(neurons[neuronIndex], input);
  }

  return { ...replicator, brain: { neurons } };
};

// Produce an offspring that inherits this replicator's settings and (mutated)
// weights. The child is first grown fresh — drawing the same random weights the
// prototype's constructor did (preserving RNG order) — then its weights are
// overwritten with the parent's, mutated, decay rates copied, and symmetry
// re-synced. Parent and child split the parent's energy. Returns both.
export const replicate = (
  parent: Replicator,
  mutationRate: number = 0.04,
  rng: Math2.Rng = Math2.random,
): { parent: Replicator; child: Replicator } => {
  const randRange = createRandRange(rng);

  // build the child structure (this draws — and discards — random weights, as
  // the prototype's `Replic8or(parent.getOwnSettings())` did)
  const grown = createReplicator(getOwnSettings(parent), rng);

  // inherit parent's weights, mutated; copy decay rates; then re-sync symmetry
  const copied = grown.brain.neurons.map((neuron, i) => ({
    ...neuron,
    weights: parent.brain.neurons[i].weights.slice(),
  }));

  const mutated = copied.map((neuron) => ({
    ...neuron,
    weights: neuron.weights.map((weight) => {
      if (mutationRate > rng()) {
        // -1..1, biased toward 0
        const mutation = Math.pow(randRange(-1, 1), 3);
        return Math.sin(Math.asin(weight) + Math.asin(mutation));
      }
      return weight;
    }),
  }));

  const withDecay = mutated.map((neuron, i) => ({
    ...neuron,
    potentialDecayRate: parent.brain.neurons[i].potentialDecayRate,
  }));

  const brain = syncSymmetricWeights(
    { neurons: withDecay },
    parent.numBodySegments,
    NEURONS_PER_SEGMENT,
  );

  // divide parent energy between parent and child (parent energy might be > 1)
  const splitEnergy = parent.energy / 2;

  const child: Replicator = {
    ...grown,
    brain,
    ancestorWeights: parent.ancestorWeights,
    energy: splitEnergy,
    position: { ...parent.position },
    velocity: { ...parent.velocity },
    // activate all flippers on birth because it looks cool
    flippers: grown.flippers.map(flip),
  };

  return { parent: { ...parent, energy: splitEnergy }, child };
};

// Mark the replicator dead. Returns a new replicator.
export const die = (replicator: Replicator): Replicator => ({ ...replicator, dead: true });

export interface ReplicatorStep {
  readonly replicator: Replicator;
  // per-neuron (by index): did it fire this tick?
  readonly fired: readonly boolean[];
  // offspring produced this tick (energy reached capacity), else null
  readonly child: Replicator | null;
  // did the replicator die this tick (ran out of energy)?
  readonly died: boolean;
}

// Advance the replicator by `dt`. Order matches the prototype exactly:
//   1. stimulate the hunger neuron (before the brain updates)
//   2. update the brain -> which neurons fired
//   3. charge energy per spike; fire-driven flippers flip
//   4. flippers update -> propulsion forces applied to the body
//   5. integrate physics
//   6. replicate if energy reached capacity
//   7. pay metabolic cost; die if out of energy
//
// `afterReplicate` lets the environment react to a birth and further transform
// the parent, in the prototype's exact stream position (right after the split,
// before metabolism). This makes explicit what the prototype hid inside a
// 'replicated' event: the scenario's gene-bank clone re-used replicate(), whose
// parent-energy-halving side effect leaked onto the live parent. Default is
// identity (no reaction).
export const update = (
  replicator: Replicator,
  dt: number,
  rng: Math2.Rng = Math2.random,
  afterReplicate: (parent: Replicator) => Replicator = (parent) => parent,
): ReplicatorStep => {
  // 1. stimulate hunger neuron _before_ updating the brain
  const hungerInput = Math.pow(1 - clamp(replicator.energy, 0, 1), 2) * 30 * dt;
  const stimulatedHunger = stimulate(
    replicator.brain.neurons[replicator.hungerNeuronIndex],
    hungerInput,
  );
  const preBrain: Network = {
    neurons: replicator.brain.neurons.map((neuron, i) =>
      i === replicator.hungerNeuronIndex ? stimulatedHunger : neuron,
    ),
  };

  // 2. update the brain
  const { network: brain, fired } = updateNetwork(preBrain, dt);

  // 3. metabolic cost per spike, in neuron-index order (prototype fires in order)
  let energy = replicator.energy;
  for (let i = 0; i < fired.length; i++) {
    if (fired[i]) energy -= replicator.energyCostPerNeuronSpike;
  }

  // 4. fire-driven flips, then flipper update applies propulsion forces. Forces
  //    use the body's rotation _before_ physics integration (as the prototype's
  //    flipper loop ran before updatePhysics). Body accumulates across flippers
  //    in segment order.
  let body: Replicator = { ...replicator, age: replicator.age + dt, brain, energy };
  const flippers = replicator.flippers.map((flipper) => {
    const flipped = fired[flipper.neuronIndex] ? flip(flipper) : flipper;
    const { flipper: next, force } = updateFlipper(flipped, dt);
    if (force) {
      const rotated = rotate({ x: force.x, y: force.y }, body.rotation, { x: 0, y: 0 });
      body = applyForce(body, rotated as Vec2, dt);
    }
    return next;
  });
  body = { ...body, flippers };

  // 5. integrate physics
  body = updatePhysics(body, dt);

  // 6. replicate when the stomach is full, then let the environment react
  let child: Replicator | null = null;
  if (body.energy >= 1) {
    const result = replicate(body, undefined, rng);
    body = afterReplicate(result.parent);
    child = result.child;
  }

  // 7. metabolic cost over time; die if out of energy
  body = { ...body, energy: body.energy - body.metabolism * dt };
  const died = body.energy <= 0;
  if (died) body = { ...body, dead: true };

  return { replicator: body, fired, child, died };
};
