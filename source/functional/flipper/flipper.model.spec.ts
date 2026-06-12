import { createFlipper, flip, update } from "./flipper.model";

const precision = 9;
const error = Math.pow(10, -precision);

const length = (v: { x: number; y: number }) => Math.sqrt(v.x * v.x + v.y * v.y);

describe("flipper model", () => {
  const testFlipper = () => createFlipper(0, { strength: 1, flipTime: 1 });

  it("starts idle (no force)", () => {
    const { force } = update(testFlipper(), 1 / 60);
    expect(force).toBeNull();
  });

  it("produces a force once flipped", () => {
    const flipped = flip(testFlipper());
    const { force } = update(flipped, 1 / 60);
    expect(force).not.toBeNull();
  });

  it("flips for a little bit, then stops", () => {
    let flipper = flip(testFlipper());

    const first = update(flipper, 1 + error); // one flip's worth
    flipper = first.flipper;
    expect(first.force).not.toBeNull();

    const second = update(flipper, 1 / 60); // no more flip
    expect(second.force).toBeNull();
  });

  it("flips quickly then slowly (effort trails off)", () => {
    let flipper = flip(testFlipper());

    const first = update(flipper, 1 / 60);
    flipper = first.flipper;
    const initialStrength = length(first.force!);

    const second = update(flipper, 1 / 60);
    const currentStrength = length(second.force!);

    expect(currentStrength).toBeLessThan(initialStrength - error);
  });

  it("force points opposite the flipper angle", () => {
    // angle 0 -> direction PI -> force along -x
    const { force } = update(flip(testFlipper()), 1 / 60);
    expect(force!.x).toBeLessThan(0);
    expect(force!.y).toBeCloseTo(0, precision);
  });

  it("update does not mutate its input (purity)", () => {
    const flipper = flip(testFlipper());
    const before = JSON.stringify(flipper);
    update(flipper, 1 / 60);
    expect(JSON.stringify(flipper)).toBe(before);
  });
});
