// @ts-nocheck — TODO Phase 3 ratchet: type this file and remove
import ReplicatorView from "./replicator-view";
import Vector2 from "../engine/vector-2";
import { createViewModel, updateViewModel } from "./replicator-view-model";

// energy jump (per snapshot) big enough to be a collision transfer rather than
// gradual metabolism; below the ~0.5 drop of a replication
const ENERGY_EFFECT_THRESHOLD = 0.02;
const REPLICATION_DROP = 0.4;

// World view, snapshot-driven (Phase 6). Instead of holding a live world and
// subscribing to add/die/replicate/collision events, it reconciles successive
// render snapshots by replicator id: a new id creates a view (+ spawn effect),
// a vanished id plays a death effect then removes the view, an existing id
// updates its view model in place. Cosmetic effects are derived from the
// snapshot stream (energy deltas) and the per-tick collision list, not replayed.
export default function WorldView() {
  const self = {};

  self.replicatorViews = [];
  self.collisionEffects = [];
  self.worldRadius = 460;

  const viewsById = new Map();

  const removeView = (view) => {
    viewsById.delete(view.replicator.id);
    const i = self.replicatorViews.indexOf(view);
    if (i > -1) self.replicatorViews.splice(i, 1);
  };

  // Reconcile the view set against a new snapshot. `onAdded(view)` /
  // `onRemoving(view)` let the visualization track/untrack and clear selection.
  // `animate` (default true) plays the per-sample transition effects — spawn,
  // death, dead-reckon drift, energy gain/damage. It's false for a coarse turbo
  // sample (~1Hz, thousands of ticks apart), where those effects are meaningless
  // churn: creatures simply appear/disappear and state jumps to the new sample.
  self.reconcile = (snapshot, { onAdded, onRemoving, animate = true } = {}) => {
    self.worldRadius = snapshot.radius;

    const present = new Set();

    for (const snap of snapshot.replicators) {
      present.add(snap.id);
      const view = viewsById.get(snap.id);

      if (view && !view.dying) {
        const previousEnergy = view.replicator.energy;
        updateViewModel(view.replicator, snap);

        // discrete energy jumps -> gain / damage effects
        if (animate) {
          const delta = snap.energy - previousEnergy;
          if (delta > ENERGY_EFFECT_THRESHOLD) {
            view.doEnergyUpEffect();
          } else if (delta < -ENERGY_EFFECT_THRESHOLD && delta > -REPLICATION_DROP) {
            view.doDamageEffect();
          }
        }
      } else if (!view) {
        const newView = ReplicatorView(createViewModel(snap), { suppressSpawn: !animate });
        viewsById.set(snap.id, newView);
        self.replicatorViews.push(newView);
        if (onAdded) onAdded(newView);
      }
    }

    // ids that disappeared from the snapshot have died
    for (const view of self.replicatorViews) {
      if (!present.has(view.replicator.id) && !view.dying) {
        if (onRemoving) onRemoving(view);

        if (animate) {
          // play the death effect (and let it dead-reckon), then remove the view
          view.dying = true;
          view.replicator.dead = true;
          view.doDeathEffect().then(() => removeView(view));
        } else {
          // coarse turbo sample: drop it immediately (never enters the dying/dead
          // state, so no death animation and no drift)
          removeView(view);
        }
      }
    }
  };

  // Spawn collision particle effects from a per-tick collision list, locating
  // the pair by id in the snapshot. (At turbo the worker caps this list.)
  self.addCollisions = (collisions, snapshot) => {
    if (!collisions || collisions.length === 0) return;

    const positionById = new Map();
    for (const r of snapshot.replicators) positionById.set(r.id, r);

    for (const { a: aId, b: bId } of collisions) {
      const a = positionById.get(aId);
      const b = positionById.get(bId);
      if (!a || !b) continue;

      const offset = Vector2.subtract(b.position, a.position, {});
      const distance = Vector2.getLength(offset);
      if (distance > 0) {
        const overlap = distance - a.radius - b.radius;
        Vector2.setLength(offset, a.radius - overlap / 2);
      }

      self.collisionEffects.push(makeCollisionEffect(Vector2.add(a.position, offset, {})));
    }
  };

  self.update = (dt) => {
    for (const view of self.replicatorViews) {
      view.update(dt, dt);
    }

    for (const effect of self.collisionEffects) {
      effect.update(dt, dt);
    }
  };

  // aka boundary, edge
  self.drawWorldRadius = (ctx) => {
    ctx.savePartial("lineWidth", "strokeStyle");

    ctx.beginPath();
    // draw larger than actual radius for aesthetics
    ctx.arc(0, 0, self.worldRadius * 1.1, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba( 255, 75, 0, 0.45 )"; // HUD marker color
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 10]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restorePartial();
  };

  self.draw = (ctx, camera, mousePos_world, detail = 1) => {
    self.drawWorldRadius(ctx);

    const viewBounds = camera.viewBounds(ctx.canvas);
    const fisheyeZoomThreshold = 1.8;

    for (const view of self.replicatorViews) {
      // don't draw offscreen replicator
      const p = view.replicator.position;
      const flipperLength = 16; // estimate
      const r = view.replicator.radius + flipperLength;
      if (
        p.x + r < viewBounds.topLeft.x ||
        p.x - r > viewBounds.bottomRight.x ||
        p.y + r < viewBounds.topLeft.y ||
        p.y - r > viewBounds.bottomRight.y
      )
        continue;

      const mouseDistance = Vector2.distance(mousePos_world, view.replicator.position);
      if (
        mouseDistance < view.replicator.radius &&
        camera.zoomLevel() >= fisheyeZoomThreshold &&
        !view.replicator.dead &&
        !view.effects.spawn
      ) {
        view.drawWithFisheye(ctx, camera, mousePos_world, detail);
      } else {
        view.draw(ctx, camera, detail);
      }
    }

    for (const effect of self.collisionEffects) {
      effect.draw(ctx);
    }
  };

  self.destroy = () => {
    self.replicatorViews.length = 0;
    self.collisionEffects.length = 0;
    viewsById.clear();
  };

  // a short-lived expanding ring where two replicators collided
  function makeCollisionEffect(position) {
    return {
      duration: 0.333,
      progress: 0,
      position,

      update(dt_real, dt_sim) {
        if (this.progress < 1) {
          this.progress += (1 / this.duration) * Math.min(dt_sim, dt_real);
        }

        if (this.progress >= 1) {
          const i = self.collisionEffects.indexOf(this);
          self.collisionEffects.splice(i, 1);
        }
      },

      draw(ctx) {
        const p = this.position;
        const minRadius = 1;
        const maxRadius = 7;
        const r = minRadius + Math.pow(this.progress, 1 / 4) * (maxRadius - minRadius);

        ctx.savePartial("fillStyle", "globalAlpha");

        ctx.beginPath();
        ctx.arc(p.x, p.y, r - r * 0.7 * (1 - this.progress), 0, Math.PI * 2);
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2, true);
        ctx.fillStyle = "white";
        ctx.globalAlpha = 1 - Math.pow(this.progress, 1 / 2);
        ctx.fill();

        ctx.restorePartial();
      },
    };
  }

  return self;
}
