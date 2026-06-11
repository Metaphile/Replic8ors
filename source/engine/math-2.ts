export type Clamp = (value: number, min: number, max: number) => number;
export type CreateRandRange = (rng: Rng) => RandRange;
export type RandRange = (min: number, max: number) => number;
export type Rng = () => number; // 0..1

export const TAU = Math.PI * 2; // tauday.com

export const createRandRange: CreateRandRange = (rng) => {
  return (min, max) => {
    return min + rng() * (max - min);
  };
};

// module-level random source, swappable for deterministic tests via setRng().
// defaults to Math.random so behavior is unchanged in production.
let _rng: Rng = Math.random;

export const setRng = (rng: Rng): void => {
  _rng = rng;
};

export const random: Rng = () => _rng();

export const randRange: RandRange = (min, max) => min + random() * (max - min);

export const clamp: Clamp = (value, min, max) => {
  if (value < min) {
    return min;
  } else if (value > max) {
    return max;
  } else {
    return value;
  }
};
