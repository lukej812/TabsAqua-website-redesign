import * as THREE from "three";
import { COMMON } from "./glsl";
import type { Rnd } from "./types";

type Uniforms = Record<string, THREE.IUniform>;

/* ------------------------------------------------------------------ */
/* Open water: what you see where nothing is in the way                */
/* ------------------------------------------------------------------ */

export function buildWaterDome(uniforms: Uniforms) {
  const material = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      ${COMMON}
      varying vec3 vWorld;
      void main() {
        vec3 dir = normalize(vWorld - uCamPos);
        gl_FragColor = finish(waterColor(dir), 1.0);
      }
    `,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), material);
  mesh.renderOrder = -10;
  mesh.frustumCulled = false;
  return mesh;
}

/* ------------------------------------------------------------------ */
/* The surface from below: Snell's window, and a mirror outside it     */
/* ------------------------------------------------------------------ */

export function buildSurface(uniforms: Uniforms) {
  const geometry = new THREE.PlaneGeometry(520, 520, 1, 1);
  geometry.rotateX(Math.PI / 2); // facing down, toward the water
  const material = new THREE.ShaderMaterial({
    uniforms: { ...uniforms, uSky: { value: new THREE.Vector3(0.78, 0.9, 0.95) } },
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      ${COMMON}
      uniform vec3 uSky;
      varying vec3 vWorld;
      void main() {
        vec3 V = normalize(vWorld - uCamPos);
        vec2 q = vWorld.xz * 0.06;
        vec4 a = texture2D(uNoiseTex, q + vec2(0.011, 0.007) * uTime);
        vec4 b = texture2D(uNoiseTex, q * 2.3 - vec2(0.009, 0.014) * uTime);
        vec3 N = normalize(vec3((a.r + b.g - 1.0) * 0.55, -1.0, (a.g + b.b - 1.0) * 0.55));
        float cosI = dot(V, -N);
        // Inside the window the sky shows through; outside, the surface mirrors the deep.
        float window = smoothstep(0.6, 0.71, cosI);
        float sun = pow(max(dot(normalize(V + (V - N * cosI) * 0.15), uSunDir), 0.0), 60.0);
        vec3 sky = uSky + uSunColor * (sun * 2.5 + pow(max(dot(V, uSunDir), 0.0), 8.0) * 0.4);
        vec3 mirror = mix(uWaterDown, uWaterLevel, 0.55) * 0.8;
        float shimmer = texture2D(uCausticTex, vWorld.xz * 0.12 + uTime * 0.02).r;
        vec3 c = mix(mirror + shimmer * 0.05, sky, window);
        float dist = length(vWorld - uCamPos);
        vec3 T = exp(-uExtinction * dist * 0.9);
        gl_FragColor = finish(c * T + waterColor(V) * (1.0 - T), 1.0);
      }
    `,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  return mesh;
}

/* ------------------------------------------------------------------ */
/* Light shafts: soft ribbons of sunlight, hanging from the surface    */
/* ------------------------------------------------------------------ */

