/**
 * Generates reef silhouettes as SVG path data, at build time.
 *
 * The forms are the ones a diver sees on Florida's Atlantic reefs and around
 * Blue Heron Bridge: sea fans, sea rods, barrel and tube sponges, boulder
 * coral, and seagrass. Nothing tropical from elsewhere (no clownfish, no
 * staghorn thickets). Everything is seeded, so a build always draws the same reef.
 */
import { r1, seeded, type Random } from "./random";

export type StrokeGroup = { width: number; d: string };

export type ReefLayer = {
  /** Closed shapes: rock, sponges, coral heads. */
  fill: string;
  /** The lace between sea fan branches. Drawn semi-transparent. */
  mesh: string;
  /** Open strokes, grouped by width: sea fans, sea rods, tube sponges, seagrass. */
  strokes: StrokeGroup[];
};

export type ReefOptions = {
  seed: number;
  width: number;
  height: number;
  /** The average height of the rock line, measured up from the bottom. */
  base: number;
  /** How far the rock line rises and falls. */
  relief: number;
  /** Size of the corals and sponges, relative to 1. */
  scale: number;
  /** Rough count of features across the width. */
  features: number;
  /** Keep this horizontal band clear of tall growth (0 to 1 of the width), for text. */
  clear?: readonly [number, number];
};

class Strokes {
  private groups = new Map<number, string[]>();

  add(width: number, d: string) {
    const key = Math.max(0.8, Math.round(width * 2) / 2);
    const list = this.groups.get(key) ?? [];
    list.push(d);
    this.groups.set(key, list);
  }

  toGroups(): StrokeGroup[] {
    return [...this.groups.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([width, parts]) => ({ width, d: parts.join("") }));
  }
}

/** The rock line: a few slow waves and some smaller bumps. */
function ridge(rnd: Random, o: ReefOptions) {
  const waves = Array.from({ length: 4 }, (_, i) => ({
    freq: (i + 1) * rnd.range(0.7, 1.3) * ((Math.PI * 2) / o.width),
    phase: rnd.range(0, Math.PI * 2),
    amp: o.relief / (i + 1.2),
  }));
  const yAt = (x: number) => {
    let y = 0;
    for (const w of waves) y += Math.sin(x * w.freq + w.phase) * w.amp;
    return o.height - o.base - y * 0.5;
  };
  return yAt;
}

function rockPath(rnd: Random, o: ReefOptions, yAt: (x: number) => number) {
  const step = o.width / 48;
  let d = `M0 ${o.height}L0 ${r1(yAt(0))}`;
  for (let x = step; x <= o.width + 0.1; x += step) {
    // Small lumps of rock and rubble on top of the slow line.
    const lump = rnd.next() < 0.35 ? rnd.range(2, 9) * o.scale : 0;
    const cx = x - step / 2;
    d += `Q${r1(cx)} ${r1(yAt(cx) - lump * 2)} ${r1(x)} ${r1(yAt(x))}`;
  }
  return `${d}L${o.width} ${o.height}Z`;
}

/**
 * A sea fan: a short stalk and a flat spray of branches, wider than it is tall.
 * Returns the mesh, the fine lace between the branches, as a closed shape that
 * follows the branch tips.
 */
