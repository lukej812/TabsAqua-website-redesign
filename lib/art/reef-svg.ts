import { reefLayer, seaFanAccent, seagrassAccent, type ReefOptions, type StrokeGroup } from "./reef";

export const REEF_WIDTH = 1600;
export const REEF_HEIGHT = 420;

/**
 * Colors match --reef-far, --reef-mid, and --reef-near in app/globals.css:
 * hazy in the distance, darkest up close.
 */
const LAYERS = {
  far: { seed: 7, base: 150, relief: 50, scale: 0.6, features: 26, color: "#1d5a78" },
  mid: { seed: 21, base: 95, relief: 60, scale: 0.85, features: 22, clear: [0.3, 0.7], color: "#0d3d5c" },
  near: { seed: 42, base: 45, relief: 40, scale: 1.15, features: 14, clear: [0.25, 0.75], color: "#04192b" },
} satisfies Record<string, Omit<ReefOptions, "width" | "height"> & { color: string }>;

export type ReefFile = keyof typeof LAYERS | "accents";

export const REEF_FILES: readonly ReefFile[] = ["far", "mid", "near", "accents"];

const strokes = (groups: StrokeGroup[], color: string) =>
  `<g fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round">${groups
    .map((g) => `<path stroke-width="${g.width}" d="${g.d}"/>`)
    .join("")}</g>`;

/** One reef layer as a standalone SVG document, generated when the site is built. */
export function reefSvg(file: ReefFile): string {
  let body: string;
  if (file === "accents") {
    const near = LAYERS.near.color;
    const fan = seaFanAccent(3, 150, REEF_HEIGHT + 4, 300, 0.3);
    const grass = seagrassAccent(9, 1460, REEF_HEIGHT + 6, 210);
    body = `<path fill="${near}" opacity="0.6" d="${fan.mesh}"/>${strokes(fan.strokes, near)}${strokes(grass, near)}`;
  } else {
    const { color, ...options } = LAYERS[file];
    const shape = reefLayer({ ...options, width: REEF_WIDTH, height: REEF_HEIGHT });
    body = `${strokes(shape.strokes, color)}<path fill="${color}" opacity="0.55" d="${shape.mesh}"/><path fill="${color}" d="${shape.fill}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${REEF_WIDTH} ${REEF_HEIGHT}" preserveAspectRatio="xMidYMax slice">${body}</svg>`;
}

export function reefResponse(file: ReefFile): Response {
  return new Response(reefSvg(file), {
    headers: { "content-type": "image/svg+xml; charset=utf-8" },
  });
}
