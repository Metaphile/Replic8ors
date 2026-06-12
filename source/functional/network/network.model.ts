// Pure-functional neural-network model.
//
// Functional port of source/simulation/neural-network.ts. A network is an
// ordered, plain-data list of neurons. `update` is the two-phase barrier the
// prototype already had — propagate signals reading the PRE-update firing state
// of every neuron, then advance every neuron — expressed as a pure fold:
// next = f(current, dt). It returns which neurons fired this tick (replacing the
// neurons' emit('fire') so the caller, e.g. the replicator, decides what fires
// trigger). The prototype's dead Hebbian-learning block (an on('fire') handler
// whose body is unreachable behind an early `return`) is dropped.

import { Neuron, stimulate, update as updateNeuron } from "../neuron/neuron.model";

export interface Network {
  readonly neurons: readonly Neuron[];
}

export const createNetwork = (): Network => ({ neurons: [] });

// Pad a weights array so every neuron index 0..len-1 has a defined value,
// filling only the gaps with 0 (never overwriting an existing weight).
const padWeights = (weights: readonly number[], len: number): number[] => {
  const w = weights.slice();
  for (let i = 0; i < len; i++) if (w[i] === undefined) w[i] = 0;
  return w;
};

// Add a neuron: it takes the next index, and every neuron's weight array is
// padded to cover the new size (default 0, existing weights preserved). Returns
// a new network. Construction-time only (not the per-tick hot path), so copying
// weight arrays here is fine.
export const addNeuron = (network: Network, neuron: Neuron): Network => {
  const index = network.neurons.length;
  const len = index + 1;

  const existing = network.neurons.map((n) => ({ ...n, weights: padWeights(n.weights, len) }));
  const added: Neuron = { ...neuron, index, weights: padWeights(neuron.weights, len) };

  return { neurons: [...existing, added] };
};

export interface NetworkStep {
  readonly network: Network;
  // per-neuron (by index): did it cross threshold and fire this tick?
  readonly fired: readonly boolean[];
}

// Advance the network by `dt`. Phase 1 (propagate): every firing neuron
// stimulates every other neuron, read from the pre-update state. Phase 2: every
// neuron updates. Returns the new network and the per-neuron fired flags.
export const update = (network: Network, dt: number): NetworkStep => {
  const neurons = network.neurons;

  // Phase 1 — propagate. For each target, accumulate stimulation from every
  // firing source (in source order, matching the prototype's nested loop, so
  // bufferedInput sums in the identical float order). `firing` is read from the
  // original pre-update neurons; stimulate never changes it.
  const stimulated = neurons.map((target) => {
    let t = target;
    for (const source of neurons) {
      if (source.firing && source !== target) {
        t = stimulate(t, (1 / source.refractoryPeriod) * dt, source.index);
      }
    }
    return t;
  });

  // Phase 2 — update every neuron.
  const steps = stimulated.map((n) => updateNeuron(n, dt));

  return {
    network: { neurons: steps.map((s) => s.neuron) },
    fired: steps.map((s) => s.fired),
  };
};