function seaFan(rnd: Random, out: Strokes, x: number, y: number, size: number, lean: number, depth = 4): string {
  const stalk = size * 0.05;
  const sx = x + Math.sin(lean * 0.3) * stalk;
  const sy = y - stalk;
  const tips: [number, number][] = [];

  const grow = (x0: number, y0: number, angle: number, length: number, level: number, width: number) => {
    const x1 = x0 + Math.sin(angle) * length;
    const y1 = y0 - Math.cos(angle) * length;
    out.add(width, `M${r1(x0)} ${r1(y0)}L${r1(x1)} ${r1(y1)}`);
    if (level <= 0) {
      tips.push([x1, y1]);
      return;
    }
    for (const side of [-1, 1]) {
      const next = angle + side * rnd.range(0.1, 0.3) + angle * 0.1;
      grow(x1, y1, next, length * rnd.range(0.7, 0.84), level - 1, Math.max(0.9, width * 0.7));
    }
  };

  const width = Math.max(2, size * 0.028);
  out.add(width * 1.4, `M${r1(x)} ${r1(y)}L${r1(sx)} ${r1(sy)}`);
  const primaries = rnd.int(5, 6);
  const scale = depth >= 5 ? 0.2 : depth === 4 ? 0.25 : 0.32;
  for (let i = 0; i < primaries; i++) {
    const t = i / (primaries - 1) - 0.5;
    const angle = t * 2.1 + lean * 0.25 + rnd.range(-0.06, 0.06);
    grow(sx, sy, angle, size * scale * rnd.range(0.9, 1.1), depth, width);
  }

  // The mesh: for each slice of the fan, reach out to the farthest branch tip.
  const bins = 14;
  const reach = new Array<number>(bins).fill(0);
  const binOf = (a: number) => Math.min(bins - 1, Math.max(0, Math.floor(((a + 1.45) / 2.9) * bins)));
  for (const [tx, ty] of tips) {
    const a = Math.atan2(tx - sx, sy - ty);
    const b = binOf(a);
    reach[b] = Math.max(reach[b], Math.hypot(tx - sx, ty - sy));
  }
  let d = `M${r1(sx)} ${r1(sy)}`;
  for (let i = 0; i < bins; i++) {
    const near = [reach[i - 1] ?? 0, reach[i], reach[i + 1] ?? 0].filter(Boolean);
    if (!near.length) continue;
    const dist = (near.reduce((sum, v) => sum + v, 0) / near.length) * 0.94;
    const a = -1.45 + ((i + 0.5) / bins) * 2.9;
    d += `L${r1(sx + Math.sin(a) * dist)} ${r1(sy - Math.cos(a) * dist)}`;
  }
  return `${d}Z`;
}

/** A sea rod or sea plume: a few tall, wavering stems. */
function seaRod(rnd: Random, out: Strokes, x: number, y: number, size: number) {
  const stems = rnd.int(3, 5);
  for (let s = 0; s < stems; s++) {
    let px = x + rnd.range(-4, 4);
    let py = y;
    let angle = rnd.range(-0.45, 0.45);
    const segments = rnd.int(5, 7);
    const seg = (size / segments) * rnd.range(0.75, 1.05);
    let width = Math.max(1.5, size * 0.03);
    for (let i = 0; i < segments; i++) {
      angle += rnd.range(-0.22, 0.22);
      const nx = px + Math.sin(angle) * seg;
      const ny = py - Math.cos(angle) * seg;
      out.add(width, `M${r1(px)} ${r1(py)}L${r1(nx)} ${r1(ny)}`);
      if (i > 1 && rnd.next() < 0.45) {
        const side = angle + rnd.sign() * rnd.range(0.4, 0.8);
        const len = seg * rnd.range(0.6, 1.2);
        out.add(width * 0.8, `M${r1(nx)} ${r1(ny)}L${r1(nx + Math.sin(side) * len)} ${r1(ny - Math.cos(side) * len)}`);
      }
      px = nx;
      py = ny;
      width = Math.max(1.2, width * 0.9);
    }
  }
}

/** A barrel sponge: a vase, wider at the rim. */
function barrelSponge(rnd: Random, x: number, y: number, size: number) {
  const h = size * rnd.range(0.38, 0.55);
  const top = size * rnd.range(0.22, 0.3);
  const foot = top * rnd.range(0.6, 0.75);
  const lip = h * 0.12;
  // Sides bulge out, then tuck in under a rolled rim.
  return (
    `M${r1(x - foot)} ${r1(y + 2)}` +
    `C${r1(x - top * 1.45)} ${r1(y - h * 0.35)} ${r1(x - top * 1.25)} ${r1(y - h * 0.85)} ${r1(x - top)} ${r1(y - h)}` +
    `Q${r1(x)} ${r1(y - h + lip)} ${r1(x + top)} ${r1(y - h)}` +
    `C${r1(x + top * 1.25)} ${r1(y - h * 0.85)} ${r1(x + top * 1.45)} ${r1(y - h * 0.35)} ${r1(x + foot)} ${r1(y + 2)}Z`
  );
}

/** Tube sponges: a small cluster of upright tubes. */
function tubeSponges(rnd: Random, out: Strokes, x: number, y: number, size: number) {
  const count = rnd.int(3, 5);
  for (let i = 0; i < count; i++) {
    const tx = x + (i - (count - 1) / 2) * size * 0.11 + rnd.range(-2, 2);
    const h = size * rnd.range(0.3, 0.7);
    const lean = rnd.range(-0.18, 0.18);
    out.add(size * rnd.range(0.07, 0.1), `M${r1(tx)} ${r1(y + 2)}L${r1(tx + lean * h)} ${r1(y - h)}`);
  }
}

