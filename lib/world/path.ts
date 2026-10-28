/**
 * The camera's journey through the world, keyed to the page.
 *
 * Each shot belongs to an element on the page. When that element's top reaches
 * `at` (a fraction of the viewport height, from the top), the camera is exactly
 * at the shot. Between shots the camera glides along a smooth curve. Because
 * shots are tied to elements, not to percentages, the composition lines up
 * with the content at any screen size and any text length.
 *
 * Screen right is -x (the camera looks down +z). Text sits on the left on wide
 * screens, so the reef and the diver are framed on the right.
 */

import { LINE, SNORKELERS } from "./places";

export type V3 = readonly [number, number, number];

export type Shot = {
  /** A selector for the element this shot belongs to. */
  anchor: string;
  /** Where the anchor's top sits when the shot is exact: 0 is the top of the viewport, 1 the bottom, -0.5 half a screen above it. */
  at: number;
  cam: V3;
  look: V3;
  /** Phones: a different framing for the same moment. Optional. */
  phone?: { cam?: V3; look?: V3; waterline?: number };
  /** What the camera frames. Defaults to the diver. */
  subject?: V3;
  /** Wide screens: where the subject sits across the frame, if not the usual place. */
  frameX?: number;
  diver: V3;
  /** 0 hovering to 1 swimming hard. */
  effort: number;
  /** How strongly the left side (phones: the whole frame) is darkened behind text, 0 to 1. */
  scrim: number;
  /** The waterline on screen at this shot, 0 bottom to 1 top. Above 1.15 it is out of frame. */
  waterline: number;
};

/** Waterline height for the surface shots, matching --water-top in the CSS (34% desktop, 22% phone). */
export const REST_WATERLINE = { wide: 0.66, phone: 0.78 };

const OUT = 1.4;

/** Subjects to frame: the first snorkeler, and the middle of the descent line. */
const SNORKELER: V3 = SNORKELERS[0].at;
const LINE_MID: V3 = [LINE.x, -6, LINE.z];

/**
 * Where each shot's subject sits across the frame (0 left, 1 right), for a
 * typical wide screen and a typical phone. Wide screens keep the subject right
 * of the text column; phones, where text spans the width, just off center.
 */
export const FRAME = {
  wide: { x: 0.74, fov: 50, aspect: 1.6 },
  phone: { x: 0.62, fov: 62, aspect: 0.46 },
} as const;

