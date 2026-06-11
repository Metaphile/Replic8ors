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
import World from "./simulation/world";
import Scenario from "./simulation/scenario";
import Visualization from "./visualization/visualization";
import GameLoop from "./engine/game-loop";
import ControlBar from "./control-bar/control-bar";

const CURRENT_VERSION = "2.0";

function main() {
  document.getElementById("version-number").innerHTML = CURRENT_VERSION;

  // create empty world for replicators and other entities to inhabit
  // world updates entities, mediates interactions, emits events
  const world = World();

  // set up and monitor experimental scenario
  // (add replicators, subscribe to events, etc.)
  const scenario = Scenario(world);

  // drive scenario/world

  const scenarioLoop = (() => {
    const update = (dt, t) => scenario.update(dt, t);
    const draw = () => {};
    const opts = {
      timestep: 1 / 30,
    };

    return GameLoop(update, draw, opts);
  })();

  const visualization = Visualization(world);
  document.getElementById("visualization").appendChild(visualization.element);
  // initialize dimensions
  visualization.element.dispatchEvent(new Event("appended"));

  // drive visualization
  const visualizationLoop = GameLoop(
    (dt) => visualization.update(dt, dt * (scenarioLoop.paused ? 0 : scenarioLoop.timescale)),
    () => visualization.draw(0),
  );

  scenarioLoop.on("step", (dt) => {
    visualization.update(dt, dt);
  });

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
