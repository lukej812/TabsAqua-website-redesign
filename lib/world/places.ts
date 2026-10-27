/**
 * Fixed landmarks in the world. Shared by the scene (world.ts) and the camera
 * path (path.ts), which must not import three.js, so they live here.
 */

/** Where the descent line hangs from its buoy. */
export const LINE = { x: -6.5, z: 112 } as const;

/** The two snorkelers floating at the surface over the reef: position and heading. */
export const SNORKELERS = [
  { at: [-4.5, -0.32, 66], heading: -0.9 },
  { at: [-6.2, -0.3, 68.5], heading: -1.3 },
] as const;