export const SHOTS: readonly Shot[] = [
  // The surface: half in, half out of the water, the diver just under the surface.
  {
    anchor: "#top",
    at: 0,
    cam: [0, -0.22, 0],
    look: [0, -1.72, 10],
    phone: { cam: [0.6, -0.22, -1], look: [-0.8, -3.6, 10], waterline: REST_WATERLINE.phone },
    diver: [-3.2, -1.5, 9],
    effort: 0.8,
    scrim: 0,
    waterline: REST_WATERLINE.wide,
  },
  // Sinking: half a screen down, the camera settles below the surface and the
  // waterline lifts slowly toward the top of the frame.
  {
    anchor: "#top",
    at: -0.5,
    cam: [0.3, -0.8, 3.5],
    look: [-0.5, -2.6, 13.5],
    phone: { cam: [0.5, -0.8, 1.5], waterline: 0.93 },
    diver: [-3.1, -2.1, 12],
    effort: 0.75,
    scrim: 0.2,
    waterline: 0.88,
  },
  // Under: the surface leaves the frame, the light thins, the descent begins.
  {
    anchor: "#first-dive",
    at: 0.2,
    cam: [0.6, -1.7, 8],
    look: [-1.0, -4.2, 22],
    diver: [-3.0, -2.9, 15.5],
    effort: 0.7,
    scrim: 0.45,
    waterline: OUT,
  },
  {
    anchor: ".descent__step:nth-child(1)",
    at: 0.5,
    cam: [0.6, -2.9, 13],
    look: [-1.5, -5.3, 27],
    diver: [-3.3, -3.9, 20.5],
    effort: 0.6,
    scrim: 0.5,
    waterline: OUT,
  },
  {
    anchor: ".descent__step:nth-child(2)",
    at: 0.5,
    cam: [0.5, -3.9, 18],
    look: [-2.0, -6.1, 31],
    diver: [-3.5, -4.7, 25],
    effort: 0.5,
    scrim: 0.5,
    waterline: OUT,
  },
  {
    anchor: ".descent__step:nth-child(3)",
    at: 0.5,
    cam: [0.3, -4.6, 23],
    look: [-2.3, -6.5, 36],
    diver: [-3.8, -5.3, 30],
    effort: 0.6,
    scrim: 0.5,
    waterline: OUT,
  },
  {
    anchor: ".descent__close",
    at: 0.45,
    cam: [0.2, -5.0, 28],
    look: [-2.5, -6.4, 42],
    diver: [-4.4, -5.6, 36],
    effort: 0.6,
    scrim: 0.5,
    waterline: OUT,
  },
  // The reef opens up on the right.
  {
    anchor: "#experiences",
    at: 0.35,
    cam: [0.6, -5.2, 34],
    look: [-2.6, -6.1, 48],
    diver: [-5.0, -5.8, 43],
    effort: 0.5,
    scrim: 0.55,
    waterline: OUT,
  },
  // Discover Scuba: open sand beside the reef, where a first dive feels calm.
  {
    anchor: "#discover-scuba",
    at: 0.35,
    cam: [0.9, -5.3, 42],
    look: [-0.9, -6.7, 54],
    diver: [-4.6, -6.2, 49],
    effort: 0.25,
    scrim: 0.6,
    waterline: OUT,
  },
  // Snorkeling: the camera tilts up to the snorkelers floating at the surface.
  {
    anchor: "#snorkeling",
    at: 0.35,
    cam: [0.6, -4.9, 56],
    look: [-4.8, -2.2, 68],
    subject: SNORKELER,
    frameX: 0.76,
    diver: [-3.4, -4.6, 62],
    effort: 0.4,
    scrim: 0.8,
    waterline: OUT,
  },
  // Guided tours: gliding along the richest part of the reef, with the fish.
  {
    anchor: "#guided-tours",
    at: 0.35,
    cam: [0.6, -5.2, 66],
    look: [-1.2, -6.0, 80],
    diver: [-5.4, -5.4, 74],
    effort: 0.6,
    scrim: 0.6,
    waterline: OUT,
  },
  // Deeper: past the reef to the sand channel, where the descent line hangs.
  {
    anchor: "#certification",
    at: 0.35,
    cam: [0.0, -6.0, 92],
    look: [-5.6, -6.2, 108],
    subject: LINE_MID,
    frameX: 0.8,
    diver: [-3.0, -6.0, 101],
    effort: 0.6,
    scrim: 0.7,
    waterline: OUT,
  },
  {
    anchor: "#certification .line",
    at: 0.4,
    cam: [-0.6, -7.4, 100],
    look: [-1.3, -5.4, 112],
    subject: LINE_MID,
    frameX: 0.8,
    diver: [-6.0, -7.4, 111.4],
    effort: 0.2,
    scrim: 0.7,
    waterline: OUT,
  },
  {
    anchor: "#certification .stages",
    at: 0.5,
    cam: [-1.4, -7.9, 103],
    look: [-2.4, -7.2, 114],
    subject: LINE_MID,
    frameX: 0.8,
    diver: [-6.0, -6.6, 111.4],
    effort: 0.2,
    scrim: 0.7,
    waterline: OUT,
  },
  // The safety stop: holding the line, partway up, the light returning.
  {
    anchor: "#tabitha",
    at: 0.35,
    cam: [-2.4, -4.8, 105],
    look: [-3.2, -4.0, 112],
    subject: LINE_MID,
    frameX: 0.8,
    diver: [-6.0, -4.3, 111.5],
    effort: 0.12,
    scrim: 0.8,
    waterline: OUT,
  },
  {
    anchor: "#tabitha .quote",
    at: 0.45,
    cam: [-2.8, -4.2, 104],
    look: [-3.1, -2.4, 112],
    subject: LINE_MID,
    frameX: 0.8,
    diver: [-6.0, -4.1, 111.5],
    effort: 0.12,
    scrim: 0.7,
    waterline: OUT,
  },
  // The ascent: up toward the bright surface, with the fish.
  {
    anchor: "#groups",
    at: 0.35,
    cam: [-2.0, -2.8, 117],
    look: [-1.2, -1.4, 131],
    diver: [-4.6, -2.2, 125],
    effort: 0.5,
    scrim: 0.8,
    waterline: OUT,
  },
  // Surfacing: the waterline comes back down into the frame.
  {
    anchor: ".dive__end",
    at: 1,
    cam: [-2.0, -0.22, 126],
    look: [-2.0, -1.72, 136],
    phone: { look: [-2.6, -3.6, 136], waterline: REST_WATERLINE.phone },
    diver: [-4.6, -0.5, 133],
    effort: 0.4,
    scrim: 0.2,
    waterline: REST_WATERLINE.wide,
  },
];

/* ------------------------------------------------------------------ */
/* Interpolation                                                       */
/* ------------------------------------------------------------------ */

