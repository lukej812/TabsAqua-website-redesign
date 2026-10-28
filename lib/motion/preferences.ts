/**
 * Decides how much motion and media a visitor's browser should get.
 * Safe to import anywhere: every check returns a conservative answer on the server.
 */

/**
 * How the ocean stage behind the journey renders.
 * - "video": scroll scrubs the footage (only once footage exists).
 * - "frames": scroll scrubs a canvas image sequence (feature flag only).
 * - "world": the real-time 3D underwater world, with a camera that travels through it.
 * - "scene": the lighter 2D water painting, for devices the world is too heavy for.
 * - "still": one frame of the world, no motion (reduced motion).
 * - "static": the CSS and SVG drawing (no JavaScript, data saver, no WebGL).
 */
export type DescentTier = "video" | "frames" | "world" | "scene" | "still" | "static";

export const TIERS: readonly DescentTier[] = ["video", "frames", "world", "scene", "still", "static"];

/** Tiers where scroll drives the stage, so it sticks behind the content. */
export const LIVE_TIERS: readonly DescentTier[] = ["video", "frames", "world", "scene"];

type NetworkInformationLike = {
  saveData?: boolean;
  effectiveType?: string;
};

const SMALL_SCREEN = "(max-width: 767px)";
export const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function media(query: string): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(query).matches
    : false;
}

export function prefersReducedMotion(): boolean {
  return media(REDUCED_MOTION);
}

export function isSmallScreen(): boolean {
  return media(SMALL_SCREEN);
}

/** A useSyncExternalStore subscribe function for one media query. */
export function subscribeToMedia(query: string) {
  return (callback: () => void): (() => void) => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
    const list = window.matchMedia(query);
    list.addEventListener("change", callback);
    return () => list.removeEventListener("change", callback);
  };
}

export const subscribeToSmallScreen = subscribeToMedia(SMALL_SCREEN);
export const subscribeToReducedMotion = subscribeToMedia(REDUCED_MOTION);

/** Data saver on, or a 2G-class connection. */
export function connectionIsConstrained(): boolean {
  if (typeof navigator === "undefined") return false;
  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
  if (!connection) return false;
  return Boolean(connection.saveData) || connection.effectiveType === "2g" || connection.effectiveType === "slow-2g";
}

/** Very low memory or very few cores. Unknown values count as capable. */
export function deviceIsLowEnd(): boolean {
  if (typeof navigator === "undefined") return false;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const cores = navigator.hardwareConcurrency;
  return (typeof memory === "number" && memory < 2) || (typeof cores === "number" && cores > 0 && cores < 2);
}

let webgl2: boolean | null = null;

/** Whether this browser can run the 3D world (WebGL 2). Checked once. */
export function supportsWebGL2(): boolean {
  if (webgl2 !== null) return webgl2;
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    webgl2 = Boolean(gl);
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webgl2 = false;
  }
  return webgl2;
}

export type TierInputs = {
  hasVideo: boolean;
  hasMobileVideo: boolean;
  useFrames: boolean;
  /** A poster frame from real footage exists. */
  hasPoster: boolean;
  /** False once the 3D world has failed or proved too slow here. */
  worldAvailable: boolean;
  /** False once the 2D water scene has failed here. */
  sceneAvailable: boolean;
};

/** Picks the richest tier this browser should get. Call only in the browser. */
export function chooseTier({ hasVideo, hasMobileVideo, useFrames, hasPoster, worldAvailable, sceneAvailable }: TierInputs): DescentTier {
  if (connectionIsConstrained() || deviceIsLowEnd()) return "static";
  const world = worldAvailable && supportsWebGL2();
  // Without motion: a frame of real footage once it exists, else one frame of the world.
  if (prefersReducedMotion()) return world && !hasPoster ? "still" : "static";
  if (useFrames) return "frames";
  if (isSmallScreen() ? hasMobileVideo : hasVideo) return "video";
  if (world) return "world";
  return sceneAvailable ? "scene" : "static";
}

export type QualityName = "high" | "medium" | "low";

/** A starting quality for the 3D world. The frame-time governor adjusts from there. */
export function startingQuality(): QualityName {
  if (isSmallScreen()) return "low";
  if (typeof navigator === "undefined") return "medium";
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const cores = navigator.hardwareConcurrency;
  if ((typeof memory === "number" && memory <= 4) || (typeof cores === "number" && cores > 0 && cores <= 4)) return "medium";
  return "high";
}
