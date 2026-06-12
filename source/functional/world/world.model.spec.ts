import { createWorld, addReplicator, tick } from "./world.model";
import { createReplicator, Replicator } from "../replicator/replicator.model";
import settings from "../../settings/settings";

const length = (v: { x: number; y: number }) => Math.sqrt(v.x * v.x + v.y * v.y);

const Prey = (fields: Record<string, unknown> = {}, position = { x: 0, y: 0 }): Replicator => ({
  ...createReplicator({ ...settings.prey, ...fields }),
  position,
});

describe("world model", () => {
  it("adds replicators (stamped with an id)", () => {
    const prey = Prey();
    const { world, replicator } = addReplicator(createWorld(), prey);

    expect(world.greens).toContain(replicator);
    expect(replicator.id).toBe("g:0");
  });

  it("removes replicators that die during a tick", () => {
    const prey = { ...Prey(), energy: 0 }; // will die this tick
    const { world } = addReplicator(createWorld(), prey);

    const result = tick(world, 1 / 60);

    expect(result.world.greens.length).toBe(0);
    expect(result.deaths.length).toBe(1);
  });

  it("moves partially overlapping replicators apart", () => {
    const opts = { radius: 64, energy: 0.5, metabolism: 0, mass: 10, drag: 1 };

    let world = createWorld();
    const lefty = addReplicator(world, Prey(opts, { x: -10, y: 0 }));
    world = lefty.world;
    const righty = addReplicator(world, Prey(opts, { x: 10, y: 0 }));
    world = righty.world;

    const result = tick(world, 1 / 60);

    const out = (id: string) => result.world.greens.find((r) => r.id === id)!;
    expect(out(lefty.replicator.id).position.x).toBeLessThan(-10);
    expect(out(righty.replicator.id).position.x).toBeGreaterThan(10);
  });

  it("moves completely overlapping replicators apart", () => {
    const opts = { radius: 64, energy: 0.5, metabolism: 0, mass: 10, drag: 1 };

    let world = createWorld();
    const a = addReplicator(world, Prey(opts, { x: 0, y: 0 }));
    world = a.world;
    const b = addReplicator(world, Prey(opts, { x: 0, y: 0 }));
    world = b.world;

    // fixed rng so the coincident-repel direction is deterministic
    const result = tick(world, 1 / 60, () => 0);

    for (const r of result.world.greens) {
      expect(length(r.position)).toBeGreaterThan(0);
    }
  });

  it("reports replicator deaths as effects", () => {
    const prey = { ...Prey(), energy: 0 };
    const { world, replicator } = addReplicator(createWorld(), prey);

    const result = tick(world, 1 / 60);

    expect(result.deaths).toContain(replicator.id);
  });
});
