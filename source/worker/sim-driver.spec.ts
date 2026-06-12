import {
  SIM_TIMESTEP,
  TURBO_BATCH,
  TURBO_SNAPSHOT_INTERVAL,
  createDriver,
  setMode,
  advance,
  stepOnce,
} from "./sim-driver";

describe("sim pacing driver", () => {
  it("paused runs no ticks and no snapshot", () => {
    const step = advance(createDriver("paused"), 1.0);
    expect(step.ticks).toBe(0);
    expect(step.snapshot).toBe(false);
  });

  it("play advances at realtime (one timestep of wall-clock -> one tick)", () => {
    const step = advance(createDriver("play"), SIM_TIMESTEP);
    expect(step.ticks).toBe(1);
    expect(step.snapshot).toBe(true);
  });

  it("play carries the sub-timestep remainder across calls", () => {
    let state = createDriver("play");

    // 1.5 timesteps of wall-clock -> 1 tick now, 0.5 carried
    let step = advance(state, SIM_TIMESTEP * 1.5);
    state = step.state;
    expect(step.ticks).toBe(1);

    // another 0.5 timestep -> the carried 0.5 completes a second tick
    step = advance(state, SIM_TIMESTEP * 0.5);
    expect(step.ticks).toBe(1);
  });

  it("fastForward runs ~10x the ticks of play for the same wall-clock", () => {
    const dt = SIM_TIMESTEP * 2;
    const play = advance(createDriver("play"), dt);
    const ff = advance(createDriver("fastForward"), dt);
    expect(play.ticks).toBe(2);
    expect(ff.ticks).toBe(20);
  });

  it("clamps the accumulator to avoid a spiral-of-death burst", () => {
    // a 10-second stall must not queue 300 catch-up ticks
    const step = advance(createDriver("play"), 10);
    expect(step.ticks).toBeLessThanOrEqual(30);
  });

  it("turbo runs a fixed batch flat-out every call", () => {
    const step = advance(createDriver("turbo"), 0.001);
    expect(step.ticks).toBe(TURBO_BATCH);
  });

  it("turbo snapshots only ~once per second", () => {
    let state = createDriver("turbo");

    // many fast iterations under 1s -> batches run, but no snapshot yet
    let sawSnapshot = false;
    for (let i = 0; i < 50; i++) {
      const step = advance(state, 0.01); // 0.5s total
      state = step.state;
      sawSnapshot = sawSnapshot || step.snapshot;
    }
    expect(sawSnapshot).toBe(false);

    // crossing the 1s mark emits a snapshot and resets the cadence
    const step = advance(state, TURBO_SNAPSHOT_INTERVAL);
    expect(step.snapshot).toBe(true);
    expect(step.state.sinceSnapshot).toBe(0);
  });

  it("setMode resets pacing accumulators", () => {
    let state = createDriver("play");
    state = advance(state, SIM_TIMESTEP * 0.5).state; // leave a remainder
    state = setMode(state, "turbo");
    expect(state.accumulator).toBe(0);
    expect(state.sinceSnapshot).toBe(0);
    expect(state.mode).toBe("turbo");
  });

  it("stepOnce runs exactly one tick and pauses", () => {
    const step = stepOnce(createDriver("play"));
    expect(step.ticks).toBe(1);
    expect(step.snapshot).toBe(true);
    expect(step.state.mode).toBe("paused");
  });
});