/** Boulder or brain coral: a lumpy dome. */
function coralHead(rnd: Random, x: number, y: number, size: number) {
  const w = size * rnd.range(0.45, 0.7);
  const h = size * rnd.range(0.22, 0.34);
  const points = 9;
  let d = `M${r1(x - w)} ${r1(y + 2)}`;
  for (let i = 1; i <= points; i++) {
    const t = i / points;
    const a = Math.PI * (1 - t);
    const lump = rnd.range(0.88, 1.06);
    const px = x + Math.cos(a) * w;
    const py = y - Math.sin(a) * h * lump;
    const ca = Math.PI * (1 - (i - 0.5) / points);
    d += `Q${r1(x + Math.cos(ca) * w * 1.04)} ${r1(y - Math.sin(ca) * h * 1.12)} ${r1(px)} ${r1(py)}`;
  }
  return `${d}Z`;
}

/** Seagrass: thin blades that lean with the current. */
function seagrass(rnd: Random, out: Strokes, x: number, y: number, size: number) {
  const blades = rnd.int(7, 12);
  const current = rnd.range(0.15, 0.45);
  for (let i = 0; i < blades; i++) {
    const bx = x + rnd.range(-size * 0.25, size * 0.25);
    const h = size * rnd.range(0.35, 0.8);
    const lean = current + rnd.range(-0.25, 0.25);
    out.add(
      rnd.range(1.4, 2.4),
      `M${r1(bx)} ${r1(y + 2)}Q${r1(bx + lean * h * 0.15)} ${r1(y - h * 0.6)} ${r1(bx + lean * h * 0.55)} ${r1(y - h)}`,
    );
  }
}

/** One layer of reef across the full width. */
export function reefLayer(options: ReefOptions): ReefLayer {
  const o = options;
  const rnd = seeded(o.seed);
  const yAt = ridge(rnd, o);
  const strokes = new Strokes();
  let fill = rockPath(rnd, o, yAt);
  let mesh = "";

  const slot = o.width / o.features;
  for (let i = 0; i < o.features; i++) {
    const x = slot * (i + rnd.range(0.15, 0.85));
    const y = yAt(x) + 3;
    const inClear = o.clear && x > o.clear[0] * o.width && x < o.clear[1] * o.width;
    // Low growth only in the clear band; anything goes elsewhere.
    const size = o.scale * rnd.range(70, 130) * (inClear ? 0.45 : 1);
    const roll = rnd.next();
    if (inClear) {
      if (roll < 0.5) fill += coralHead(rnd, x, y, size);
      else seagrass(rnd, strokes, x, y, size);
    } else if (roll < 0.26) {
      mesh += seaFan(rnd, strokes, x, y, size * 1.25, rnd.range(-0.6, 0.6), o.scale < 0.75 ? 3 : 4);
    } else if (roll < 0.44) {
      seaRod(rnd, strokes, x, y, size * 1.2);
    } else if (roll < 0.58) {
      fill += barrelSponge(rnd, x, y, size);
    } else if (roll < 0.7) {
      tubeSponges(rnd, strokes, x, y, size);
    } else if (roll < 0.85) {
      fill += coralHead(rnd, x, y, size);
    } else {
      seagrass(rnd, strokes, x, y, size);
    }
  }

  return { fill, mesh, strokes: strokes.toGroups() };
}

/** A single sea fan, for a foreground accent at the edge of a section. */
export function seaFanAccent(seed: number, x: number, y: number, size: number, lean = 0): Omit<ReefLayer, "fill"> {
  const strokes = new Strokes();
  const mesh = seaFan(seeded(seed), strokes, x, y, size, lean, 5);
  return { mesh, strokes: strokes.toGroups() };
}

/** A clump of seagrass, for a foreground accent. */
export function seagrassAccent(seed: number, x: number, y: number, size: number): StrokeGroup[] {
  const strokes = new Strokes();
  const rnd = seeded(seed);
  for (let i = 0; i < 3; i++) seagrass(rnd, strokes, x + (i - 1) * size * 0.3, y, size);
  return strokes.toGroups();
}
