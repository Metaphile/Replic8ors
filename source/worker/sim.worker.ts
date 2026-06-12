// Simulation Web Worker (Phase 6).
//
// Runs the functional sim off the main thread and streams render snapshots back.
// It owns the scenario, the pacing driver (see sim-driver.ts) and a settings
// copy; the main thread owns the canonical settings/UI and sends commands. This
// decouples sim cadence from render cadence: the worker can run flat out (turbo)
// while the main thread renders the most recent snapshot at a steady 60fps.
//
// NOTE: this is the sim side of the boundary. The main thread still needs the
// snapshot-consuming renderer (reconcile-by-id) wired up before it can be
// verified in-browser — that refactor is the remaining Phase-6 work.

import settings from "../settings/settings";
import {
  createScenario,
  update,
  applySetting,
  Scenario,
  ScenarioOpts,
} from "../functional/scenario/scenario.model";
import { toSnapshot } from "../functional/world/snapshot";
import { Collision } from "../functional/world/world.model";
import { SIM_TIMESTEP, DriverState, createDriver, setMode, advance, stepOnce } from "./sim-driver";
import { Command, SimMessage } from "./protocol";

// minimal typed view of the dedicated-worker global (avoids pulling in the
// WebWorker lib just for these two members)
const ctx = self as unknown as {
  postMessage(message: SimMessage): void;
  onmessage: ((event: { data: Command }) => void) | null;
};

let pops: ScenarioOpts = {};
let scenario: Scenario = createScenario(pops);
let driver: DriverState = createDriver("paused");
let elapsed = 0;

let timer: ReturnType<typeof setTimeout> | null = null;
let lastTime = performance.now();

// clock heartbeat cadence — decoupled from the (expensive, ~1Hz at turbo)
// snapshot so the elapsed-time display stays smooth
const STATS_INTERVAL_MS = 1000 / 30;
let lastStats = performance.now();

// collisions accumulated since the last snapshot (capped); the renderer turns
// these into particle effects (and ignores them at turbo)
const MAX_PENDING_COLLISIONS = 64;
let pendingCollisions: Collision[] = [];

const post = (): void => {
  ctx.postMessage({
    type: "snapshot",
    snapshot: toSnapshot(scenario.world),
    elapsed,
    mode: driver.mode,
    collisions: pendingCollisions,
  });
  pendingCollisions = [];
};

const postStats = (): void => {
  ctx.postMessage({ type: "stats", elapsed });
};

const runTicks = (ticks: number): void => {
  for (let i = 0; i < ticks; i++) {
    const result = update(scenario, SIM_TIMESTEP);
    scenario = result.scenario;
    elapsed += SIM_TIMESTEP;
    for (const c of result.collisions) {
      if (pendingCollisions.length >= MAX_PENDING_COLLISIONS) break;
      pendingCollisions.push(c);
    }
  }
};

// one loop iteration: advance pacing by real elapsed wall-time, run the sim,
// snapshot if due, then reschedule per the current mode (paused stops the loop)
const loop = (): void => {
  const now = performance.now();
  const dtWall = (now - lastTime) / 1000;
  lastTime = now;

  const step = advance(driver, dtWall);
  driver = step.state;
  runTicks(step.ticks);

  // smooth clock: heartbeat the elapsed time at ~30Hz (cheap), independent of
  // the full snapshot (which a turbo sample only posts ~1Hz)
  if (now - lastStats >= STATS_INTERVAL_MS) {
    postStats();
    lastStats = now;
  }
  if (step.snapshot) post();

  schedule();
};

const schedule = (): void => {
  if (driver.mode === "paused") {
    timer = null;
    return;
  }
  // turbo yields with a 0ms timeout so the message queue (pause/mode commands)
  // drains between batches; realtime/ff tick at ~60Hz
  timer = setTimeout(loop, driver.mode === "turbo" ? 0 : 16);
};

const startMode = (mode: DriverState["mode"]): void => {
  driver = setMode(driver, mode);
  lastTime = performance.now(); // avoid a huge catch-up dtWall after a pause
  if (timer === null) schedule();
};

const reset = (): void => {
  scenario = createScenario(pops);
  elapsed = 0;
  post();
};

// the worker has its own settings module instance; mirror main's canonical copy
const workerSettings = settings as unknown as Record<string, Record<string, number | string>>;

ctx.onmessage = (event) => {
  const msg = event.data;
  switch (msg.type) {
    case "init":
      pops = msg.pops ?? {};
      // sync main's settings (incl. localStorage) into the worker's copy before
      // populating, so creatures are built with the user's saved values
      if (msg.settings) {
        for (const section of Object.keys(msg.settings)) {
          Object.assign(workerSettings[section], msg.settings[section]);
        }
      }
      reset();
      break;
    case "pause":
      driver = setMode(driver, "paused");
      break;
    case "play":
      startMode("play");
      break;
    case "fastForward":
      startMode("fastForward");
      break;
    case "turbo":
      startMode("turbo");
      break;
    case "step": {
      const step = stepOnce(driver);
      driver = step.state;
      runTicks(step.ticks);
      post();
      break;
    }
    case "reset":
      reset();
      break;
    case "setting":
      // canonical settings live on the main thread. Apply the delta to the
      // worker's copy (so FUTURE replicators pick it up) and live-propagate it to
      // the EXISTING population + gene bank via the scenario.
      workerSettings[msg.section][msg.key] = msg.value;
      scenario = applySetting(scenario, msg.section, msg.key, msg.value);
      break;
  }
};
