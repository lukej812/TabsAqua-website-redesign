import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { COMMON, litFragment, litVertex } from "./glsl";
import { srgb } from "./look";
import type { Rnd } from "./types";

type Uniforms = Record<string, THREE.IUniform>;

const v3 = (hex: string) => new THREE.Vector3(...srgb(hex));

function lit(uniforms: Uniforms, hex: string, surface = "", wrap = 0.35) {
  return new THREE.ShaderMaterial({
    uniforms: { ...uniforms, uAlbedo: { value: v3(hex) } },
    vertexShader: litVertex(),
    fragmentShader: litFragment(surface, wrap),
  });
}

/* ------------------------------------------------------------------ */
/* The diver                                                           */
/* ------------------------------------------------------------------ */

export type Diver = {
  object: THREE.Group;
  /** Advances the fin kick. `effort` is 0 (hovering) to 1 (swimming). */
  animate: (time: number, effort: number) => void;
  /** Where exhaled bubbles leave the regulator, in world space. */
  mouth: () => THREE.Vector3;
};

/**
 * A recreational diver in a dark wetsuit, black BCD, and an aluminum tank,
 * modeled from simple solids and trimmed horizontal, the way an instructor
 * swims. Forward is +z. About 1.8 m from head to fin tips.
 */
export function buildDiver(uniforms: Uniforms, options: { tank?: boolean; snorkel?: boolean } = {}): Diver {
  const { tank = true, snorkel = false } = options;
  const suit = lit(uniforms, "#1d2730", "ao = 0.85;");
  const bcd = lit(uniforms, "#15191d");
  const metal = lit(uniforms, "#6f787c", "albedo *= 0.75 + 0.3 * smoothstep(-0.2, 0.25, N.y);", 0.2);
  const finMat = lit(uniforms, "#1f4f5e");
  const glass = lit(uniforms, "#2f6d7d", "albedo += vec3(0.25) * pow(max(N.y, 0.0), 6.0);");

  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const capsule = (r: number, len: number, mat: THREE.Material) => {
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 12), mat);
    m.rotation.x = Math.PI / 2; // lie along z
    return m;
  };

  const torso = capsule(0.16, 0.5, suit);
  torso.scale.set(1.18, 1, 0.92);
  body.add(torso);
  const vest = capsule(0.175, 0.36, bcd);
  vest.scale.set(1.2, 1, 0.95);
  vest.position.set(0, 0.015, 0.06);
  body.add(vest);

  if (tank) {
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.6, 18), metal);
    cyl.rotation.x = Math.PI / 2;
    cyl.position.set(0, 0.2, -0.02);
    body.add(cyl);
    const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.08, 10), metal);
    valve.rotation.x = Math.PI / 2;
    valve.position.set(0, 0.22, 0.32);
    body.add(valve);
  }

  // Head, hood, mask, and regulator.
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.105, 16, 12), suit);
  head.position.set(0, 0.06, 0.5);
  body.add(head);
  const mask = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.07, 0.06), glass);
  mask.position.set(0, 0.03, 0.59);
  mask.rotation.x = 0.5;
  body.add(mask);
  const reg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.05, 10), bcd);
  reg.rotation.x = 0.4;
  reg.position.set(0, -0.04, 0.6);
  body.add(reg);
  if (tank) {
    const hose = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.012, 6, 16, Math.PI * 0.75), bcd);
    hose.rotation.set(0, Math.PI / 2, 0.2);
    hose.position.set(0.05, 0.1, 0.46);
    body.add(hose);
  }
  if (snorkel) {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 8), finMat);
    tube.position.set(0.09, 0.2, 0.52);
    body.add(tube);
  }

  // Arms tucked under the chest, hands together: good trim.
  for (const side of [-1, 1]) {
    const upper = capsule(0.045, 0.24, suit);
    upper.position.set(side * 0.2, -0.07, 0.3);
    upper.rotation.set(Math.PI / 2 + 0.6, 0, side * 0.35);
    body.add(upper);
    const fore = capsule(0.04, 0.22, suit);
    fore.position.set(side * 0.12, -0.17, 0.42);
    fore.rotation.set(Math.PI / 2 - 0.25, 0, -side * 0.9);
    body.add(fore);
  }

  // Legs with hips, knees, and fins, so they can kick.
  const finShape = new THREE.Shape();
  finShape.moveTo(-0.06, 0);
  finShape.lineTo(0.06, 0);
  finShape.lineTo(0.12, -0.55);
  finShape.quadraticCurveTo(0, -0.5, -0.12, -0.55);
  finShape.lineTo(-0.06, 0);
  const finGeometry = new THREE.ExtrudeGeometry(finShape, { depth: 0.012, bevelEnabled: false });
  finGeometry.rotateX(Math.PI / 2);
  const legs: { hip: THREE.Group; knee: THREE.Group; ankle: THREE.Group; phase: number }[] = [];
  for (const side of [-1, 1]) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.09, -0.02, -0.32);
    body.add(hip);
    const thigh = capsule(0.07, 0.34, suit);
    thigh.position.z = -0.2;
    hip.add(thigh);
    const knee = new THREE.Group();
    knee.position.z = -0.42;
    hip.add(knee);
    const shin = capsule(0.055, 0.32, suit);
    shin.position.z = -0.19;
    knee.add(shin);
    const ankle = new THREE.Group();
    ankle.position.z = -0.38;
    knee.add(ankle);
    const fin = new THREE.Mesh(finGeometry, finMat);
    fin.position.set(0, -0.02, 0.04);
    ankle.add(fin);
    legs.push({ hip, knee, ankle, phase: side > 0 ? 0 : Math.PI });
  }

  const mouthLocal = new THREE.Vector3(0, -0.05, 0.62);
  const mouthWorld = new THREE.Vector3();

  return {
    object: root,
    animate(time, effort) {
      // A slow flutter kick from the hips; knees and ankles follow a beat behind.
      const rate = 2.0 + effort * 1.2;
      const amp = 0.08 + effort * 0.2;
      for (const leg of legs) {
        const s = Math.sin(time * rate + leg.phase);
        leg.hip.rotation.x = 0.06 + s * amp;
        leg.knee.rotation.x = 0.12 + Math.max(0, Math.sin(time * rate + leg.phase - 0.7)) * amp * 0.8;
        leg.ankle.rotation.x = -0.05 + Math.sin(time * rate + leg.phase - 1.2) * amp * 0.9;
      }
      // A slow breath: the body rises a little on the inhale.
      body.position.y = Math.sin(time * 0.6) * 0.03;
      body.rotation.z = Math.sin(time * 0.5) * 0.03;
    },
    mouth() {
      return mouthWorld.copy(mouthLocal).applyMatrix4(body.matrixWorld);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Exhaled bubbles, rising to the surface                              */
/* ------------------------------------------------------------------ */

export type Bubbles = {
  object: THREE.Points;
  /** Steps the bubbles, and lets a breath out every few seconds from `source`. */
  update: (time: number, dt: number, source: THREE.Vector3 | null) => void;
};

export function buildBubbles(uniforms: Uniforms, rnd: Rnd, max = 90): Bubbles {
  const positions = new Float32Array(max * 3);
  const sizes = new Float32Array(max);
  const alive = new Float32Array(max);
  const speed = new Float32Array(max);
  const phase = new Float32Array(max);
  for (let i = 0; i < max; i++) positions[i * 3 + 1] = 10;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { ...uniforms, uPixelRatio: { value: 1 } },
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      uniform float uPixelRatio;
      attribute float aSize;
      varying float vDepth;
      varying float vDist;
      void main() {
        vec4 mv = viewMatrix * vec4(position, 1.0);
        vDepth = max(0.0, -position.y);
        vDist = -mv.z;
        gl_PointSize = aSize * uPixelRatio * 900.0 / max(-mv.z, 0.3);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      ${COMMON}
      varying float vDepth;
      varying float vDist;
      void main() {
        vec2 d = gl_PointCoord - 0.5;
        float r = length(d) * 2.0;
        if (r > 1.0) discard;
        // A bright rim, a clear middle, and a highlight from above.
        float rim = smoothstep(0.62, 0.92, r) * (1.0 - smoothstep(0.92, 1.0, r));
        float glint = smoothstep(0.28, 0.0, length(d - vec2(-0.14, 0.16)));
        vec3 light = uSunColor * exp(-uAbsorb * vDepth) * 0.45;
        float fade = exp(-vDist * 0.05);
        gl_FragColor = vec4(pow(light, vec3(1.0 / 2.2)), (rim * 0.85 + glint * 0.9 + 0.06) * fade);
      }
    `,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 7;

  let nextBreath = 0;
  let cursor = 0;
  return {
    object: points,
    update(time, dt, source) {
      if (source && time > nextBreath) {
        nextBreath = time + 3.2 + rnd() * 1.2;
        const n = 8 + Math.floor(rnd() * 7);
        for (let k = 0; k < n; k++) {
          const i = cursor++ % max;
          positions[i * 3] = source.x + (rnd() - 0.5) * 0.06;
          positions[i * 3 + 1] = source.y - k * 0.03;
          positions[i * 3 + 2] = source.z + (rnd() - 0.5) * 0.06;
          sizes[i] = 0.006 + rnd() * rnd() * 0.022;
          speed[i] = 0.55 + sizes[i] * 20 + rnd() * 0.2;
          phase[i] = rnd() * 6.28;
          alive[i] = 1;
        }
      }
      for (let i = 0; i < max; i++) {
        if (!alive[i]) continue;
        const y = positions[i * 3 + 1] + speed[i] * dt;
        positions[i * 3 + 1] = y;
        positions[i * 3] += Math.sin(time * 3 + phase[i]) * 0.12 * dt;
        positions[i * 3 + 2] += Math.cos(time * 2.6 + phase[i]) * 0.1 * dt;
        sizes[i] *= 1 + dt * 0.04;
        if (y > -0.05) {
          alive[i] = 0;
          positions[i * 3 + 1] = 10;
        }
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.aSize.needsUpdate = true;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Fish                                                                */
/* ------------------------------------------------------------------ */

/** A small reef fish, about 25 cm, facing +x: a deep, narrow body and a forked tail. */
function fishGeometry(): THREE.BufferGeometry {
  const body = new THREE.SphereGeometry(1, 14, 10);
  body.scale(0.13, 0.055, 0.022);
  const tail = new THREE.BufferGeometry();
  tail.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([-0.11, 0, 0, -0.2, 0.055, 0, -0.17, 0, 0, -0.11, 0, 0, -0.17, 0, 0, -0.2, -0.055, 0], 3),
  );
  tail.setAttribute("normal", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
  tail.setAttribute("uv", new THREE.Float32BufferAttribute(new Array(12).fill(0), 2));
  const dorsal = new THREE.BufferGeometry();
  dorsal.setAttribute("position", new THREE.Float32BufferAttribute([0.05, 0.045, 0, -0.07, 0.05, 0, -0.06, 0.035, 0], 3));
  dorsal.setAttribute("normal", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
  dorsal.setAttribute("uv", new THREE.Float32BufferAttribute(new Array(6).fill(0), 2));
  return mergeGeometries([body.toNonIndexed(), tail, dorsal])!;
}

type School = { center: THREE.Vector3; radius: number; count: number; speed: number; height: number };

export type Fish = {
  object: THREE.InstancedMesh;
  update: (time: number) => void;
};

export function buildFish(uniforms: Uniforms, rnd: Rnd, schools: School[], total: number): Fish {
  const material = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {
      ...uniforms,
      uAlbedo: { value: v3("#b9c4c8") },
      uStripe: { value: v3("#d6b74a") },
    },
    vertexShader: litVertex(/* glsl */ `
      // Swim: a wave travels down the body, strongest at the tail.
      float tailward = smoothstep(0.08, -0.2, pos.x);
      pos.z += sin(uTime * 9.0 + seed * 40.0 + pos.x * 18.0) * 0.035 * tailward;
    `),
    fragmentShader: litFragment(/* glsl */ `
      // Countershaded, with thin yellow stripes: a grunt or a snapper, not any one species.
      float belly = smoothstep(0.02, -0.04, vLocal.y);
      albedo = mix(uAlbedo * 0.55, uAlbedo * 1.15, belly);
      float stripes = smoothstep(0.35, 0.5, sin(vLocal.y * 160.0 + vLocal.x * 20.0)) * (1.0 - belly) * step(vSeed, 0.6);
      albedo = mix(albedo, uStripe, stripes * 0.6);
      N = normalize(N + vec3(0.0, 0.25, 0.0));
    `, 0.5, "uniform vec3 uStripe;"),
  });
  const mesh = new THREE.InstancedMesh(fishGeometry(), material, total);
  mesh.frustumCulled = false;

  type One = { school: School; angle: number; radius: number; lift: number; speed: number; size: number; wobble: number };
  const fish: One[] = [];
  const counts = schools.map((s) => s.count);
  const sum = counts.reduce((a, b) => a + b, 0);
  schools.forEach((school) => {
    const n = Math.max(1, Math.round((school.count / sum) * total));
    for (let i = 0; i < n && fish.length < total; i++) {
      fish.push({
        school,
        angle: rnd() * Math.PI * 2,
        radius: school.radius * (0.55 + rnd() * 0.6),
        lift: (rnd() - 0.5) * school.height,
        speed: school.speed * (0.9 + rnd() * 0.2),
        size: 0.75 + rnd() * 0.6,
        wobble: rnd() * 6.28,
      });
    }
  });
  mesh.count = fish.length;

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  const ahead = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const look = new THREE.Matrix4();

  return {
    object: mesh,
    update(time) {
      fish.forEach((f, i) => {
        const a = f.angle + (time * f.speed) / f.radius;
        const sway = Math.sin(time * 0.7 + f.wobble) * 0.25;
        p.set(
          f.school.center.x + Math.cos(a) * (f.radius + sway),
          f.school.center.y + f.lift + Math.sin(time * 0.5 + f.wobble) * 0.15,
          f.school.center.z + Math.sin(a) * (f.radius + sway) * 0.55,
        );
        const b = a + 0.05;
        ahead.set(
          f.school.center.x + Math.cos(b) * (f.radius + sway),
          p.y,
          f.school.center.z + Math.sin(b) * (f.radius + sway) * 0.55,
        );
        // Point the fish (+x) along its path.
        look.lookAt(ahead, p, up);
        q.setFromRotationMatrix(look).multiply(new THREE.Quaternion().setFromAxisAngle(up, -Math.PI / 2));
        s.setScalar(f.size);
        m.compose(p, q, s);
        mesh.setMatrixAt(i, m);
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

/* ------------------------------------------------------------------ */
/* The descent line and its buoy                                       */
/* ------------------------------------------------------------------ */

export function buildDescentLine(uniforms: Uniforms, x: number, z: number, floorY: number) {
  const group = new THREE.Group();
  const rope = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, -floorY, 6),
    lit(uniforms, "#d8d2bf", "albedo *= 0.8 + 0.2 * sin(vLocal.y * 60.0);", 0.6),
  );
  rope.position.set(x, floorY / 2, z);
  group.add(rope);
  const buoy = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 14), lit(uniforms, "#c8432f"));
  buoy.position.set(x, -0.05, z);
  group.add(buoy);
  const weight = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.18, 12), lit(uniforms, "#3b4247"));
  weight.position.set(x, floorY + 0.06, z);
  group.add(weight);
  return group;
}
