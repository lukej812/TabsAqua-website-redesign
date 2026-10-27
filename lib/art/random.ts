/**
 * A small seeded random number generator (mulberry32). The illustrations are
 * generated when the page is built, so the same seed must always draw the
 * same reef: no Math.random anywhere in the art.
 */
export type Random = {
  /** 0 (inclusive) to 1 (exclusive). */
  next: () => number;
  /** A float between min and max. */
  range: (min: number, max: number) => number;
  /** An integer from min to max, inclusive. */
  int: (min: number, max: number) => number;
  /** -1 or 1. */
  sign: () => number;
};

export function seeded(seed: number): Random {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (min, max) => min + (max - min) * next(),
    int: (min, max) => Math.floor(min + (max - min + 1) * next()),
    sign: () => (next() < 0.5 ? -1 : 1),
  };
}

/** Rounds to whole units, which keeps generated SVG paths short. Art viewBoxes are 1000+ units wide. */
export const r1 = (value: number) => Math.round(value);
