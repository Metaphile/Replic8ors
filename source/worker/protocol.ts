// Message protocol between the main thread and the simulation worker (Phase 6).
//
// Commands flow main -> worker; data (snapshots) flow worker -> main. Keeping the
// shapes here lets both sides share one typed contract.

import { WorldSnapshot } from "../functional/world/snapshot";
import { ScenarioOpts } from "../functional/scenario/scenario.model";

// --- main -> worker ---------------------------------------------------------

export interface InitCommand {
  readonly type: "init";
  readonly pops?: ScenarioOpts;
}

export interface ModeCommand {
  // pause | play | fastForward | turbo | step | reset
  readonly type: "pause" | "play" | "fastForward" | "turbo" | "step" | "reset";
}

export interface SettingCommand {
  readonly type: "setting";
  readonly section: string;
  readonly key: string;
  readonly value: number | string;
}

export type Command = InitCommand | ModeCommand | SettingCommand;

// --- worker -> main ---------------------------------------------------------

export interface SnapshotMessage {
  readonly type: "snapshot";
  readonly snapshot: WorldSnapshot;
  // total elapsed simulation time (seconds)
  readonly elapsed: number;
}

export type SimMessage = SnapshotMessage;
