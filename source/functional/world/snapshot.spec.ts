import { toSnapshot } from "./snapshot";
import { createWorld, addReplicator } from "./world.model";
import { createReplicator } from "../replicator/replicator.model";
import settings from "../../settings/settings";

const buildWorld = () => {
  let world = createWorld();
  world = addReplicator(world, createReplicator(settings.predator)).world;
  world = addReplicator(world, createReplicator(settings.prey)).world;
  world = addReplicator(world, createReplicator(settings.blue)).world;
  return world;
};

describe("snapshot", () => {
  it("includes every replicator with its stable id and type", () => {
    const snap = toSnapshot(buildWorld());

    expect(snap.replicators.map((r) => r.id)).toEqual(["r:0", "g:0", "b:0"]);
    expect(snap.replicators.map((r) => r.type)).toEqual(["predator", "prey", "blue"]);
    expect(snap.counts).toEqual({ reds: 1, greens: 1, blues: 1 });
    expect(snap.radius).toBe(460);
  });

  it("projects the render-relevant fields the views read", () => {
    const snap = toSnapshot(buildWorld());
    const r = snap.replicators[0];

    // body
    expect(r.position).toEqual({ x: expect.any(Number), y: expect.any(Number) });
    expect(typeof r.energy).toBe("number");
    expect(typeof r.radius).toBe("number");
    expect(typeof r.dead).toBe("boolean");

    // brain wiring referenced by index
    expect(r.neurons.length).toBe(16); // 3 segments * 4 + hunger + 3 think
    expect(r.flippers.length).toBe(3);
    expect(r.receptors.length).toBe(3);
    expect(r.hungerNeuronIndex).toBe(12);
    expect(r.thinkNeuronIndices).toEqual([13, 14, 15]);

    // a neuron carries what the neuron view draws
    const n = r.neurons[0];
    expect(n).toMatchObject({
      index: expect.any(Number),
      potential: expect.any(Number),
      firing: expect.any(Boolean),
      sensoryPotential: expect.any(Number),
      inhibitoryInput: expect.any(Number),
      potentialDecayRate: expect.any(Number),
    });
    expect(Array.isArray(n.weights)).toBe(true);

    // flipper/receptor reference neurons by index
    expect(typeof r.flippers[0].neuronIndex).toBe("number");
    expect(r.receptors[0].neuronIndices).toMatchObject({
      blue: expect.any(Number),
      prey: expect.any(Number),
      predator: expect.any(Number),
    });
  });

  it("is serializable across a worker boundary (structured-clone-able)", () => {
    const snap = toSnapshot(buildWorld());
    // structuredClone throws on functions / non-plain data
    expect(() => structuredClone(snap)).not.toThrow();
    // round-trips to identical JSON
    expect(JSON.parse(JSON.stringify(snap))).toEqual(snap);
  });
});
