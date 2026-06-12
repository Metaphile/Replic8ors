import { Body, applyForce, applyTorque, updatePhysics, collide } from "./physics.model";

const precision = 9;

const createBody = (fields: Partial<Body> = {}): Body => ({
  position: { x: 0, y: 0 },
  velocity: { x: 0, y: 0 },
  rotation: 0,
  angularVelocity: 0,
  mass: 1,
  drag: 1,
  radius: 1,
  elasticity: 1,
  ...fields,
});

describe("physics model", () => {
  it("applyForce accelerates inversely to mass", () => {
    const body = applyForce(createBody({ mass: 2 }), { x: 10, y: 0 }, 1);
    expect(body.velocity.x).toBeCloseTo(5, precision);
    expect(body.velocity.y).toBeCloseTo(0, precision);
  });

  it("applyTorque changes angular velocity inversely to mass", () => {
    const body = applyTorque(createBody({ mass: 4 }), 8, 1);
    expect(body.angularVelocity).toBeCloseTo(2, precision);
  });

  it("updatePhysics advances position by post-drag velocity", () => {
    // drag/mass = 1, dt = 1 -> scale = 1/(1+1) = 0.5
    const body = updatePhysics(createBody({ velocity: { x: 10, y: 0 } }), 1);
    expect(body.velocity.x).toBeCloseTo(5, precision);
    expect(body.position.x).toBeCloseTo(5, precision);
  });

  it("updatePhysics advances rotation by post-drag angular velocity", () => {
    const body = updatePhysics(createBody({ angularVelocity: 4 }), 1);
    expect(body.angularVelocity).toBeCloseTo(2, precision);
    expect(body.rotation).toBeCloseTo(2, precision);
  });

  it("higher mass resists drag more", () => {
    const light = updatePhysics(createBody({ mass: 1, velocity: { x: 10, y: 0 } }), 1);
    const heavy = updatePhysics(createBody({ mass: 100, velocity: { x: 10, y: 0 } }), 1);
    expect(heavy.velocity.x).toBeGreaterThan(light.velocity.x);
  });

  it("collide repels overlapping bodies apart", () => {
    const a = createBody({ position: { x: 0, y: 0 }, radius: 2, elasticity: 1 });
    const b = createBody({ position: { x: 1, y: 0 }, radius: 2, elasticity: 1 });

    const result = collide(a, b, 1);

    // a pushed left (negative x), b pushed right (positive x)
    expect(result.a.velocity.x).toBeLessThan(0);
    expect(result.b.velocity.x).toBeGreaterThan(0);
  });

  it("collide leaves non-overlapping bodies unchanged", () => {
    const a = createBody({ position: { x: 0, y: 0 }, radius: 1 });
    const b = createBody({ position: { x: 100, y: 0 }, radius: 1 });

    const result = collide(a, b, 1);

    expect(result.a).toBe(a);
    expect(result.b).toBe(b);
  });

  it("collide uses the injected rng for coincident bodies", () => {
    const a = createBody({ position: { x: 0, y: 0 }, radius: 2 });
    const b = createBody({ position: { x: 0, y: 0 }, radius: 2 });

    // rng = 0 -> angle 0 -> offset along +x -> a pushed -x, b pushed +x
    const result = collide(a, b, 1, () => 0);

    expect(result.a.velocity.x).toBeLessThan(0);
    expect(result.b.velocity.x).toBeGreaterThan(0);
  });

  it("applyForce does not mutate its input (purity)", () => {
    const body = createBody();
    const before = JSON.stringify(body);
    applyForce(body, { x: 1, y: 1 }, 1);
    expect(JSON.stringify(body)).toBe(before);
  });

  it("updatePhysics does not mutate its input (purity)", () => {
    const body = createBody({ velocity: { x: 3, y: 4 } });
    const before = JSON.stringify(body);
    updatePhysics(body, 1);
    expect(JSON.stringify(body)).toBe(before);
  });
});
