// Pure-functional flipper (flagellum) model.
//
// Functional port of source/simulation/flipper.ts. The prototype mutates
// `flipProgress` and emits a 'flipping' event carrying the propulsion force.
// Here a Flipper is immutable plain data; `update` returns the propulsion force
// as an explicit value (or null while idle) instead of emitting it, so the
// caller — the replicator — decides how to apply it. A `neuronIndex` records
// which motor neuron drives this flipper (the prototype stashed a live neuron
// reference on the flipper; an index keeps the state serializable).
//
// The prototype's 'flipping' event also carried a torque arg, but the
// replicator's handler had its torque application commented out, so it's dropped.

import { Vec2 } from "../physics/physics.model";

export interface Flipper {
  readonly angle: number;
  // 0 = mid-flip (full effort), 1 = idle. Starts idle.
  readonly flipProgress: number;
  readonly strength: number;
  readonly flipTime: number;
  // index of the motor neuron whose firing triggers this flipper
  readonly neuronIndex: number;
}

export interface FlipperOpts {
  strength?: number;
  flipTime?: number;
  neuronIndex?: number;
}

const defaults = {
  // overridden in scenario
  strength: 4500,
  flipTime: 0.8,
};

export const createFlipper = (angle: number, opts: FlipperOpts = {}): Flipper => ({
  angle,
  flipProgress: 1,
  strength: opts.strength ?? defaults.strength,
  flipTime: opts.flipTime ?? defaults.flipTime,
  neuronIndex: opts.neuronIndex ?? -1,
});

// Begin a flip (resets progress to 0). Returns a new flipper.
export const flip = (flipper: Flipper): Flipper => ({ ...flipper, flipProgress: 0 });

export interface FlipperStep {
  readonly flipper: Flipper;
  // propulsion force for this tick, or null while idle (flipProgress >= 1)
  readonly force: Vec2 | null;
}

// Advance the flip by `dt`. While flipping, returns the propulsion force (effort
// trails off quadratically as the flip completes) and advances progress.
// Returns the unchanged flipper and null force once idle.
export const update = (flipper: Flipper, dt: number): FlipperStep => {
  if (flipper.flipProgress >= 1) return { flipper, force: null };

  // effort trails off as the flip completes
  const effort = flipper.strength * Math.pow(1 - flipper.flipProgress, 2);
  const direction = flipper.angle + Math.PI;

  const force: Vec2 = {
    x: Math.cos(direction) * effort,
    y: Math.sin(direction) * effort,
  };

  return {
    flipper: { ...flipper, flipProgress: flipper.flipProgress + dt / flipper.flipTime },
    force,
  };
};
