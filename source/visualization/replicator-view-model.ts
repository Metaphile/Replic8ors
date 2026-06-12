// View model bridging render snapshots to the prototype-shaped object the views
// expect (Phase 6).
//
// The drawing code (replicator-view, neuron-view) was written against the live
// prototype replicator: it reads `flipper.neuron`, `receptor.neurons.blue`,
// `hungerNeuron.index`, etc. Rather than rewrite ~1,000 lines of canvas code,
// we reconstruct that exact shape from a ReplicatorSnapshot once (createViewModel)
// and then mutate it in place every frame (updateViewModel), keeping all the
// neuron/flipper/receptor object references stable so the views keep working.
//
// A dying replicator vanishes from the snapshot (the sim removes the dead the
// same tick). The renderer keeps the last view model and dead-reckons it
// (deadReckon) while the death animation plays.

import { ReplicatorSnapshot, NeuronSnapshot } from "../functional/world/snapshot";

export interface NeuronViewModel extends NeuronSnapshot {
  index: number;
  potential: number;
  firing: boolean;
  sensoryPotential: number;
  inhibitoryInput: number;
  potentialDecayRate: number;
  weights: readonly number[];
}

interface FlipperViewModel {
  angle: number;
  flipProgress: number;
  flipTime: number;
  neuron: NeuronViewModel;
}

// the prototype's receptor.neurons was an array with .blue/.prey/.predator props
type ReceptorNeurons = NeuronViewModel[] & {
  blue: NeuronViewModel;
  prey: NeuronViewModel;
  predator: NeuronViewModel;
};

interface ReceptorViewModel {
  angle: number;
  neurons: ReceptorNeurons;
}

export interface ReplicatorViewModel {
  id: string;
  type: string;
  dead: boolean;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  rotation: number;
  radius: number;
  energy: number;
  numBodySegments: number;
  numInternalNeurons: number;
  receptorOffset: number;
  flipperOffset: number;
  ancestorWeights: readonly { readonly weights: readonly number[] }[];
  brain: { neurons: NeuronViewModel[] };
  flippers: FlipperViewModel[];
  receptors: ReceptorViewModel[];
  hungerNeuron: NeuronViewModel;
  thinkNeurons: NeuronViewModel[];
}

// Build a fresh, prototype-shaped view model from a snapshot. Neuron objects are
// copied once and then referenced by the flippers/receptors/hunger/think, so
// updateViewModel can mutate them in place without breaking those references.
export const createViewModel = (snap: ReplicatorSnapshot): ReplicatorViewModel => {
  const neurons: NeuronViewModel[] = snap.neurons.map((n) => ({ ...n }));

  const flippers: FlipperViewModel[] = snap.flippers.map((f) => ({
    angle: f.angle,
    flipProgress: f.flipProgress,
    flipTime: f.flipTime,
    neuron: neurons[f.neuronIndex],
  }));

  const receptors: ReceptorViewModel[] = snap.receptors.map((r) => {
    const blue = neurons[r.neuronIndices.blue];
    const prey = neurons[r.neuronIndices.prey];
    const predator = neurons[r.neuronIndices.predator];
    // array order [blue, prey, predator] matches the prototype, plus named props
    const arr = [blue, prey, predator] as ReceptorNeurons;
    arr.blue = blue;
    arr.prey = prey;
    arr.predator = predator;
    return { angle: r.angle, neurons: arr };
  });

  return {
    id: snap.id,
    type: snap.type,
    dead: false,
    position: { x: snap.position.x, y: snap.position.y },
    velocity: { x: snap.velocity.x, y: snap.velocity.y },
    rotation: snap.rotation,
    radius: snap.radius,
    energy: snap.energy,
    numBodySegments: snap.numBodySegments,
    numInternalNeurons: snap.thinkNeuronIndices.length,
    receptorOffset: snap.receptorOffset,
    flipperOffset: snap.flipperOffset,
    ancestorWeights: snap.ancestorWeights,
    brain: { neurons },
    flippers,
    receptors,
    hungerNeuron: neurons[snap.hungerNeuronIndex],
    thinkNeurons: snap.thinkNeuronIndices.map((i) => neurons[i]),
  };
};

// Mutate an existing view model in place from the latest snapshot. Object
// identities (neurons, flippers, receptors) are preserved so the views' cached
// references stay valid.
export const updateViewModel = (vm: ReplicatorViewModel, snap: ReplicatorSnapshot): void => {
  vm.position.x = snap.position.x;
  vm.position.y = snap.position.y;
  vm.velocity.x = snap.velocity.x;
  vm.velocity.y = snap.velocity.y;
  vm.rotation = snap.rotation;
  vm.energy = snap.energy;
  // radius can change at runtime via the settings panel (Size), so refresh it
  vm.radius = snap.radius;

  const neurons = vm.brain.neurons;
  for (let i = 0; i < neurons.length; i++) {
    const n = neurons[i];
    const s = snap.neurons[i];
    n.potential = s.potential;
    n.firing = s.firing;
    n.sensoryPotential = s.sensoryPotential;
    n.inhibitoryInput = s.inhibitoryInput;
    // potentialDecayRate is settings-driven (Neuron Decay) and feeds the
    // neuron-view's decay animation, so keep it current too
    n.potentialDecayRate = s.potentialDecayRate;
    n.weights = s.weights;
  }

  for (let i = 0; i < vm.flippers.length; i++) {
    vm.flippers[i].angle = snap.flippers[i].angle;
    vm.flippers[i].flipProgress = snap.flippers[i].flipProgress;
  }
};

// Advance a dying view model locally while its death effect plays (the sim has
// already dropped it). Cosmetic: straight-line drift + winding-down flippers.
export const deadReckon = (vm: ReplicatorViewModel, dt: number): void => {
  vm.position.x += vm.velocity.x * dt;
  vm.position.y += vm.velocity.y * dt;
  for (const f of vm.flippers) {
    if (f.flipProgress < 1) f.flipProgress = Math.min(1, f.flipProgress + dt / f.flipTime);
  }
};
