import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { litFragment, litVertex } from "./glsl";
import { srgb } from "./look";
import type { Noise } from "./noise";
import { floorHeight, RIGHT } from "./terrain";
import type { Rnd } from "./types";

type Uniforms = Record<string, THREE.IUniform>;

/**
 * The reef, built the way Florida's patch reefs look: low rock mounds
 * encrusted with boulder and brain corals, barrel and tube sponges, and
 * carpeted with gorgonians (sea rods, sea plumes, and flat sea fans facing the
 * current). Everything is generated from a seed; nothing here is a photo or a
 * scan of a real site.
 */

const v3 = (hex: string) => new THREE.Vector3(...srgb(hex));
const color = (hex: string) => new THREE.Color(...srgb(hex));

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

type Mound = { x: number; z: number; rx: number; rz: number; h: number; rot: number; base: number };

/** Mounds along the right of the path (screen right), a sparser line far left, and an outcrop at the start. */
function layoutMounds(noise: Noise, rnd: Rnd): Mound[] {
  const raw: { side: number; z: number; size: number }[] = [];
  for (let z = 24; z < 114; z += 3 + rnd() * 3) {
    raw.push({ side: 6 + rnd() * 9, z, size: 1 });
    if (rnd() < 0.7) raw.push({ side: 15 + rnd() * 14, z: z + rnd() * 2, size: 1.2 });
    if (rnd() < 0.5) raw.push({ side: -14 - rnd() * 14, z: z + rnd() * 3, size: 0.9 });
  }
  // Close to the camera's line, so the reef passes near.
  for (const z of [45, 60, 73, 88, 102]) raw.push({ side: 4.4 + rnd(), z, size: 0.55 });
  // The outcrop in front of the surface view.
  raw.push({ side: 8, z: 16, size: 1.3 }, { side: 11.5, z: 20.5, size: 0.9 }, { side: 5.6, z: 22, size: 0.6 });
  raw.push({ side: -10, z: 18, size: 0.7 }, { side: -16, z: 25, size: 0.9 });

  return raw.map(({ side, z, size }) => {
    const x = side * RIGHT;
    const rx = (1.6 + rnd() * 2.4) * size;
    const rz = (1.4 + rnd() * 2) * size;
    // Seat the mound on the lowest sand under it, so no edge hangs in the water.
    let low = Infinity;
    for (let a = 0; a < 8; a++) {
      const t = (a / 8) * Math.PI * 2;
      low = Math.min(low, floorHeight(noise, x + Math.cos(t) * rx * 0.9, z + Math.sin(t) * rz * 0.9));
    }
    return { x, z, rx, rz, h: (0.7 + rnd() * 0.9) * size, rot: rnd() * Math.PI, base: Math.min(low, floorHeight(noise, x, z)) - 0.15 };
  });
}

/** Height of a mound's top at (x, z), or -Infinity outside it. Matches the rock geometry's dome. */
function moundTop(m: Mound, x: number, z: number): number {
  const c = Math.cos(m.rot);
  const s = Math.sin(m.rot);
  const dx = x - m.x;
  const dz = z - m.z;
  const u = (dx * c - dz * s) / m.rx;
  const v = (dx * s + dz * c) / m.rz;
  const d = u * u + v * v;
  if (d >= 1) return -Infinity;
  return m.base + m.h * Math.pow(1 - d, 0.6);
}

/* ------------------------------------------------------------------ */
/* Shapes                                                              */
/* ------------------------------------------------------------------ */

/** A rock mound: a low dome with an uneven crust, sunk into the sand. Unit size; scaled per mound. */
function moundGeometry(noise: Noise, seed: number): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(1, 4);
  const p = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    const r = Math.min(1, Math.hypot(v.x, v.z));
    const top = Math.pow(Math.max(0, 1 - r * r), 0.6);
    const bump = noise.fbm3(v.x * 2.2 + seed, v.y * 2.2, v.z * 2.2, 4) * 0.16;
    // Below the dome the rock flares out and down into the sand, so the edge is buried.
    const flare = v.y > 0 ? 1 + bump * 0.6 : 1.12 + bump * 0.4;
    const y = v.y > 0 ? top + bump : -0.9 + v.y * 0.4 + bump * 0.5;
    p.setXYZ(i, v.x * flare, y, v.z * flare);
  }
  g.computeVertexNormals();
  return g;
}

