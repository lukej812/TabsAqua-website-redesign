/**
 * The light and water of the world, in one place, so every object, the sky,
 * the surface, and the light shafts agree. Colors are written as sRGB hex for
 * readability and converted to linear light for the shaders.
 */

export type Vec3 = [number, number, number];

export function srgb(hex: string): Vec3 {
  const v = Number.parseInt(hex.replace("#", ""), 16);
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return [lin((v >> 16) & 255), lin((v >> 8) & 255), lin(v & 255)];
}

function normalize([x, y, z]: Vec3): Vec3 {
  const l = Math.hypot(x, y, z);
  return [x / l, y / l, z / l];
}

export const LOOK = {
  /**
   * Toward the sun, underwater. The sun stands low ahead and to the right
   * (where the hero's sky draws it); refraction steepens it to about 47
   * degrees from vertical below the surface, so light shafts slant toward the camera.
   */
  sunDir: normalize([-0.24, 0.68, 0.69]),
  sunColor: [2.1, 2.0, 1.85] as Vec3,
  /** How fast sunlight loses each color on its way down, per meter. Red goes first. */
  absorb: [0.3, 0.062, 0.036] as Vec3,
  /** How fast the view fades into water, per meter of distance. Clear Florida water. */
  extinction: [0.16, 0.052, 0.042] as Vec3,
  /** The water itself, seen looking up, level, and down. */
  waterUp: srgb("#8fd6dc"),
  waterLevel: srgb("#2489aa"),
  waterDown: srgb("#0b3f66"),
  /** Strength of the caustic network on lit surfaces. */
  caustics: 1.5,
} as const;

/** How much the renderer is asked to do. Picked by device, then adjusted by a frame-time governor. */
export type Quality = {
  name: "high" | "medium" | "low";
  /** Drawing buffer size relative to CSS pixels (device pixel ratio already capped). */
  scale: number;
  grassBlades: number;
  fish: number;
  particles: number;
  /** Terrain grid resolution. */
  floorSegments: number;
  /** Share of the reef's small growth (coral heads, sponges, sea rods) drawn. Mounds always are. */
  reef: number;
};

export const QUALITY: Record<Quality["name"], Quality> = {
  high: { name: "high", scale: 1, grassBlades: 5200, fish: 140, particles: 1600, floorSegments: 170, reef: 1 },
  medium: { name: "medium", scale: 0.75, grassBlades: 3200, fish: 100, particles: 1100, floorSegments: 130, reef: 0.8 },
  low: { name: "low", scale: 0.55, grassBlades: 1600, fish: 60, particles: 600, floorSegments: 96, reef: 0.55 },
};
