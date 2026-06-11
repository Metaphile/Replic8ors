import { createNeuron, stimulate, fire, update, Neuron } from "./neuron.model";

// for floating point comparison
const precision = 9;
const error = Math.pow(10, -precision);

// test helper: override fields the public API doesn't set directly
const withFields = (neuron: Neuron, fields: Partial<Neuron>): Neuron => ({ ...neuron, ...fields });

describe("neuron model", () => {
  it("excitatory/inhibitory input increases/decreases neuron potential", () => {
    let neuron = createNeuron({ weights: [1.0, -1.0] });
    const excitatoryIndex = 0;
    const inhibitoryIndex = 1;

    neuron = stimulate(neuron, 1 / 60, excitatoryIndex);
    neuron = update(neuron, 0).neuron;
    expect(neuron.potential).toBeGreaterThan(error);

    neuron = withFields(neuron, { potential: 0.9 });
    neuron = stimulate(neuron, 1 / 60, inhibitoryIndex);
    neuron = update(neuron, 0).neuron;
    expect(neuron.potential).toBeLessThan(0.9 - error);
  });

  it("threshold potential activates neuron", () => {
    let neuron = createNeuron();

    neuron = withFields(neuron, { potential: 0.9 });
    neuron = update(neuron, 1 / 60).neuron;
    expect(neuron.firing).toBe(false);

    neuron = withFields(neuron, { potential: 1.0 });
    neuron = update(neuron, 1 / 60).neuron;
    expect(neuron.firing).toBe(true);
  });

  it("takes a specific amount of time to fire", () => {
    let neuron = createNeuron({ refractoryPeriod: 0.25 });

    neuron = withFields(neuron, { potential: 1.0 });
    neuron = update(neuron, 14 / 60).neuron; // just less than 1/4 sec
    expect(neuron.firing).toBe(true);

    neuron = update(neuron, 1 / 60 + error).neuron;
    expect(neuron.firing).toBe(false);
  });

  it("neuron ignores input while firing", () => {
    let neuron = createNeuron({ refractoryPeriod: 1.0, weights: [1.0] });
    neuron = withFields(neuron, { potential: 1.0 });

    neuron = update(neuron, 1 / 60).neuron;
    neuron = stimulate(neuron, 1 / 60, 0);
    neuron = update(neuron, 1 / 60).neuron;
    expect(neuron.potential).toBeCloseTo(1.0 - 2 / 60, precision);
  });

  it("neuron potential returns to zero after firing", () => {
    let neuron = createNeuron({ refractoryPeriod: 1.0 });
    neuron = withFields(neuron, { potential: 1.0 });

    neuron = update(neuron, 60 / 60 + error).neuron;
    expect(neuron.potential).toBeCloseTo(0, precision);
  });

  it("neuron potential decays over time", () => {
    let neuron = createNeuron({ potentialDecayRate: 0.5 });

    neuron = withFields(neuron, { potential: 0.9 });
    neuron = update(neuron, 1 / 60).neuron;
    expect(neuron.potential).toBeLessThan(0.9 - error);
  });

  it("neuron tracks inhibitory input", () => {
    // previously disabled in the prototype spec ("broken by input scaling");
    // as a pure function it's a single deterministic call to assert on.
    let neuron = createNeuron({ weights: [-1.0] });

    neuron = stimulate(neuron, 0.1, 0);
    expect(neuron.inhibitoryInput).toBeCloseTo(0.1, precision);
  });

  it("neuron activation resets inhibitory input", () => {
    let neuron = createNeuron();

    neuron = withFields(neuron, { inhibitoryInput: 0.5 });
    neuron = fire(neuron);

    expect(neuron.inhibitoryInput).toBeCloseTo(0, precision);
  });

  it("update reports when the neuron fired", () => {
    let neuron = createNeuron();

    neuron = withFields(neuron, { potential: 1.0 });
    const step = update(neuron, 0);

    expect(step.fired).toBe(true);
  });

  it("does not report fired below threshold", () => {
    let neuron = createNeuron();

    neuron = withFields(neuron, { potential: 0.5 });
    const step = update(neuron, 1 / 60);

    expect(step.fired).toBe(false);
  });

  it("potential >= 0", () => {
    let neuron = createNeuron({ weights: [-1] });

    neuron = stimulate(neuron, 0.5, 0);
    neuron = update(neuron, 0).neuron;

    expect(neuron.potential).toBeGreaterThanOrEqual(0);
  });

  it("stimulate does not mutate its input (purity)", () => {
    const neuron = createNeuron({ weights: [1.0] });
    const before = JSON.stringify(neuron);

    stimulate(neuron, 1 / 60, 0);

    expect(JSON.stringify(neuron)).toBe(before);
  });

  it("update does not mutate its input (purity)", () => {
    const neuron = withFields(createNeuron(), { potential: 1.0 });
    const before = JSON.stringify(neuron);

    update(neuron, 1 / 60);

    expect(JSON.stringify(neuron)).toBe(before);
  });
});