/** A boulder or brain coral head: a lumpy dome. */
function coralHeadGeometry(noise: Noise, seed: number): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(1, 3);
  const p = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    let r = 1 + noise.fbm3(v.x * 1.6 + seed, v.y * 1.6, v.z * 1.6, 3) * 0.2;
    r += noise.fbm3(v.x * 6 + seed, v.y * 6, v.z * 6, 2) * 0.05;
    v.multiplyScalar(r);
    v.y = v.y < 0 ? v.y * 0.2 : v.y * 0.75;
    p.setXYZ(i, v.x, v.y + 0.08, v.z);
  }
  g.computeVertexNormals();
  return g;
}

/** A barrel sponge: a vase that flares to a wide rim, hollow in the middle. */
function barrelGeometry(): THREE.BufferGeometry {
  const profile = [
    [0.3, 0],
    [0.42, 0.15],
    [0.55, 0.45],
    [0.66, 0.8],
    [0.71, 1.0],
    [0.65, 1.05],
    [0.57, 1.0],
    [0.48, 0.72],
    [0.3, 0.42],
    [0.05, 0.35],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(profile, 40);
  g.computeVertexNormals();
  return g;
}

/** A cluster of tube sponges: upright, hollow fingers of different heights. */
function tubeClusterGeometry(rnd: Rnd): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const count = 3 + Math.floor(rnd() * 4);
  for (let i = 0; i < count; i++) {
    const h = 0.45 + rnd() * 0.8;
    const r = 0.06 + rnd() * 0.04;
    const profile = [
      [r * 0.9, 0],
      [r, h * 0.5],
      [r * 1.2, h],
      [r * 0.85, h * 0.98],
      [r * 0.7, h * 0.6],
    ].map(([a, b]) => new THREE.Vector2(a, b));
    const tube = new THREE.LatheGeometry(profile, 12);
    const angle = (i / count) * Math.PI * 2 + rnd();
    const dist = i === 0 ? 0 : 0.11 + rnd() * 0.1;
    tube.rotateZ((rnd() - 0.5) * 0.3);
    tube.translate(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
    parts.push(tube);
  }
  const g = mergeGeometries(parts)!;
  g.computeVertexNormals();
  return g;
}

/**
 * Gorgonians, drawn once to a canvas atlas of four tall cells: a sparse sea
 * rod, a feathery sea plume, a bushy gorgonian, and a second sea rod. White
 * on transparent; color comes from each instance.
 */
function gorgonianAtlas(rnd: Rnd): THREE.CanvasTexture {
  const cw = 256;
  const ch = 512;
  const canvas = document.createElement("canvas");
  canvas.width = cw * 4;
  canvas.height = ch;
  const ctx = canvas.getContext("2d")!;
  ctx.strokeStyle = "#fff";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const stroke = (pts: [number, number][], w0: number, w1: number) => {
    for (let i = 1; i < pts.length; i++) {
      ctx.lineWidth = w0 + (w1 - w0) * (i / pts.length);
      ctx.beginPath();
      ctx.moveTo(pts[i - 1][0], pts[i - 1][1]);
      ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    }
  };

  const stem = (x: number, y: number, angle: number, len: number, wobble: number) => {
    const pts: [number, number][] = [[x, y]];
    let a = angle;
    const n = 14;
    for (let i = 0; i < n; i++) {
      a += (rnd() - 0.5) * wobble;
      x += Math.sin(a) * (len / n);
      y -= Math.cos(a) * (len / n);
      pts.push([x, y]);
    }
    return pts;
  };

  for (let cell = 0; cell < 4; cell++) {
    ctx.save();
    ctx.translate(cell * cw, 0);
    const bx = cw / 2;
    const by = ch - 6;
    if (cell === 0 || cell === 3) {
      // Sea rods: a few long, wavering stems with short side branches.
      const stems = cell === 0 ? 6 : 8;
      for (let s = 0; s < stems; s++) {
        const pts = stem(bx + (rnd() - 0.5) * 20, by, (s / (stems - 1) - 0.5) * 0.9, 300 + rnd() * 170, 0.22);
        stroke(pts, 7, 3);
        for (let k = 3; k < pts.length - 2; k += 2) {
          if (rnd() < 0.5) continue;
          const side = rnd() < 0.5 ? -1 : 1;
          stroke(stem(pts[k][0], pts[k][1], side * (0.5 + rnd() * 0.4), 40 + rnd() * 50, 0.2), 3.5, 2);
        }
      }
    } else if (cell === 1) {
      // Sea plumes: stems lined with fine, feathery branchlets.
      for (let s = 0; s < 5; s++) {
        const pts = stem(bx + (rnd() - 0.5) * 24, by, (s / 4 - 0.5) * 0.8, 340 + rnd() * 140, 0.16);
        stroke(pts, 6, 2.5);
        for (let k = 2; k < pts.length; k++) {
          for (const side of [-1, 1]) {
            const len = 22 + (1 - k / pts.length) * 30 + rnd() * 10;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(pts[k][0], pts[k][1]);
            ctx.lineTo(pts[k][0] + side * len * 0.8, pts[k][1] - len * 0.6);
            ctx.stroke();
          }
        }
      }
    } else {
      // A bushy gorgonian: dense forking from a short trunk.
      const grow = (x: number, y: number, a: number, len: number, w: number, depth: number) => {
        const nx = x + Math.sin(a) * len;
        const ny = y - Math.cos(a) * len;
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(nx, ny);
        ctx.stroke();
        if (depth === 0) return;
        for (const side of [-1, 1]) grow(nx, ny, a * 0.85 + side * (0.18 + rnd() * 0.3), len * (0.74 + rnd() * 0.12), Math.max(1.2, w * 0.72), depth - 1);
      };
      grow(bx, by, 0, 70, 9, 7);
    }
    ctx.restore();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** The lace of a sea fan: branching veins and a fine mesh between them. */
function seaFanTexture(rnd: Rnd): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.strokeStyle = "#fff";
  ctx.lineCap = "round";
  const tips: [number, number][] = [];
  const grow = (x: number, y: number, a: number, len: number, w: number, depth: number) => {
    const nx = x + Math.sin(a) * len;
    const ny = y - Math.cos(a) * len;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(nx, ny);
    ctx.stroke();
    if (depth === 0) {
      tips.push([nx, ny]);
      return;
    }
    for (const side of [-1, 1]) {
      grow(nx, ny, a + side * (0.12 + rnd() * 0.22) + a * 0.06, len * (0.72 + rnd() * 0.1), Math.max(0.8, w * 0.72), depth - 1);
    }
  };
  for (let i = 0; i < 6; i++) grow(size / 2, size - 6, (i / 5 - 0.5) * 2 + (rnd() - 0.5) * 0.1, 34, 5, 5);
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 0.9;
  for (let i = 0; i < tips.length; i++) {
    for (let j = i + 1; j < Math.min(tips.length, i + 4); j++) {
      ctx.beginPath();
      ctx.moveTo(size / 2 + (tips[i][0] - size / 2) * 0.6, size - 6 + (tips[i][1] - size + 6) * 0.6);
      ctx.lineTo(tips[j][0], tips[j][1]);
      ctx.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

/** Two crossed cards, like an X seen from above: reads as a 3D bush from any side. */
function crossedCards(width: number, height: number): THREE.BufferGeometry {
  const a = new THREE.PlaneGeometry(width, height, 1, 4);
  a.translate(0, height / 2, 0);
  const b = a.clone();
  b.rotateY(Math.PI / 2);
  return mergeGeometries([a, b])!;
}

/* ------------------------------------------------------------------ */
/* Assembly                                                            */
/* ------------------------------------------------------------------ */

type Placed = { x: number; y: number; z: number; sx: number; sy: number; sz: number; rot: number; tilt: number; tint: THREE.Color };

function instanced(geometry: THREE.BufferGeometry, material: THREE.Material, items: Placed[]) {
  const mesh = new THREE.InstancedMesh(geometry, material, Math.max(1, items.length));
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  items.forEach((it, i) => {
    e.set(Math.sin(it.rot * 3) * it.tilt, it.rot, Math.cos(it.rot * 5) * it.tilt);
    q.setFromEuler(e);
    m.compose(p.set(it.x, it.y, it.z), q, s.set(it.sx, it.sy, it.sz));
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, it.tint);
  });
  mesh.count = items.length;
  mesh.frustumCulled = false;
  return mesh;
}

export function buildReef(noise: Noise, uniforms: Uniforms, rnd: Rnd): THREE.Object3D {
  const group = new THREE.Group();
  const mounds = layoutMounds(noise, rnd);
  const pick = <T,>(list: T[]) => list[Math.floor(rnd() * list.length)];

  const rockTints = ["#7d7258", "#6e6a52", "#7a6a5e", "#857a5c"].map(color);
  const coralTints = ["#b3a073", "#9c8a5c", "#a89c6c", "#8f8a6a", "#a68fa0", "#b39a62"].map(color);
  const barrelTints = ["#9a6650", "#8a5c4a", "#a07058"].map(color);
  const tubeTints = ["#86709a", "#c0a548", "#927aa2", "#b89a48", "#7e6a8e"].map(color);
  const gorgoTints = ["#7d5a6a", "#8a6a50", "#6c5070", "#9a7a5a", "#7a4f7e", "#8e6c42"].map(color);
  const fanTints = ["#8a5aa0", "#9a68aa", "#a8844c", "#7a508e"].map(color);

  const rocks: Placed[][] = [[], [], []];
  const corals: Placed[][] = [[], [], []];
  const barrels: Placed[] = [];
  const tubes: Placed[][] = [[], []];
  const gorgonians: Placed[] = [];
  const fans: Placed[] = [];

  const topAt = (x: number, z: number) => {
    let y = floorHeight(noise, x, z);
    for (const m of mounds) y = Math.max(y, moundTop(m, x, z));
    return y;
  };

  for (const m of mounds) {
    rocks[Math.floor(rnd() * 3)].push({ x: m.x, y: m.base, z: m.z, sx: m.rx, sy: m.h, sz: m.rz, rot: m.rot, tilt: 0, tint: pick(rockTints) });
    const area = m.rx * m.rz;
    const count = Math.round(area * 4.2);
    for (let k = 0; k < count; k++) {
      // A random spot on the mound (and a little beyond its edge, on the sand).
      const a = rnd() * Math.PI * 2;
      const r = Math.sqrt(rnd()) * 1.12;
      const lx = Math.cos(a) * r * m.rx;
      const lz = Math.sin(a) * r * m.rz;
      const x = m.x + lx * Math.cos(m.rot) + lz * Math.sin(m.rot);
      const z = m.z - lx * Math.sin(m.rot) + lz * Math.cos(m.rot);
      // Keep a clear lane for the camera.
      if (Math.abs(x) < 2.4 && z > 10) continue;
      const y = topAt(x, z) - 0.04;
      const roll = rnd();
      const rot = rnd() * Math.PI * 2;
      if (roll < 0.52) {
        const s = 0.7 + rnd() * 0.9;
        gorgonians.push({ x, y, z, sx: s, sy: s * (0.8 + rnd() * 0.5), sz: s, rot, tilt: 0.12, tint: pick(gorgoTints) });
      } else if (roll < 0.72) {
        const s = 0.22 + rnd() * rnd() * 0.75;
        corals[Math.floor(rnd() * 3)].push({ x, y: y - 0.05, z, sx: s, sy: s, sz: s, rot, tilt: 0.15, tint: pick(coralTints) });
      } else if (roll < 0.81) {
        const s = 0.6 + rnd() * 0.5;
        tubes[Math.floor(rnd() * 2)].push({ x, y, z, sx: s, sy: s, sz: s, rot, tilt: 0.1, tint: pick(tubeTints) });
      } else if (roll < 0.85) {
        const s = 0.4 + rnd() * 0.45;
        barrels.push({ x, y: y - 0.08, z, sx: s, sy: s * (0.9 + rnd() * 0.3), sz: s, rot, tilt: 0.12, tint: pick(barrelTints) });
      } else {
        // Sea fans grow broadside to the current, so most face the path.
        const s = 0.8 + rnd() * 0.9;
        fans.push({ x, y: y - 0.05, z, sx: s, sy: s, sz: s, rot: (rnd() - 0.5) * 0.8, tilt: 0.05, tint: pick(fanTints) });
      }
    }
  }
  // A few gorgonians and small heads out on the sand between mounds.
  for (let k = 0; k < 120; k++) {
    const side = (rnd() < 0.7 ? 3 + rnd() * 26 : -(8 + rnd() * 22)) * RIGHT;
    const z = 12 + rnd() * 104;
    if (Math.abs(side) < 2.4) continue;
    const y = topAt(side, z) - 0.04;
    const s = 0.5 + rnd() * 0.7;
    if (rnd() < 0.6) gorgonians.push({ x: side, y, z, sx: s, sy: s, sz: s, rot: rnd() * 6.28, tilt: 0.1, tint: pick(gorgoTints) });
    else corals[0].push({ x: side, y: y - 0.05, z, sx: s * 0.4, sy: s * 0.4, sz: s * 0.4, rot: rnd() * 6.28, tilt: 0.1, tint: pick(coralTints) });
  }

  // Rock: crusty, mottled with algae and encrusting life, darker toward the sand.
  const rockMaterial = new THREE.ShaderMaterial({
    uniforms: { ...uniforms, uAlbedo: { value: v3("#ffffff") } },
    vertexShader: litVertex(),
    fragmentShader: litFragment(/* glsl */ `
      vec4 a = texture2D(uNoiseTex, vWorld.xz * 0.21 + vWorld.y * 0.13);
      vec4 b = texture2D(uNoiseTex, vWorld.xz * 0.9 - vWorld.y * 0.4);
      vec3 algae = vec3(0.16, 0.17, 0.07);
      vec3 coralline = vec3(0.32, 0.17, 0.22);
      albedo *= 0.75 + 0.5 * b.r;
      albedo = mix(albedo, algae, smoothstep(0.55, 0.75, a.g) * 0.6);
      albedo = mix(albedo, coralline, smoothstep(0.62, 0.8, a.b) * 0.5);
      N = normalize(N + vec3(b.g - 0.5, (b.a - 0.5) * 0.5, b.b - 0.5) * 0.9);
      // Sand drifts up against the base of the rock.
      float buried = 1.0 - smoothstep(-0.05, 0.22, vLocal.y + (b.r - 0.5) * 0.2);
      albedo = mix(albedo, vec3(0.62, 0.57, 0.44), buried * 0.85);
      N = normalize(mix(N, vec3(0.0, 1.0, 0.0), buried * 0.6));
      ao = smoothstep(-0.25, 0.6, vLocal.y) * 0.5 + 0.5;
    `, 0.3),
  });
  const rockGeometries = [5, 17, 29].map((s) => moundGeometry(noise, s));
  rocks.forEach((items, i) => group.add(instanced(rockGeometries[i], rockMaterial, items)));

  const coralMaterial = new THREE.ShaderMaterial({
    uniforms: { ...uniforms, uAlbedo: { value: v3("#ffffff") } },
    vertexShader: litVertex(),
    fragmentShader: litFragment(/* glsl */ `
      // Brain-coral meanders on some heads, pitted star coral on others.
      vec4 nz = texture2D(uNoiseTex, vLocal.xz * 0.5 + vLocal.y * 0.25 + vSeed * 7.0);
      float groove = sin((nz.r + nz.g * 0.7) * 52.0);
      float pits = smoothstep(0.55, 0.75, texture2D(uNoiseTex, vLocal.xz * 3.3 + vLocal.y).r);
      float brain = step(0.5, vSeed);
      albedo *= mix(0.85 - pits * 0.3, 0.8 + 0.2 * groove, brain);
      N = normalize(N + vec3(nz.g - 0.5, 0.0, nz.b - 0.5) * 0.5 + vec3(groove, 0.0, groove) * 0.08 * brain);
      ao = smoothstep(-0.05, 0.5, vLocal.y) * 0.55 + 0.45;
    `),
  });
  const coralGeometries = [11, 23, 37].map((s) => coralHeadGeometry(noise, s));
  corals.forEach((items, i) => group.add(instanced(coralGeometries[i], coralMaterial, items)));

  const spongeMaterial = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { ...uniforms, uAlbedo: { value: v3("#ffffff") } },
    vertexShader: litVertex(),
    fragmentShader: litFragment(/* glsl */ `
      float angle = atan(vLocal.z, vLocal.x);
      float ridges = sin(angle * 26.0 + sin(vLocal.y * 9.0) * 0.6);
      albedo *= 0.82 + 0.22 * ridges;
      float inside = gl_FrontFacing ? 1.0 : 0.4;
      ao = inside * (0.55 + 0.45 * smoothstep(0.0, 0.7, vLocal.y));
    `),
  });
  group.add(instanced(barrelGeometry(), spongeMaterial, barrels));
  const tubeGeometries = [tubeClusterGeometry(rnd), tubeClusterGeometry(rnd)];
  tubes.forEach((items, i) => group.add(instanced(tubeGeometries[i], spongeMaterial, items)));

  // Gorgonians and fans bend with the surge: more at the tips, never in step.
  const sway = /* glsl */ `
    float h = max(pos.y, 0.0);
    float surge = sin(uTime * 0.75 + seed * 6.28) * 0.08 + sin(uTime * 1.7 + seed * 3.1) * 0.025;
    pos.z += h * h * surge;
    pos.x += h * h * surge * 0.35;
  `;
  const gorgonianMaterial = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { ...uniforms, uAlbedo: { value: v3("#ffffff") }, uAtlas: { value: gorgonianAtlas(rnd) } },
    vertexShader: litVertex(sway),
    fragmentShader: litFragment(
      /* glsl */ `
      float cell = floor(vSeed * 3.999);
      vec4 lace = texture2D(uAtlas, vec2((cell + vUv.x) * 0.25, vUv.y));
      if (lace.a < 0.45) discard;
      albedo *= 0.7 + 0.45 * vUv.y;
      // Thin branches let light through: soften the normal toward the light.
      N = normalize(mix(N, vec3(0.0, 1.0, 0.0), 0.35));
      ao = 0.6 + 0.4 * vUv.y;
    `,
      0.7,
      "uniform sampler2D uAtlas;",
    ),
  });
  group.add(instanced(crossedCards(0.8, 1.6), gorgonianMaterial, gorgonians));

  const fanGeometry = new THREE.PlaneGeometry(1.5, 1.15, 4, 4);
  fanGeometry.translate(0, 0.575, 0);
  const fanMaterial = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { ...uniforms, uAlbedo: { value: v3("#ffffff") }, uFanTex: { value: seaFanTexture(rnd) } },
    vertexShader: litVertex(sway),
    fragmentShader: litFragment(
      /* glsl */ `
      vec4 lace = texture2D(uFanTex, vUv);
      if (lace.a < 0.4) discard;
      albedo *= 0.7 + 0.5 * lace.r;
      ao = 0.65 + 0.35 * vUv.y;
    `,
      0.6,
      "uniform sampler2D uFanTex;",
    ),
  });
  group.add(instanced(fanGeometry, fanMaterial, fans));

  return group;
}
