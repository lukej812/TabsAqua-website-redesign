/**
 * Decides how much motion and media a visitor's browser should get.
 * Safe to import anywhere: every check returns a conservative answer on the server.
 */

/**
 * How the ocean stage behind the hero and descent renders.
 * - "video": scroll scrubs the footage (only once footage exists).
 * - "frames": scroll scrubs a canvas image sequence (feature flag only).
 * - "scene": the live WebGL water scene, driven by scroll.
 * - "static": no motion. The illustrated surface at the top, plain water below.
 */
export type DescentTier = "video" | "frames" | "scene" | "static";

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

export type TierInputs = {
  hasVideo: boolean;
  hasMobileVideo: boolean;
  useFrames: boolean;
  /** False once the WebGL scene has failed in this browser. */
  sceneAvailable: boolean;
};

/** Picks the richest tier this browser should get. Call only in the browser. */
export function chooseTier({ hasVideo, hasMobileVideo, useFrames, sceneAvailable }: TierInputs): DescentTier {
  if (prefersReducedMotion() || connectionIsConstrained() || deviceIsLowEnd()) return "static";
  if (useFrames) return "frames";
  if (isSmallScreen() ? hasMobileVideo : hasVideo) return "video";
  return sceneAvailable ? "scene" : "static";
}
