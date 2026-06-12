import { createNetwork, addNeuron, update } from "./network.model";
import { createNeuron, fire, Neuron } from "../neuron/neuron.model";

const precision = 9;

describe("network model", () => {
  it("accepts new neurons", () => {
    const network = addNeuron(createNetwork(), createNeuron());
    expect(network.neurons.length).toBe(1);
  });

  it("sets the index on added neurons to match position", () => {
    let network = createNetwork();
    network = addNeuron(network, createNeuron());
    network = addNeuron(network, createNeuron());

    expect(network.neurons[0].index).toBe(0);
    expect(network.neurons[1].index).toBe(1);
  });

  it("pads weights to/for new neurons", () => {
    let network = addNeuron(createNetwork(), createNeuron());
    network = addNeuron(network, createNeuron());

    const [a, b] = network.neurons;
    // every neuron has a weight slot for every neuron index
    expect(0 in a.weights).toBe(true);
    expect(1 in a.weights).toBe(true);
    expect(0 in b.weights).toBe(true);
    expect(1 in b.weights).toBe(true);
  });

  it("doesn't overwrite existing weights", () => {
    const network = addNeuron(createNetwork(), createNeuron({ weights: [0.9] }));
    expect(network.neurons[0].weights[0]).toBe(0.9);
  });

  it("propagates neuron signals", () => {
    const opts = { potentialDecayRate: 0, refractoryPeriod: 1 };

    let network = createNetwork();
    // neuron A, primed to fire
    network = addNeuron(network, { ...createNeuron(opts), potential: 1 });
    // neuron B, excited by A (weights[A.index = 0] = 1)
    network = addNeuron(network, createNeuron({ ...opts, weights: [1] }));

    network = update(network, 0).network; // A begins firing
    network = update(network, 0.25).network; // A fires for 1/4 second

    expect(network.neurons[0].potential).toBeCloseTo(1 - 0.25, precision);
    expect(network.neurons[1].potential).toBeCloseTo(0 + 0.25, precision);
  });

  it("doesn't propagate signals to originators", () => {
    // a single neuron with a self-weight, already firing
    const neuron: Neuron = fire(
      createNeuron({ potentialDecayRate: 0, refractoryPeriod: 1, weights: [1] }),
    );
    const network = addNeuron(createNetwork(), neuron);

    const next = update(network, 1 / 60).network;

    // drained only by the refractory period, not self-stimulated
    expect(next.neurons[0].potential).toBeCloseTo(1 - 1 / 60, precision);
  });

  it("adjusts signal strength per refractory period", () => {
    const opts = { potentialDecayRate: 0 };

    let network = createNetwork();
    // A fires with a 0.5s refractory period
    network = addNeuron(network, fire(createNeuron({ ...opts, refractoryPeriod: 0.5 })));
    // B excited by A
    network = addNeuron(network, createNeuron({ ...opts, weights: [1] }));

    network = update(network, 0.25).network;

    // A halfway through its refractory period; B received 0.25 / 0.5 = 0.5
    expect(network.neurons[0].potential).toBeCloseTo(1 - 0.5, precision);
    expect(network.neurons[1].potential).toBeCloseTo(0 + 0.5, precision);
  });

  it("reports which neurons fired this tick", () => {
    let network = createNetwork();
    network = addNeuron(network, { ...createNeuron(), potential: 1 }); // will fire
    network = addNeuron(network, createNeuron()); // won't

    const step = update(network, 0);

    expect(step.fired).toEqual([true, false]);
  });

  it("update does not mutate its input network (purity)", () => {
    let network = createNetwork();
    network = addNeuron(network, { ...createNeuron(), potential: 1 });
    const before = JSON.stringify(network);

    update(network, 1 / 60);

    expect(JSON.stringify(network)).toBe(before);
  });
});
