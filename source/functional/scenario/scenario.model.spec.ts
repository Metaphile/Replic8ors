import { createScenario, update, applySetting } from "./scenario.model";
import { createReplicator } from "../replicator/replicator.model";
import { addReplicator } from "../world/world.model";
import settings from "../../settings/settings";

describe("scenario model", () => {
  describe("applySetting (live settings)", () => {
    const oneGreen = () => {
      const scenario = createScenario({ minGreens: 0, maxGreens: 1 });
      const added = addReplicator(scenario.world, createReplicator(settings.prey));
      return { ...scenario, world: added.world };
    };

    it("propagates a type field to existing replicators of that type", () => {
      const next = applySetting(oneGreen(), "prey", "metabolism", 0.123);
      expect(next.world.greens[0].metabolism).toBe(0.123);
    });

    it("rewrites every neuron when potentialDecayRate changes", () => {
      const next = applySetting(oneGreen(), "prey", "potentialDecayRate", 0.42);
      expect(next.world.greens[0].potentialDecayRate).toBe(0.42);
      expect(next.world.greens[0].brain.neurons.every((n) => n.potentialDecayRate === 0.42)).toBe(
        true,
      );
    });

    it("does not touch replicators of other types", () => {
      let scenario = createScenario({ minReds: 0, maxReds: 1, minGreens: 0, maxGreens: 1 });
      scenario = {
        ...scenario,
        world: addReplicator(scenario.world, createReplicator(settings.predator)).world,
      };
      scenario = {
        ...scenario,
        world: addReplicator(scenario.world, createReplicator(settings.prey)).world,
      };

      const redMetabolismBefore = scenario.world.reds[0].metabolism;
      const next = applySetting(scenario, "prey", "metabolism", 0.999);

      expect(next.world.greens[0].metabolism).toBe(0.999);
      expect(next.world.reds[0].metabolism).toBe(redMetabolismBefore);
    });

    it("updates scenario-section fields (population caps) directly", () => {
      const next = applySetting(createScenario(), "scenario", "maxGreens", 5);
      expect(next.maxGreens).toBe(5);
    });
  });

  describe("gene-bank energy fix", () => {
    // A replicating creature splits its energy with its child (E -> E/2). The
    // prototype additionally drained the parent when the gene bank cloned its
    // genome (E/2 -> E/4); the functional sim fixes that — banking the genome
    // must not touch the live parent.
    it("a replicating parent keeps half its energy, not a quarter", () => {
      // one prey, room for its child (no culling), no other types
      let scenario = createScenario({
        minReds: 0,
        maxReds: 0,
        minGreens: 1,
        maxGreens: 2,
        minBlues: 0,
        maxBlues: 0,
      });

      // seed a single prey already over the replication threshold and alone in
      // the world (so no collisions perturb its energy this tick)
      const prey = { ...createReplicator(settings.prey), energy: 1.05 };
      const added = addReplicator(scenario.world, prey);
      scenario = { ...scenario, world: added.world };

      const dt = 1 / 30;
      const result = update(scenario, dt);

      const greens = result.scenario.world.greens;
      expect(greens.length).toBe(2); // parent + child: it replicated

      const parent = greens.find((r) => r.id === added.replicator.id)!;
      const child = greens.find((r) => r.id !== added.replicator.id)!;

      // parent: E/2 minus this tick's metabolism (~0.5249), NOT E/4 (~0.2624)
      const expected = 1.05 / 2 - settings.prey.metabolism * dt;
      expect(parent.energy).toBeCloseTo(expected, 4);
      expect(parent.energy).toBeGreaterThan(0.4);

      // child still got its half
      expect(child.energy).toBeCloseTo(1.05 / 2, 4);

      // and the genome was still banked (the fix only changes the parent's
      // energy, not the gene-bank behavior or RNG draws)
      expect(result.scenario.geneBank.prey.pushIndex).toBe(1);
    });
  });
});
