// Pure-functional neuron model.
//
// This is the functional port of source/simulation/neuron.ts. The prototype
// version mutates `potential`, `firing`, `inputBuffer`, etc. in place and emits
// a 'fire' event from inside update(). Here, state is immutable and every
// transition is a pure function returning a new Neuron. The 'fire' side effect
// becomes an explicit `fired` flag returned from update(), so the caller — not
// a hidden event subscription — decides what happens when a neuron fires.

import { clamp } from "../../engine/math-2";
import { potentialDecayFn } from "./neuron-helpers";

export interface Neuron {
  // connection weights, indexed by source neuron index
  readonly weights: readonly number[];
  // membrane potential, normalized 0..1 (biological: -70mV resting .. -55mV threshold)
  readonly potential: number;
  readonly sensoryPotential: number;
  readonly gotSensoryInput: boolean;
  // total inhibitory input since the neuron last fired
  readonly inhibitoryInput: number;
  readonly firing: boolean;
  readonly simTimeSinceLastFired: number;
  readonly index: number;
  // input is buffered (not applied immediately) so all upstream neurons get
  // equal footing when the sum is applied on the next update(). The prototype
  // kept an array and summed it; since it's only ever summed, a running scalar
  // is equivalent (same accumulation order → same float result) and allocates
  // nothing per stimulate — the hot path runs ~hundreds of K stimulates/frame.
  readonly bufferedInput: number;
  readonly potentialDecayRate: number;
  readonly refractoryPeriod: number;
}

export interface NeuronOpts {
  potentialDecayRate?: number;
  refractoryPeriod?: number;
  index?: number;
  weights?: readonly number[];
}

const defaults = {
  potentialDecayRate: 0.0,
  refractoryPeriod: 0.6,
};

export const createNeuron = (opts: NeuronOpts = {}): Neuron => ({
  weights: opts.weights ?? [],
  potential: 0,
  sensoryPotential: 0,
  gotSensoryInput: false,
  inhibitoryInput: 0,
  firing: false,
  simTimeSinceLastFired: 0,
  index: opts.index ?? -1,
  bufferedInput: 0,
  potentialDecayRate: opts.potentialDecayRate ?? defaults.potentialDecayRate,
  refractoryPeriod: opts.refractoryPeriod ?? defaults.refractoryPeriod,
});

// Buffer input from `sourceIndex` for the next update. Input is modeled as a
// fixed-magnitude value with excitatory and inhibitory components: a 1:1 ratio
// nets 0, 2:1 nets > 0, etc. Input is ignored while the neuron is firing.
// Returns a new neuron.
export const stimulate = (
  neuron: Neuron,
  dt: number,
  sourceIndex: number = neuron.index,
): Neuron => {
  const w = neuron.weights[sourceIndex];
  const input = w * dt;

  let { inhibitoryInput, bufferedInput, sensoryPotential, gotSensoryInput } = neuron;

  if (!neuron.firing) {
    inhibitoryInput += (1 - (w + 1) / 2) * dt;
    bufferedInput += input;
  }

  if (sourceIndex === neuron.index) {
    sensoryPotential += input;
    gotSensoryInput = true;
  }

  return { ...neuron, inhibitoryInput, bufferedInput, sensoryPotential, gotSensoryInput };
};

// Transition the neuron into its firing state. No-op if already firing.
export const fire = (neuron: Neuron): Neuron =>
  neuron.firing
    ? neuron
    : {
        ...neuron,
        potential: 1,
        inhibitoryInput: 0,
        firing: true,
        simTimeSinceLastFired: 0,
      };

export interface NeuronStep {
  readonly neuron: Neuron;
  // true if the neuron crossed threshold and fired on this tick. Replaces the
  // prototype version's emit('fire'): the caller decides what to do with it.
  readonly fired: boolean;
}

// Advance the neuron by `dt`. Applies buffered input and decay (unless firing),
// fires on threshold, drains potential over the refractory period, then clears
// the input buffer. Returns the new neuron and whether it fired this tick.
export const update = (neuron: Neuron, dt: number): NeuronStep => {
  let n = neuron;
  let fired = false;

  if (!n.firing) {
    n = {
      ...n,
      potential: n.potential + n.bufferedInput - potentialDecayFn(n.potentialDecayRate) * dt,
    };
  }

  if (n.potential >= 1) {
    n = fire(n);
    fired = true;
  }

  if (n.firing) {
    // drain potential over the refractory period
    const drained = n.potential - (1 / n.refractoryPeriod) * dt;
    n = { ...n, potential: drained, firing: drained > 0 };
  }

  return {
    neuron: {
      ...n,
      // any input not processed by this point is discarded
      bufferedInput: 0,
      simTimeSinceLastFired: n.simTimeSinceLastFired + dt,
      sensoryPotential: n.gotSensoryInput ? n.sensoryPotential : 0,
      potential: clamp(n.potential, 0, 1),
    },
    fired,
  };
};
