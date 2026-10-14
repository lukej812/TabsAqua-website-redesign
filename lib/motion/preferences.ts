/**
 * Decides how much motion and media a visitor's browser should get.
 * Safe to import anywhere: every check returns a conservative answer on the server.
 */

/**
 * How the guided descent renders.
 * - "video": scroll scrubs the footage.
 * - "frames": scroll scrubs a canvas image sequence (feature flag only).
 * - "still": scroll drives the chapters and overlay over a still image.
 * - "editorial": no motion. A still image and the four chapters in normal flow.
 */
export type DescentTier = "video" | "frames" | "still" | "editorial";

type NetworkInformationLike = {
  saveData?: boolean;
  effectiveType?: string;
};

const SMALL_SCREEN = "(max-width: 767px)";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

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

/**
 * When the pinned, scrubbed layout is allowed. CSS uses the same query in
 * styles/guided-descent.css, so layout and script always agree. Short windows
 * (landscape phones, 200% zoom) get the editorial layout so text can reflow.
 */
export const IMMERSIVE_LAYOUT_QUERY =
  "(scripting: enabled) and (prefers-reduced-motion: no-preference) and (min-height: 34rem)";

export function immersiveLayoutAllowed(): boolean {
  return media(IMMERSIVE_LAYOUT_QUERY);
}

export const subscribeToImmersiveLayout = subscribeToMedia(IMMERSIVE_LAYOUT_QUERY);

export type TierInputs = {
  hasVideo: boolean;
  hasMobileVideo: boolean;
  useFrames: boolean;
};

/** Picks the richest tier this browser should get. Call only in the browser. */
export function chooseTier({ hasVideo, hasMobileVideo, useFrames }: TierInputs): DescentTier {
  if (prefersReducedMotion() || connectionIsConstrained() || deviceIsLowEnd()) return "editorial";
  if (useFrames) return "frames";
  const small = isSmallScreen();
  if (small ? hasMobileVideo : hasVideo) return "video";
  return "still";
}
