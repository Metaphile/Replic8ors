// @ts-nocheck — TODO Phase 3 ratchet: type this file and remove
// -------------------------------------------------------------------------- //
//                                                                            //
//                                          eeeee                             //
//         eeeee  eeee eeeee e     e  eeee  8   8  eeeee eeeee  eeeee         //
//         8   8  8    8   8 8     8  8  8  8eee8  8  88 8   8  8   "         //
//         8eee8e 8eee 8eee8 8e    8e 8e   88   88 8   8 8eee8e 8eeee         //
//         88   8 88   88    88    88 88   88   88 8   8 88   8    88         //
//         88   8 88ee 88    88eee 88 88e8 88eee88 8eee8 88   8 8ee88         //
//                                                                            //
//                                                                            //
// -------------------------------------------------------------------------- //

import "./main.scss";
import Visualization from "./visualization/visualization";
import GameLoop from "./engine/game-loop";
import ControlBar from "./control-bar/control-bar";
import type { Command, SimMessage } from "./worker/protocol";

const CURRENT_VERSION = "2.0";

function main() {
  document.getElementById("version-number").innerHTML = CURRENT_VERSION;

  // the functional simulation runs flat-out in a Web Worker and streams render
  // snapshots back; the main thread only renders. This decouples sim cadence
  // from the 60fps render loop — turbo can run as fast as the hardware allows
  // while we keep drawing the most recent snapshot.
  const worker = new Worker(new URL("./worker/sim.worker.ts", import.meta.url), {
    type: "module",
  });

  const visualization = Visualization();
  document.getElementById("visualization").appendChild(visualization.element);
  // initialize dimensions
  visualization.element.dispatchEvent(new Event("appended"));

  worker.onmessage = (event: MessageEvent<SimMessage>) => {
    const msg = event.data;
    if (msg.type === "stats") {
      // lightweight clock heartbeat (~30Hz) — keeps the elapsed display smooth
      // even when full snapshots only arrive ~1Hz at turbo
      simController.elapsed = msg.elapsed;
    } else if (msg.type === "snapshot") {
      simController.elapsed = msg.elapsed;
      // `mode` lets the renderer treat a coarse turbo sample without transition
      // fx; `collisions` (capped, since the last snapshot) drive particle fx,
      // rendered only at play/fast-forward.
      visualization.ingest(msg.snapshot, msg.collisions, msg.mode);
    }
  };

  const post = (command: Command) => worker.postMessage(command);

  // Adapter presenting the control-bar's expected loop interface while posting
  // worker commands. setting `timescale` selects the speed mode; `paused` and
  // `step` map to commands; `elapsed` is fed back from snapshot messages.
  const simController = {
    elapsed: 0,
    _paused: false,
    _timescale: 1,
    get paused() {
      return this._paused;
    },
    set paused(value: boolean) {
      this._paused = value;
      this._sync();
    },
    get timescale() {
      return this._timescale;
    },
    set timescale(value: number) {
      this._timescale = value;
      this._sync();
    },
    step() {
      post({ type: "step" });
    },
    _sync() {
      if (this._paused) post({ type: "pause" });
      else if (this._timescale >= 60) post({ type: "turbo" });
      else if (this._timescale >= 10) post({ type: "fastForward" });
      else post({ type: "play" });
    },
  };

  // drive the visualization at 60fps, independent of sim speed: advance
  // view-owned animations in real time and draw the most recent snapshot.
  // (GameLoop self-starts via requestAnimationFrame.)
  GameLoop(
    (dt) => visualization.update(dt),
    () => visualization.draw(),
  );

  const controlBar = ControlBar(simController, visualization);
  document.getElementById("control-bar").appendChild(controlBar.element);

  // populate the world, then start playing (matches the control-bar's default
  // play state)
  post({ type: "init" });
  post({ type: "play" });
}

// module scripts are deferred, but guard against being run before the DOM in
// case the entry is ever loaded differently.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}

// prevent accidental navigation, except on localhost
window.addEventListener("beforeunload", (event) => {
  if (location.host !== "localhost:8080") {
    event.preventDefault();
    event.returnValue = "";
  }
});
