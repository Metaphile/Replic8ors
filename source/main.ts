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
import { createScenario, update as updateScenario } from "./functional/scenario/scenario.model";
import { toSnapshot } from "./functional/world/snapshot";
import Visualization from "./visualization/visualization";
import GameLoop from "./engine/game-loop";
import ControlBar from "./control-bar/control-bar";

const CURRENT_VERSION = "2.0";

function main() {
  document.getElementById("version-number").innerHTML = CURRENT_VERSION;

  // the functional simulation: a plain-data scenario advanced by pure transition.
  // each sim tick produces a render snapshot the visualization reconciles by id.
  // (Phase 6 runs this on the main thread first; the worker drops in next.)
  let scenario = createScenario();

  const visualization = Visualization();
  document.getElementById("visualization").appendChild(visualization.element);
  // initialize dimensions
  visualization.element.dispatchEvent(new Event("appended"));
  visualization.ingest(toSnapshot(scenario.world), []);

  // drive the simulation. control-bar pauses / scales / steps this loop; each
  // tick advances the scenario and feeds the visualization a fresh snapshot.
  const scenarioLoop = GameLoop(
    (dt) => {
      const result = updateScenario(scenario, dt);
      scenario = result.scenario;
      // skip snapshotting while detached (turbo) — nothing is rendering
      if (visualization.attached) {
        visualization.ingest(toSnapshot(scenario.world), result.collisions);
      }
    },
    () => {},
    { timestep: 1 / 30 },
  );

  // drive the visualization at 60fps, independent of sim speed: advance
  // view-owned animations in real time and draw the most recent snapshot.
  // (GameLoop self-starts via requestAnimationFrame.)
  GameLoop(
    (dt) => visualization.update(dt),
    () => visualization.draw(),
  );

  const controlBar = ControlBar(scenarioLoop, visualization);
  document.getElementById("control-bar").appendChild(controlBar.element);
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