function catmull(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

function curve(points: readonly V3[], u: number): [number, number, number] {
  const n = points.length;
  const i = Math.min(n - 2, Math.max(0, Math.floor(u)));
  const t = Math.min(1, Math.max(0, u - i));
  const p0 = points[Math.max(0, i - 1)];
  const p1 = points[i];
  const p2 = points[i + 1];
  const p3 = points[Math.min(n - 1, i + 2)];
  return [catmull(p0[0], p1[0], p2[0], p3[0], t), catmull(p0[1], p1[1], p2[1], p3[1], t), catmull(p0[2], p1[2], p2[2], p3[2], t)];
}

const ease = (t: number) => t * t * (3 - 2 * t);

/**
 * Turns the camera about the vertical, keeping its distance and height, so
 * `subject` sits at `x` across the frame (0 left, 1 right). Screen right is -x.
 */
function aim(cam: V3, look: V3, subject: V3, x: number, frame: { fov: number; aspect: number }): V3 {
  const reach = Math.hypot(look[0] - cam[0], look[2] - cam[2]);
  const half = Math.tan((frame.fov * Math.PI) / 360) * frame.aspect;
  const yaw = Math.atan2(subject[0] - cam[0], subject[2] - cam[2]) + Math.atan((2 * x - 1) * half);
  return [cam[0] + Math.sin(yaw) * reach, look[1], cam[2] + Math.cos(yaw) * reach];
}

function scalar(values: readonly number[], u: number): number {
  const i = Math.min(values.length - 2, Math.max(0, Math.floor(u)));
  const t = ease(Math.min(1, Math.max(0, u - i)));
  return values[i] + (values[i + 1] - values[i]) * t;
}

/**
 * Where along the path a scroll position falls, as a continuous shot index:
 * 2.5 is halfway between shots 2 and 3. `marks` are the scroll positions of
 * the shots, in order.
 */
export function pathIndex(scroll: number, marks: readonly number[]): number {
  if (marks.length < 2 || scroll <= marks[0]) return 0;
  for (let i = 0; i < marks.length - 1; i++) {
    if (scroll < marks[i + 1]) {
      const span = Math.max(1, marks[i + 1] - marks[i]);
      return i + (scroll - marks[i]) / span;
    }
  }
  return marks.length - 1;
}

export type PathState = {
  cam: [number, number, number];
  look: [number, number, number];
  diver: [number, number, number];
  heading: number;
  pitch: number;
  effort: number;
  scrim: number;
  waterline: number;
};

/**
 * The screen the camera frames for: its shape, its vertical field of view, and
 * where across it the subject goes. Defaults to FRAME's typical screens.
 */
export type View = { aspect: number; fov: number; x: number; portrait: boolean };

/** The framing for a screen of `width` by `height` whose text column ends at `columnEnd` px. */
export function viewFor(width: number, height: number, columnEnd: number): View {
  const aspect = width / Math.max(1, height);
  if (aspect < 1) return { aspect, fov: FRAME.phone.fov, x: FRAME.phone.x, portrait: true };
  // Right of the text column, a little under halfway into the open water.
  const edge = Math.min(0.9, Math.max(0, columnEnd / Math.max(1, width)));
  return { aspect, fov: FRAME.wide.fov, x: edge + (1 - edge) * 0.4, portrait: false };
}

/**
 * Everything the camera and diver are doing at continuous shot index `u`.
 * `phone` picks the phone versions of shots and the phone waterline; `view`
 * says which screen to frame for.
 */
export function pathAt(u: number, phone: boolean, shots: readonly Shot[] = SHOTS, view?: View): PathState {
  const cams = shots.map((s) => (phone && s.phone?.cam) || s.cam);
  // The camera turns to put each shot's subject in its place in the frame.
  const frame: View = view ?? (phone ? { ...FRAME.phone, portrait: true } : { ...FRAME.wide, portrait: false });
  const looks = shots.map((s, i) => {
    // On wide screens a shot can ask for its subject a little left or right of the usual place.
    const x = frame.portrait ? frame.x : frame.x + (s.frameX ?? FRAME.wide.x) - FRAME.wide.x;
    return aim(cams[i], (phone && s.phone?.look) || s.look, s.subject ?? s.diver, x, frame);
  });
  const divers = shots.map((s) => s.diver);
  const diver = curve(divers, u);
  // Face the diver along its path; look a little ahead to get the direction.
  const ahead = curve(divers, Math.min(shots.length - 1, u + 0.08));
  const dx = ahead[0] - diver[0];
  const dy = ahead[1] - diver[1];
  const dz = ahead[2] - diver[2];
  const flat = Math.hypot(dx, dz);
  const heading = flat > 1e-4 ? Math.atan2(dx, dz) : 0;
  const pitch = flat > 1e-4 ? Math.max(-0.6, Math.min(0.6, -Math.atan2(dy, flat))) : 0;
  const waterlines = shots.map((s) => (phone && s.phone?.waterline) || s.waterline);
  return {
    cam: curve(cams, u),
    look: curve(looks, u),
    diver,
    heading,
    pitch,
    effort: scalar(shots.map((s) => s.effort), u),
    scrim: scalar(shots.map((s) => s.scrim), u),
    waterline: scalar(waterlines, u),
  };
}
