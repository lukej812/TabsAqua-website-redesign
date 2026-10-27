/**
 * Seeded noise for building the world on the CPU: terrain heights, rock
 * shapes, placement jitter, and the small tileable textures the shaders read
 * (caustics and ripples). Same seed, same world, every visit.
 */
import { seeded, type Random } from "../art/random";

export type Noise = {
  /** Value noise in 2D, roughly 0 to 1. */
  n2: (x: number, y: number) => number;
  /** Value noise in 3D, roughly 0 to 1. */
  n3: (x: number, y: number, z: number) => number;
  /** Fractal 2D noise, roughly -1 to 1. */
  fbm2: (x: number, y: number, octaves?: number) => number;
  /** Fractal 3D noise, roughly -1 to 1. */
  fbm3: (x: number, y: number, z: number, octaves?: number) => number;
};

const fade = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function makeNoise(seed: number): Noise {
  const rnd = seeded(seed);
  const size = 256;
  const perm = new Uint8Array(size * 2);
  const values = new Float32Array(size);
  const order = Array.from({ length: size }, (_, i) => i);
  for (let i = size - 1; i > 0; i--) {
    const j = rnd.int(0, i);
    [order[i], order[j]] = [order[j], order[i]];
  }
  for (let i = 0; i < size * 2; i++) perm[i] = order[i & 255];
  for (let i = 0; i < size; i++) values[i] = rnd.next();

  const h2 = (x: number, y: number) => values[perm[(perm[x & 255] + y) & 511] & 255];
  const h3 = (x: number, y: number, z: number) => values[perm[(perm[(perm[x & 255] + y) & 511] + z) & 511] & 255];

  const n2 = (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const u = fade(x - xi);
    const v = fade(y - yi);
    return lerp(lerp(h2(xi, yi), h2(xi + 1, yi), u), lerp(h2(xi, yi + 1), h2(xi + 1, yi + 1), u), v);
  };

  const n3 = (x: number, y: number, z: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const zi = Math.floor(z);
    const u = fade(x - xi);
    const v = fade(y - yi);
    const w = fade(z - zi);
    const a = lerp(lerp(h3(xi, yi, zi), h3(xi + 1, yi, zi), u), lerp(h3(xi, yi + 1, zi), h3(xi + 1, yi + 1, zi), u), v);
    const b = lerp(
      lerp(h3(xi, yi, zi + 1), h3(xi + 1, yi, zi + 1), u),
      lerp(h3(xi, yi + 1, zi + 1), h3(xi + 1, yi + 1, zi + 1), u),
      v,
    );
    return lerp(a, b, w);
  };

  const fbm2 = (x: number, y: number, octaves = 4) => {
    let sum = 0;
    let amp = 0.5;
    let norm = 0;
    for (let i = 0; i < octaves; i++) {
      sum += (n2(x, y) * 2 - 1) * amp;
      norm += amp;
      x *= 2.03;
      y *= 2.03;
      amp *= 0.5;
    }
    return sum / norm;
  };

  const fbm3 = (x: number, y: number, z: number, octaves = 4) => {
    let sum = 0;
    let amp = 0.5;
    let norm = 0;
    for (let i = 0; i < octaves; i++) {
      sum += (n3(x, y, z) * 2 - 1) * amp;
      norm += amp;
      x *= 2.03;
      y *= 2.03;
      z *= 2.03;
      amp *= 0.5;
    }
    return sum / norm;
  };

  return { n2, n3, fbm2, fbm3 };
}

/**
 * A tileable caustic pattern: the bright network of light that dances on the
 * sand and reef. Distance between the two nearest cell points (Voronoi
 * F2 minus F1), sharpened. One channel, 0 to 255. The shader animates it by
 * sliding two copies across each other.
 */
export function causticPixels(size: number, cells: number, rnd: Random): Uint8Array {
  const points: [number, number][] = [];
  for (let i = 0; i < cells * cells; i++) points.push([rnd.next(), rnd.next()]);
  const out = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const fx = (x / size) * cells;
      const fy = (y / size) * cells;
      const cx = Math.floor(fx);
      const cy = Math.floor(fy);
      let d1 = 9;
      let d2 = 9;
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const gx = cx + ox;
          const gy = cy + oy;
          const wx = ((gx % cells) + cells) % cells;
          const wy = ((gy % cells) + cells) % cells;
          const [px, py] = points[wy * cells + wx];
          const dx = gx + px - fx;
          const dy = gy + py - fy;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < d1) {
            d2 = d1;
            d1 = d;
          } else if (d < d2) d2 = d;
        }
      }
      const edge = d2 - d1;
      const v = Math.pow(Math.max(0, 1 - edge / 0.22), 3);
      const i = (y * size + x) * 4;
      out[i] = out[i + 1] = out[i + 2] = Math.round(v * 255);
      out[i + 3] = 255;
    }
  }
  return out;
}

/** Tileable smooth noise, RGBA: four decorrelated channels for ripples and sand variation. */
export function noisePixels(size: number, seed: number): Uint8Array {
  const out = new Uint8Array(size * size * 4);
  const channels = [0, 1, 2, 3].map((c) => makeNoise(seed + c * 101));
  const period = 8;
  // Tileable by blending four offset samples (the classic torus trick, in 2D).
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      for (let c = 0; c < 4; c++) {
        const f = (px: number, py: number) => channels[c].fbm2(px * period, py * period, 4);
        const value =
          f(u, v) * (1 - u) * (1 - v) + f(u - 1, v) * u * (1 - v) + f(u, v - 1) * (1 - u) * v + f(u - 1, v - 1) * u * v;
        out[(y * size + x) * 4 + c] = Math.round(Math.min(1, Math.max(0, value * 0.9 + 0.5)) * 255);
      }
    }
  }
  return out;
}