export function buildLightShafts(uniforms: Uniforms, rnd: Rnd, count: number) {
  const tops: number[] = [];
  const params: number[] = [];
  const corners: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i < count; i++) {
    const x = -30 + rnd() * 60;
    const z = -20 + rnd() * 200;
    const width = 0.8 + rnd() * rnd() * 4.5;
    const length = 14 + rnd() * 20;
    const phase = rnd() * 100;
    // Most shafts are faint; a few carry the light.
    const strength = 0.15 + Math.pow(rnd(), 2.2) * 0.85;
    for (const [u, v] of [
      [-0.5, 0],
      [0.5, 0],
      [-0.5, 1],
      [0.5, 1],
    ]) {
      tops.push(x, 0, z);
      params.push(width, length, phase, strength);
      corners.push(u, v);
    }
    const a = i * 4;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(tops, 3));
  geometry.setAttribute("aParams", new THREE.Float32BufferAttribute(params, 4));
  geometry.setAttribute("aCorner", new THREE.Float32BufferAttribute(corners, 2));
  geometry.setIndex(indices);

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      uniform vec3 uCamPos;
      uniform vec3 uSunDir;
      attribute vec4 aParams;
      attribute vec2 aCorner;
      varying vec2 vCorner;
      varying vec3 vWorld;
      varying vec4 vParams;
      void main() {
        vec3 axis = -uSunDir;
        vec3 top = position;
        vec3 mid = top + axis * aParams.y * 0.5;
        // Turn the ribbon around its own axis to face the camera.
        vec3 side = normalize(cross(axis, normalize(uCamPos - mid)));
        vec3 p = top + axis * aCorner.y * aParams.y + side * aCorner.x * aParams.x;
        vCorner = aCorner;
        vWorld = p;
        vParams = aParams;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      ${COMMON}
      varying vec2 vCorner;
      varying vec3 vWorld;
      varying vec4 vParams;
      void main() {
        float across = 1.0 - abs(vCorner.x) * 2.0;
        float profile = pow(across, 2.2);
        // Brightest just under the surface, thinning out with depth, never perfectly even.
        float along = smoothstep(0.0, 0.06, vCorner.y) * pow(1.0 - vCorner.y, 2.2);
        along *= 0.55 + 0.9 * texture2D(uNoiseTex, vec2(vCorner.y * 0.6 + vParams.z, vParams.z * 0.37 + uTime * 0.01)).r;
        float flicker = 0.5 + 0.5 * sin(uTime * 0.31 + vParams.z) * sin(uTime * 0.19 + vParams.z * 1.7);
        float depth = max(0.0, -vWorld.y);
        vec3 light = uSunColor * exp(-uAbsorb * depth) * 0.034 * vParams.w;
        float dist = length(vWorld - uCamPos);
        // Fade very close (the camera is inside the beam) and far (lost in the blue).
        float fade = smoothstep(1.5, 7.0, dist) * exp(-dist * 0.055);
        vec3 c = light * profile * along * flicker * fade;
        gl_FragColor = vec4(pow(c, vec3(1.0 / 2.2)) * 0.9, 1.0);
      }
    `,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 5;
  return mesh;
}

/* ------------------------------------------------------------------ */
/* Suspended particles, wrapped around the camera                      */
/* ------------------------------------------------------------------ */

export function buildParticles(uniforms: Uniforms, rnd: Rnd, count: number) {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = rnd() * 36;
    positions[i * 3 + 1] = rnd() * 22;
    positions[i * 3 + 2] = rnd() * 36;
    sizes[i] = 0.4 + rnd() * rnd() * 1.6;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { ...uniforms, uPixelRatio: { value: 1 } },
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uCamPos;
      uniform float uPixelRatio;
      attribute float aSize;
      varying float vAlpha;
      varying float vDepth;
      void main() {
        vec3 box = vec3(36.0, 22.0, 36.0);
        vec3 drift = vec3(0.05, 0.035, 0.03) * uTime;
        vec3 p = mod(position + drift - uCamPos + box * 0.5, box) - box * 0.5 + uCamPos;
        vec4 mv = viewMatrix * vec4(p, 1.0);
        float dist = -mv.z;
        vDepth = max(0.0, -p.y);
        vAlpha = smoothstep(0.4, 2.0, dist) * (1.0 - smoothstep(10.0, 17.0, dist)) * step(p.y, -0.1);
        gl_PointSize = aSize * uPixelRatio * 26.0 / max(dist, 0.5);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uSunColor;
      uniform vec3 uAbsorb;
      varying float vAlpha;
      varying float vDepth;
      void main() {
        vec2 d = gl_PointCoord - 0.5;
        float r = length(d);
        float a = smoothstep(0.5, 0.1, r) * vAlpha * 0.55;
        vec3 c = uSunColor * exp(-uAbsorb * vDepth) * 0.32;
        gl_FragColor = vec4(pow(c, vec3(1.0 / 2.2)), a);
      }
    `,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 6;
  return points;
}

/* ------------------------------------------------------------------ */
/* Above the waterline, and the last touches on the whole frame        */
/* ------------------------------------------------------------------ */

/**
 * A full-screen pass drawn last. Above the waterline it paints the sky, sun,
 * and distant sea (the same drawing as the 2D water scene); below it, it only
 * adds a soft vignette and the hand-off color at the end of the stage.
 */
