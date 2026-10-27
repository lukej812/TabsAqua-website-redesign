import * as THREE from "three";
import { litFragment, litVertex } from "./glsl";
import { srgb } from "./look";
import type { Noise } from "./noise";

/**
 * The shape of the seafloor. The camera travels along +z: open sand under the
 * surface, a gentle slope down to the reef, a deeper sand channel where the
 * descent line hangs, then the floor falls away as the camera rises to the surface.
 */
export const WORLD = {
  /** Path length, meters. */
  zMin: -30,
  zMax: 190,
  xMin: -70,
  xMax: 70,
} as const;

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Depth of the sand before features, by distance along the path. */
function baseDepth(z: number): number {
  let y = -6.2;
  y += (-8.2 - -6.2) * smooth(14, 40, z);
  y += (-10.8 - -8.2) * smooth(92, 118, z);
  y += (-12.5 - -10.8) * smooth(128, 160, z);
  return y;
}

/**
 * The camera looks down +z, so the right of the screen is -x. Layout code
 * thinks in "screen right" (`side`) and converts here and in reef.ts.
 */
export const RIGHT = -1;

/** How steep the floor is at (x, z), 0 flat to 1 vertical. Matches the floor shader's rock test. */
export function floorSlope(noise: Noise, x: number, z: number): number {
  const e = 0.5;
  const dx = floorHeight(noise, x + e, z) - floorHeight(noise, x - e, z);
  const dz = floorHeight(noise, x, z + e) - floorHeight(noise, x, z - e);
  return 1 - 1 / Math.sqrt(1 + (dx * dx + dz * dz) / (4 * e * e));
}

export function floorHeight(noise: Noise, x: number, z: number): number {
  const side = x * RIGHT;
  let y = baseDepth(z);
  y += noise.fbm2(x * 0.045, z * 0.045, 3) * 0.7;
  y += noise.fbm2(x * 0.21, z * 0.21, 2) * 0.12;
  // The reef ridge: a rocky rise on the right of the path, and a lower one far left.
  const reefZone = smooth(22, 36, z) * (1 - smooth(96, 112, z));
  const right = smooth(4, 10, side) * (1 - smooth(26, 40, side));
  const left = smooth(-11, -17, side) * (1 - smooth(-30, -42, side));
  y += reefZone * (right * (1.4 + noise.fbm2(x * 0.12, z * 0.12, 3) * 1.1) + left * 0.9);
  // A low rock patch under the outcrop in front of the surface view.
  y += Math.exp(-((side - 8.5) ** 2 + (z - 17.5) ** 2) / 22) * 0.9;
  return y;
}

/** The sand: ripples, a little color drift, and darker patches where seagrass grows. */
export function buildFloor(noise: Noise, segments: number, uniforms: Record<string, THREE.IUniform>) {
  const width = WORLD.xMax - WORLD.xMin;
  const depth = WORLD.zMax - WORLD.zMin;
  const geometry = new THREE.PlaneGeometry(width, depth, segments, Math.round((segments * depth) / width));
  geometry.rotateX(-Math.PI / 2);
  geometry.translate((WORLD.xMin + WORLD.xMax) / 2, 0, (WORLD.zMin + WORLD.zMax) / 2);
  const pos = geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, floorHeight(noise, pos.getX(i), pos.getZ(i)));
  }
  geometry.computeVertexNormals();

  const material = new THREE.ShaderMaterial({
    uniforms: {
      ...uniforms,
      uAlbedo: { value: new THREE.Vector3(...srgb("#d9cdb2")) },
      uRock: { value: new THREE.Vector3(...srgb("#8c7b62")) },
      uGrass: { value: new THREE.Vector3(...srgb("#5d6b3a")) },
    },
    vertexShader: litVertex(),
    fragmentShader: litFragment(
      /* glsl */ `
      vec4 nz = texture2D(uNoiseTex, vWorld.xz * 0.031);
      vec4 fine = texture2D(uNoiseTex, vWorld.xz * 0.19 + 0.3);
      // Sand ripples, running across the current, bent by noise.
      float phase = vWorld.x * 0.35 + vWorld.z * 1.9 + (nz.r - 0.5) * 9.0;
      float ripple = sin(phase);
      N = normalize(N + vec3(0.0, 0.0, cos(phase) * 0.22) + vec3(fine.g - 0.5, 0.0, fine.b - 0.5) * 0.25);
      albedo = uAlbedo * (0.86 + 0.14 * ripple * 0.5 + (nz.g - 0.5) * 0.25);
      // Rubble and rock showing through where the floor is steep, on the reef ridge.
      float rock = smoothstep(0.12, 0.3, 1.0 - normalize(vNormal).y);
      albedo = mix(albedo, uRock * (0.75 + fine.r * 0.5), rock * 0.8);
      // Seagrass beds: darker, greener patches.
      float grass = smoothstep(0.58, 0.68, nz.a) * (1.0 - rock);
      albedo = mix(albedo, uGrass * (0.7 + fine.a * 0.4), grass);
      ao = 1.0 - grass * 0.35 - rock * 0.15;
      `,
      0.3,
      "uniform vec3 uRock; uniform vec3 uGrass;",
    ),
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  return mesh;
}

/** Seagrass blades in the darker patches: thin, bent, swaying with the surge. */
export function buildSeagrass(
  noise: Noise,
  count: number,
  uniforms: Record<string, THREE.IUniform>,
  rnd: () => number,
  grassMask: (x: number, z: number) => number,
) {
  // One blade: a narrow strip that tapers to a point, 4 segments tall.
  const segs = 4;
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const w = 0.022 * (1 - t * 0.85);
    positions.push(-w, t, 0, w, t, 0);
    normals.push(0, 0, 1, 0, 0, 1);
    uvs.push(0, t, 1, t);
    if (i < segs) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  const material = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { ...uniforms, uAlbedo: { value: new THREE.Vector3(...srgb("#6f8a3e")) } },
    vertexShader: litVertex(/* glsl */ `
      float h = pos.y * pos.y;
      float surge = sin(uTime * 0.9 + seed * 6.28 + position.y) * 0.18 + sin(uTime * 2.1 + seed * 11.0) * 0.04;
      pos.z += h * (surge + 0.25);
      pos.x += h * 0.08 * sin(uTime * 0.7 + seed * 3.0);
    `),
    fragmentShader: litFragment(/* glsl */ `
      albedo *= mix(0.55, 1.1, vUv.y) * (0.85 + vSeed * 0.3);
      ao = mix(0.6, 1.0, vUv.y);
    `, 0.6),
  });

  const mesh = new THREE.InstancedMesh(geometry, material, count);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  let placed = 0;
  let tries = 0;
  while (placed < count && tries < count * 30) {
    tries++;
    const x = WORLD.xMin + 10 + rnd() * (WORLD.xMax - WORLD.xMin - 20);
    const z = -10 + rnd() * 170;
    if (grassMask(x, z) < 0.5 || rnd() > grassMask(x, z)) continue;
    p.set(x, floorHeight(noise, x, z) - 0.05, z);
    q.setFromAxisAngle(up, rnd() * Math.PI * 2);
    const height = 0.35 + rnd() * 0.55;
    s.set(1, height, 1);
    m.compose(p, q, s);
    mesh.setMatrixAt(placed++, m);
  }
  mesh.count = placed;
  mesh.frustumCulled = false;
  return mesh;
}
