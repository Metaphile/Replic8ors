import {
  Replicator,
  createReplicator,
  update,
  replicate,
  sense,
  getOwnWeights,
  syncSymmetricWeights,
} from "./replicator.model";
import { Network, createNetwork, addNeuron } from "../network/network.model";
import { Neuron, createNeuron } from "../neuron/neuron.model";

const precision = 9;

// build a network of `n` neurons (weights padded to length n, all 0)
const networkOf = (n: number): Network => {
  let net = createNetwork();
  for (let i = 0; i < n; i++) net = addNeuron(net, createNeuron());
  return net;
};

// return a new network with each neuron's weights replaced
const withWeights = (net: Network, weightsByNeuron: number[][]): Network => ({
  neurons: net.neurons.map((neuron, i) =>
    weightsByNeuron[i] ? { ...neuron, weights: weightsByNeuron[i] } : neuron,
  ),
});

// give every weight a unique ascending value, neuron-major
const withUniqueWeights = (replicator: Replicator): Replicator => {
  let count = 0;
  const neurons: Neuron[] = replicator.brain.neurons.map((neuron) => ({
    ...neuron,
    weights: neuron.weights.map(() => count++),
  }));
  return { ...replicator, brain: { neurons } };
};

describe("replicator model", () => {
  describe("replication", () => {
    it("produces an offspring when its stomach is full", () => {
      const replicator = { ...createReplicator(), energy: 1 };
      const step = update(replicator, 0);
      expect(step.child).not.toBeNull();
    });

    it("does not replicate when not full", () => {
      const step = update(createReplicator(), 1 / 60);
      expect(step.child).toBeNull();
    });
  });

  describe("ancestor weights", () => {
    it("getOwnWeights() snapshots every neuron's weights", () => {
      // fewest possible neurons: 1 segment (4) + hunger (1) = 5 neurons
      const replicator = withUniqueWeights(
        createReplicator({ numBodySegments: 1, numInternalNeurons: 0 }),
      );

      expect(getOwnWeights(replicator)).toEqual([
        { weights: [0, 1, 2, 3, 4] },
        { weights: [5, 6, 7, 8, 9] },
        { weights: [10, 11, 12, 13, 14] },
        { weights: [15, 16, 17, 18, 19] },
        { weights: [20, 21, 22, 23, 24] },
      ]);
    });

    it("ancestor weights default to own weights", () => {
      const gen1 = createReplicator();
      expect(getOwnWeights(gen1)).toEqual(gen1.ancestorWeights);
    });

    it("nth gen references 1st gen", () => {
      let gen1 = withUniqueWeights(createReplicator());
      gen1 = { ...gen1, ancestorWeights: getOwnWeights(gen1) };

      const gen2 = replicate(gen1).child;
      const gen3 = replicate(gen2).child;

      expect(gen2.ancestorWeights).toEqual(gen1.ancestorWeights);
      expect(gen3.ancestorWeights).toEqual(gen1.ancestorWeights);
    });
  });

  describe("radial symmetry", () => {
    it("maintains symmetric neuron weights", () => {
      const numSegments = 3;
      const neuronsPerSegment = 2;
      const net = networkOf(numSegments * neuronsPerSegment);

      // weights for segment 0
      const weights_s0n0 = [0.0, 0.01, 0.02, 0.03, 0.04, 0.05];
      const weights_s0n1 = [0.1, 0.11, 0.12, 0.13, 0.14, 0.15];

      // expected weights for segment 1
      const weights_s1n2 = [0.04, 0.05, 0.0, 0.01, 0.02, 0.03];
      const weights_s1n3 = [0.14, 0.15, 0.1, 0.11, 0.12, 0.13];

      const synced = syncSymmetricWeights(
        withWeights(net, [weights_s0n0, weights_s0n1]),
        numSegments,
        neuronsPerSegment,
      );

      expect(synced.neurons[2].weights).toEqual(weights_s1n2);
      expect(synced.neurons[3].weights).toEqual(weights_s1n3);
    });

    it("syncs free neuron weights differently", () => {
      const numSegments = 3;
      const numNeuronsPerSegment = 1;
      const numNeurons = numSegments * numNeuronsPerSegment;
      const net = networkOf(numNeurons + 1);

      // free neuron is the last one (index 3)
      const freeWeights = [0.1, 0, 0, 0.2];

      const synced = syncSymmetricWeights(
        withWeights(net, [[], [], [], freeWeights]),
        numSegments,
        numNeuronsPerSegment,
      );

      expect(synced.neurons[3].weights).toEqual([0.1, 0.1, 0.1, 0.2]);
    });

    it("maintains symmetric neuron decay rates", () => {
      const numSegments = 3;
      const neuronsPerSegment = 2;
      const net = networkOf(numSegments * neuronsPerSegment);

      const neurons = net.neurons.map((neuron, i) => {
        if (i === 0) return { ...neuron, potentialDecayRate: 0.2 };
        if (i === 1) return { ...neuron, potentialDecayRate: -0.1 };
        return neuron;
      });

      const synced = syncSymmetricWeights({ neurons }, numSegments, neuronsPerSegment);

      // second segment
      expect(synced.neurons[2].potentialDecayRate).toEqual(0.2);
      expect(synced.neurons[3].potentialDecayRate).toEqual(-0.1);
      // third segment
      expect(synced.neurons[4].potentialDecayRate).toEqual(0.2);
      expect(synced.neurons[5].potentialDecayRate).toEqual(-0.1);
    });

    it("passes neuron decay rate to offspring", () => {
      const parent = createReplicator({ numBodySegments: 3 });
      const modified: Replicator = {
        ...parent,
        brain: {
          neurons: parent.brain.neurons.map((n, i) =>
            i === 0 ? { ...n, potentialDecayRate: 0.1 } : n,
          ),
        },
      };

      const child = replicate(modified, 0).child;

      expect(child.brain.neurons[0].potentialDecayRate).toBe(0.1);
    });
  });

  describe("sensing", () => {
    it("registers sensory input on the matching receptor neurons", () => {
      const replicator = createReplicator({ type: "prey" });
      const stimulus = { position: { x: 100, y: 0 }, radius: 10, type: "prey" };

      const sensed = sense(replicator, stimulus, 1 / 60);

      const preyIndices = sensed.receptors.map((r) => r.neuronIndices.prey);
      for (const i of preyIndices) {
        expect(sensed.brain.neurons[i].gotSensoryInput).toBe(true);
      }
    });

    it("throws on an unknown stimulus type", () => {
      const replicator = createReplicator({ type: "prey" });
      const stimulus = { position: { x: 0, y: 0 }, radius: 1, type: "mystery" };
      expect(() => sense(replicator, stimulus, 1 / 60)).toThrow();
    });

    it("does not mutate its input (purity)", () => {
      const replicator = createReplicator({ type: "prey" });
      const stimulus = { position: { x: 50, y: 0 }, radius: 10, type: "prey" };
      const before = JSON.stringify(replicator);
      sense(replicator, stimulus, 1 / 60);
      expect(JSON.stringify(replicator)).toBe(before);
    });
  });

  describe("energy & lifecycle", () => {
    it("uses energy over time", () => {
      const replicator = createReplicator({ energy: 0.5, metabolism: 1.0 });
      const step = update(replicator, 1 / 60);
      expect(step.replicator.energy).toBeCloseTo(0.5 - 1 / 60, precision);
    });

    it("has a maximum energy capacity", () => {
      const replicator = { ...createReplicator(), energy: 2 };
      const step = update(replicator, 0);
      expect(step.replicator.energy).toBeLessThanOrEqual(1);
    });

    it("dies if it runs out of energy", () => {
      const replicator = { ...createReplicator(), energy: 0 };
      const step = update(replicator, 1 / 60);
      expect(step.died).toBe(true);
      expect(step.replicator.dead).toBe(true);
    });

    it("keeps track of its age", () => {
      const replicator = createReplicator();
      expect(replicator.age).toBe(0);
      const step = update(replicator, 1 / 60);
      expect(step.replicator.age).toBe(1 / 60);
    });

    it("update does not mutate its input (purity)", () => {
      const replicator = { ...createReplicator(), energy: 1 };
      const before = JSON.stringify(replicator);
      update(replicator, 1 / 60);
      expect(JSON.stringify(replicator)).toBe(before);
    });
  });
});