export function buildSkyPass(uniforms: Uniforms) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const material = new THREE.ShaderMaterial({
    uniforms: {
      ...uniforms,
      uRes: { value: new THREE.Vector2(1, 1) },
      uWaterline: { value: 2 },
      uHorizon: { value: 0.045 },
      uSunX: { value: 0.74 },
      uEnd: { value: 0 },
      uEndColor: { value: new THREE.Vector3(0, 0, 0) },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    vertexShader: /* glsl */ `
      void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec2 uRes;
      uniform float uWaterline;
      uniform float uHorizon;
      uniform float uSunX;
      uniform float uEnd;
      uniform vec3 uEndColor;

      float hash(vec2 p) { p = fract(p * vec2(234.34, 435.345)); p += dot(p, p + 34.23); return fract(p.x * p.y); }
      float noise(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / uRes;
        float aspect = uRes.x / uRes.y;
        float x = uv.x * aspect;
        float t = uTime;
        float line = uWaterline + 0.010 * sin(x * 6.0 + t * 0.9) + 0.005 * sin(x * 15.0 - t * 1.35) + 0.0025 * sin(x * 33.0 + t * 2.1);
        float sunX = uSunX * aspect;
        float sunDx = abs(x - sunX);
        vec2 v = (uv - 0.5) * vec2(1.0, 0.85);
        float vignette = clamp(dot(v, v) * 0.42, 0.0, 0.5);

        if (uv.y > line) {
          float horizon = uWaterline + uHorizon;
          vec3 col;
          if (uv.y < horizon) {
            float k = (uv.y - line) / max(horizon - line, 0.001);
            col = mix(vec3(0.106, 0.420, 0.580), vec3(0.290, 0.584, 0.725), k);
            vec2 g = vec2(x, uv.y) * vec2(260.0, 420.0);
            vec2 gc = floor(g);
            float sparkle = step(0.9, hash(gc + floor(t * 6.0 + hash(gc) * 6.0)));
            sparkle *= smoothstep(0.5, 0.1, length(fract(g) - 0.5));
            float path = exp(-sunDx * 3.6);
            col += vec3(1.0, 0.97, 0.88) * sparkle * path * 0.85 + vec3(0.9, 0.95, 1.0) * path * 0.12;
          } else {
            float h = clamp((uv.y - horizon) / max(1.0 - horizon, 0.2), 0.0, 1.0);
            col = mix(vec3(0.851, 0.929, 0.949), vec3(0.475, 0.718, 0.839), smoothstep(0.0, 0.3, h));
            col = mix(col, vec3(0.110, 0.353, 0.541), smoothstep(0.25, 1.0, h));
            vec2 sun = vec2(sunX, horizon + (1.0 - (uWaterline + uHorizon)) * 0.42);
            float d = distance(vec2(x, uv.y), sun);
            col += vec3(1.0, 0.95, 0.84) * (0.4 * exp(-d * 7.5) + 0.85 * smoothstep(0.03, 0.021, d));
            float cloud = noise(vec2(x * 3.0 + t * 0.01, uv.y * 14.0)) * noise(vec2(x * 7.0 - t * 0.015, uv.y * 30.0));
            col = mix(col, vec3(0.95, 0.97, 0.99), smoothstep(0.32, 0.6, cloud) * (1.0 - smoothstep(0.05, 0.3, h)) * 0.6);
          }
          col += vec3(0.85, 0.97, 1.0) * exp(-abs(uv.y - line) * 420.0) * 0.65;
          col *= 1.0 - vignette;
          gl_FragColor = vec4(col, 1.0);
          return;
        }
        // Below the waterline: the meniscus, the vignette, and the hand-off.
        float men = exp(-abs(uv.y - line) * 420.0) * 0.65;
        float e = uEnd * smoothstep(0.6, 0.0, uv.y);
        float a = 1.0 - (1.0 - e) * (1.0 - vignette);
        vec3 c = (uEndColor * e * (1.0 - vignette)) / max(a, 1e-3);
        a = max(a, men);
        c = mix(c, vec3(0.85, 0.97, 1.0), men / max(a, 1e-3));
        gl_FragColor = vec4(c, a);
      }
    `,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 100;
  return mesh;
}
