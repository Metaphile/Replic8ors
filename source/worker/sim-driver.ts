// Pure simulation pacing (Phase 6 loop redesign).
//
// Replaces the prototype's rAF-coupled GameLoop (timescale / maxPendingUpdates /
// turbo-detach) for the sim's role. The sim runs in a Web Worker; this module is
// the pure decision layer the worker drives: given the wall-clock time since the
// last call and the current mode, it returns how many sim ticks to run and
// whether to emit a snapshot. No timers, no I/O — trivially testable.
//
// Speed model (kept from today's controls):
//   paused      — 0 ticks.
//   play        — realtime: advance sim-time toward wall-clock x1 via a
//                 fixed-timestep accumulator; snapshot every call (~60Hz).
//   fastForward — same, x10.
//   turbo       — flat out: run a fixed batch each call (the worker re-invokes
//                 in a tight, message-draining loop) and snapshot ~1Hz, so the
//                 expensive cross-thread serialization barely steals from the sim.
//
// The render loop on the main thread is always 60fps regardless of this; the
// snapshot *rate* — not the frame rate — is the lever that protects the sim.

export type SimMode = "paused" | "play" | "fastForward" | "turbo";

// scenario timestep (matches the characterization/bench dt)
export const SIM_TIMESTEP = 1 / 30;

const TIMESCALE: Record<"play" | "fastForward", number> = { play: 1, fastForward: 10 };

// clamp the realtime/ff accumulator so a long stall (tab backgrounded, GC) can't
// queue a spiral-of-death burst of catch-up ticks
const MAX_PENDING_TICKS = 30;
const MAX_PENDING = SIM_TIMESTEP * MAX_PENDING_TICKS;

// ticks per turbo loop iteration before yielding to drain the worker's message
// queue (so pause/mode commands stay responsive at full speed)
export const TURBO_BATCH = 120;

// seconds between turbo snapshots (~1Hz)
export const TURBO_SNAPSHOT_INTERVAL = 1.0;

export interface DriverState {
  readonly mode: SimMode;
  // unspent sim-time carried between realtime/ff calls
  readonly accumulator: number;
  // wall-time accumulated toward the next turbo snapshot
  readonly sinceSnapshot: number;
}

export const createDriver = (mode: SimMode = "paused"): DriverState => ({
  mode,
  accumulator: 0,
  sinceSnapshot: 0,
});

// Switch modes, resetting the pacing accumulators (a fresh cadence each time).
export const setMode = (state: DriverState, mode: SimMode): DriverState => ({
  ...state,
  mode,
  accumulator: 0,
  sinceSnapshot: 0,
});

export interface DriverStep {
  readonly state: DriverState;
  // sim ticks to run before the (optional) snapshot
  readonly ticks: number;
  // emit a snapshot after running the ticks?
  readonly snapshot: boolean;
}

// Advance pacing by `dtWall` wall-clock seconds since the last call.
export const advance = (state: DriverState, dtWall: number): DriverStep => {
  switch (state.mode) {
    case "paused":
      return { state, ticks: 0, snapshot: false };

    case "play":
    case "fastForward": {
      const accumulator = Math.min(state.accumulator + dtWall * TIMESCALE[state.mode], MAX_PENDING);
      const ticks = Math.floor(accumulator / SIM_TIMESTEP);
      return {
        state: { ...state, accumulator: accumulator - ticks * SIM_TIMESTEP },
        ticks,
        // refresh the depicted state every frame at realtime/ff
        snapshot: true,
      };
    }

    case "turbo": {
      const sinceSnapshot = state.sinceSnapshot + dtWall;
      const snapshot = sinceSnapshot >= TURBO_SNAPSHOT_INTERVAL;
      return {
        state: { ...state, sinceSnapshot: snapshot ? 0 : sinceSnapshot },
        ticks: TURBO_BATCH,
        snapshot,
      };
    }
  }
};

// One single-step (pause then step): exactly one tick, then a snapshot.
export const stepOnce = (state: DriverState): DriverStep => ({
  state: { ...state, mode: "paused", accumulator: 0, sinceSnapshot: 0 },
  ticks: 1,
  snapshot: true,
});
