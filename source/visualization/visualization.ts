// @ts-nocheck — TODO Phase 3 ratchet: type this file and remove
import WorldView from "./world-view";
import Camera from "../engine/camera";
import CameraOperator from "./camera-operator";
import Hud from "./hud";
import HudMarker from "./hud-marker";
import Vector2 from "../engine/vector-2";
import { CtxPartialStateStack, pointIsInCircle } from "../helpers";

const EMPTY_SNAPSHOT = {
  radius: 460,
  replicators: [],
  counts: { reds: 0, greens: 0, blues: 0 },
};

// Snapshot-driven visualization (Phase 6). It no longer holds a live world or
// subscribes to world events; instead `ingest(snapshot, collisions)` feeds it a
// render snapshot each sim tick, which the world view reconciles by id. The
// render loop (update/draw) runs independently at 60fps over the most recent
// snapshot, with view-owned animations advancing in real time.
export default function Visualization() {
  const self = {};

  const container = document.createElement("div");
  container.className = "visualization-container";

  const { canvas, sizeToParent } = makeCanvas();
  const ctx = canvas.getContext("2d");
  CtxPartialStateStack(ctx);

  container.appendChild(canvas);

  container.addEventListener("appended", () => sizeToParent());

  self.element = container;
  self.attached = false;
  self.latestSnapshot = EMPTY_SNAPSHOT;

  const camera = Camera();
  camera.pan(Vector2.invert(camera.viewCenter(canvas)));
  camera.zoom(-0.2, camera.viewCenter(canvas));

  const dummyCameraOp = {
    smoothPan() {},
    smoothZoom() {},
    smoothZoomTo() {},
    follow() {},
    unfollow() {},
    update() {},
    offset: { x: 0, y: 0 },
  };
  let cameraOp = dummyCameraOp;

  const dummyWorldView = {
    replicatorViews: [],
    reconcile() {},
    addCollisions() {},
    update() {},
    draw() {},
    destroy() {},
  };
  let worldView = dummyWorldView;

  const dummyHud = {
    track() {},
    untrack() {},
    select() {},
    deselect() {},
    update() {},
    draw() {},
  };
  let hud = dummyHud;

  // --- selection (tracks a replicator view model, stable across snapshots) ---

  let selection = null;

  function selectReplicatorByView(replicatorView) {
    replicatorView.selected = true;
    cameraOp.follow(replicatorView.replicator);
    hud.select(replicatorView.replicator);
    selection = replicatorView.replicator;
  }

  function deselectReplicatorByView(replicatorView) {
    replicatorView.selected = false;
    replicatorView.neuronViews.forEach((v) => (v.selected = false));

    if (selection === replicatorView.replicator) {
      cameraOp.unfollow();
      hud.deselect();
      selection = null;
    }
  }

  const trackReplicator = (replicator) => hud.track(replicator, HudMarker());

  // reconcile callbacks: a new view is tracked; a vanished view is deselected
  // and untracked (replacing the old replicator-added / replicator-died events)
  const onViewAdded = (view) => trackReplicator(view.replicator);
  const onViewRemoving = (view) => {
    deselectReplicatorByView(view); // no-op unless it was selected
    hud.untrack(view.replicator);
  };

  const reconcileOpts = { onAdded: onViewAdded, onRemoving: onViewRemoving };

  // Feed a new render snapshot (+ this tick's collisions) to the view.
  self.ingest = (snapshot, collisions) => {
    self.latestSnapshot = snapshot;
    if (self.attached) {
      worldView.reconcile(snapshot, reconcileOpts);
      worldView.addCollisions(collisions, snapshot);
    }
  };

  // panning
  {
    document.body.addEventListener("touchmove", (event) => event.preventDefault());

    let isDragging = false;
    let dragLast_screen = null;
    const dragThreshold = 4;

    const onPointerDown = (offsetX, offsetY) => {
      isDragging = false;
      dragLast_screen = { x: offsetX, y: offsetY };
    };

    const onPointerMove = (offsetX, offsetY) => {
      if (!isDragging && dragLast_screen) {
        const mousePos_screen = { x: offsetX, y: offsetY };
        const distance = Vector2.distance(mousePos_screen, dragLast_screen);
        if (distance > dragThreshold) isDragging = true;
      }

      if (isDragging) {
        const dragLast_world = camera.toWorld(dragLast_screen);
        const dragNow_screen = { x: offsetX, y: offsetY };
        const dragNow_world = camera.toWorld(dragNow_screen);
        const dragDelta_world = Vector2.subtract(dragLast_world, dragNow_world, {});
        cameraOp.smoothPan(dragDelta_world);
        Vector2.set(dragLast_screen, dragNow_screen);
      }
    };

    const touchOffset = (touch) => ({
      x: touch.pageX - touch.target.offsetLeft,
      y: touch.pageY - touch.target.offsetTop,
    });

    canvas.addEventListener("mousedown", (event) => onPointerDown(event.offsetX, event.offsetY));
    canvas.addEventListener("touchstart", (event) => {
      const touch = event.touches[0];
      if (!touch) return;
      const { x, y } = touchOffset(touch);
      onPointerDown(x, y);
    });
    canvas.addEventListener("mousemove", (event) => onPointerMove(event.offsetX, event.offsetY));
    canvas.addEventListener("touchmove", (event) => {
      const touch = event.touches[0];
      if (!touch) return;
      const { x, y } = touchOffset(touch);
      onPointerMove(x, y);
    });

    const onPointerUp = () => {
      dragLast_screen = null;
    };
    canvas.addEventListener("touchend", onPointerUp);
    canvas.addEventListener("mouseup", onPointerUp);

    canvas.addEventListener("click", (event) => {
      if (isDragging) {
        isDragging = false;
        event.stopImmediatePropagation();
      }
    });

    canvas.addEventListener("mouseout", () => {
      isDragging = false;
      dragLast_screen = null;
    });
  }

  // zooming
  canvas.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const { deltaMode, deltaY, offsetX, offsetY } = event;
      const deltaIsInPixels = deltaMode === 0;
      const scrollFactor = deltaIsInPixels ? -800 : -14;
      cameraOp.smoothZoom(deltaY / scrollFactor, camera.toWorld(offsetX, offsetY));
    },
    { passive: false },
  );

  // selection
  canvas.addEventListener("click", (event) => {
    const clickPos_world = camera.toWorld(event.offsetX, event.offsetY);

    // reverse z-order (topmost first)
    const replicatorViews = worldView.replicatorViews.slice().reverse();

    const clickedReplicatorView = replicatorViews
      // don't allow selecting replicators that are dead or spawning
      .filter((v) => !v.replicator.dead && !v.effects.spawn)
      .find((v) => pointIsInCircle(clickPos_world, v.replicator));

    if (!clickedReplicatorView) {
      replicatorViews.forEach((v) => deselectReplicatorByView(v));
      return;
    }

    if (selection && selection !== clickedReplicatorView.replicator) {
      // select new before deselecting old so the focus ring animates
      const previouslySelectedReplicatorView = replicatorViews.find(
        (v) => v.replicator === selection,
      );
      selectReplicatorByView(clickedReplicatorView);
      if (previouslySelectedReplicatorView) {
        deselectReplicatorByView(previouslySelectedReplicatorView);
      }
    } else if (!selection) {
      selectReplicatorByView(clickedReplicatorView);
    }

    const clickedNeuronView = clickedReplicatorView.neuronViews
      .slice()
      .reverse()
      .find((v) => pointIsInCircle(clickPos_world, v));

    if (!clickedNeuronView) {
      clickedReplicatorView.neuronViews.forEach((v) => (v.selected = false));
      return;
    }

    // enable neuron selection at or above beginFisheyeLod
    if (camera.zoomLevel() >= 2.9) {
      clickedNeuronView.selected = !clickedNeuronView.selected;
    }
  });

  canvas.addEventListener("dblclick", (event) => {
    if (selection) {
      const clickPos_world = camera.toWorld(event.offsetX, event.offsetY);
      const inspectZoomLevel = 7.7;
      if (camera.zoomLevel() < inspectZoomLevel) {
        cameraOp.smoothZoomTo(inspectZoomLevel, clickPos_world);
      }
      cameraOp.follow(selection);
      event.preventDefault();
    } else {
      const clickPos_world = camera.toWorld(event.offsetX, event.offsetY);
      cameraOp.smoothZoom(-1, clickPos_world);
    }
  });

  self.attach = () => {
    worldView = WorldView();
    cameraOp = CameraOperator(camera, canvas);
    Object.assign(cameraOp.offset, dummyCameraOp.offset);
    hud = Hud(camera);

    self.attached = true;
    self.element.classList.remove("detached");

    // populate views from the most recent snapshot
    worldView.reconcile(self.latestSnapshot, reconcileOpts);
  };

  self.detach = () => {
    worldView.destroy();
    worldView = dummyWorldView;

    cameraOp.unfollow();
    Object.assign(dummyCameraOp.offset, cameraOp.offset);
    cameraOp = dummyCameraOp;

    hud = dummyHud;
    selection = null;

    self.attached = false;
    self.element.classList.add("detached");
  };

  self.update = (dt_real) => {
    cameraOp.update(dt_real, dt_real);
    worldView.update(dt_real);
    hud.update(dt_real);
  };

  self.draw = () => {
    canvas.width = canvas.width;

    camera.applyView(ctx);
    worldView.draw(ctx, camera, camera.toWorld(mousePos_screen), camera.zoomLevel());

    // HUD expects untransformed canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    hud.draw(ctx);
  };

  // fisheye
  const mousePos_screen = { x: Number.MAX_SAFE_INTEGER, y: Number.MAX_SAFE_INTEGER };

  canvas.addEventListener("mousemove", (event) => {
    mousePos_screen.x = event.offsetX;
    mousePos_screen.y = event.offsetY;
  });

  canvas.addEventListener("mouseout", () => {
    mousePos_screen.x = Number.MAX_SAFE_INTEGER;
    mousePos_screen.y = Number.MAX_SAFE_INTEGER;
  });

  self.attach();

  return self;
}

function makeCanvas() {
  const canvas = document.createElement("canvas");
  canvas.className = "world";

  function sizeToParent() {
    const parent = canvas.parentElement;
    if (!parent) return;

    canvas.width = parent.clientWidth;
    const controlBarHeight = 43;
    canvas.height = parent.clientHeight - controlBarHeight;
  }

  window.addEventListener("resize", sizeToParent);

  return { canvas, sizeToParent };
}
