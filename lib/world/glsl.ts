/**
 * Shader code shared by everything in the world. One light model: a single
 * sun direction, sunlight losing red first as it goes down, caustics
 * projected along the light onto whatever faces it, and the view fading into
 * the color of the water with distance. Because every material calls the same
 * functions, the reef, the diver, the fish, and the sand always agree.
 */

export const COMMON = /* glsl */ `
uniform float uTime;
uniform vec3 uCamPos;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uAbsorb;
uniform vec3 uExtinction;
uniform vec3 uWaterUp;
uniform vec3 uWaterLevel;
uniform vec3 uWaterDown;
uniform float uCausticStrength;
uniform sampler2D uCausticTex;
uniform sampler2D uNoiseTex;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// Caustics: project the point up to the surface along the light, then read two
// copies of the caustic network sliding across each other.
float caustic(vec3 p) {
  vec2 q = (p.xz - uSunDir.xz / uSunDir.y * p.y) * 0.21;
  float a = texture2D(uCausticTex, q + vec2(0.017, 0.011) * uTime).r;
  float b = texture2D(uCausticTex, q * 1.31 + vec2(-0.013, 0.019) * uTime + 0.41).r;
  return pow(min(a, b), 1.4);
}

// The water itself, looking in direction dir from the camera.
vec3 waterColor(vec3 dir) {
  float camDepth = max(0.0, -uCamPos.y);
  vec3 c = mix(uWaterLevel, uWaterUp, smoothstep(0.0, 0.85, dir.y));
  c = mix(c, uWaterDown, smoothstep(0.02, -0.75, dir.y));
  // Light scattering toward the camera from the sun's side.
  float toward = max(dot(dir, uSunDir), 0.0);
  c += uSunColor * 0.06 * pow(toward, 5.0) * exp(-camDepth * 0.06);
  return c * exp(-camDepth * 0.032);
}

// Light reaching point P with normal N, then seen through the water to the camera.
vec3 shade(vec3 albedo, vec3 P, vec3 N, float ao, float wrap) {
  float depth = max(0.0, -P.y);
  vec3 sun = uSunColor * exp(-uAbsorb * depth);
  float ndl = clamp((dot(N, uSunDir) + wrap) / (1.0 + wrap), 0.0, 1.0);
  float c = caustic(P) * uCausticStrength * exp(-depth * 0.045);
  vec3 direct = sun * ndl * (0.45 + c);
  vec3 ambient = mix(uWaterDown * 2.0, uWaterUp * 1.1, N.y * 0.5 + 0.5) * exp(-depth * 0.03) * ao;
  vec3 lit = albedo * (direct + ambient);
  vec3 V = P - uCamPos;
  float dist = length(V);
  vec3 dir = V / max(dist, 1e-3);
  // Edges facing away from the camera pick up the glow of the water behind them.
  float rim = pow(1.0 - clamp(dot(N, -dir), 0.0, 1.0), 3.0);
  lit += waterColor(dir) * rim * 0.35 * ao;
  vec3 T = exp(-uExtinction * dist);
  return lit * T + waterColor(dir) * (1.0 - T);
}

// Linear light to the screen, with a whisper of noise so deep gradients never band.
vec4 finish(vec3 linear, float alpha) {
  vec3 c = pow(max(linear, 0.0), vec3(1.0 / 2.2));
  c += (hash12(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) / 255.0;
  return vec4(c, alpha);
}
`;

/** Vertex shader for lit meshes. `displace` may move `pos` (sway, swimming) before instancing. */
export function litVertex(displace = ""): string {
  return /* glsl */ `
uniform float uTime;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vColor;
varying vec3 vLocal;
varying vec2 vUv;
varying float vSeed;

void main() {
  vec3 pos = position;
  vec3 nrm = normal;
  float seed = 0.0;
  #ifdef USE_INSTANCING
  seed = fract(instanceMatrix[3].x * 0.137 + instanceMatrix[3].z * 0.291);
  #endif
  vSeed = seed;
  ${displace}
  vec4 local = vec4(pos, 1.0);
  vec3 n = nrm;
  #ifdef USE_INSTANCING
  local = instanceMatrix * local;
  n = mat3(instanceMatrix) * n;
  #endif
  vec4 world = modelMatrix * local;
  vWorld = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * n);
  vColor = vec3(1.0);
  #ifdef USE_INSTANCING_COLOR
  vColor = instanceColor;
  #endif
  #ifdef USE_COLOR
  vColor *= color;
  #endif
  vLocal = position;
  vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;
}

/**
 * Fragment shader for lit meshes. `surface` sets `albedo` (linear), `ao`, and
 * may adjust `N` or discard; it sees vWorld, vNormal, vColor, vLocal, vUv, and
 * vSeed (0 to 1, per instance). `decls` declares any extra uniforms it reads.
 */
export function litFragment(surface: string, wrap = 0.25, decls = ""): string {
  return /* glsl */ `
${COMMON}
uniform vec3 uAlbedo;
${decls}
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vColor;
varying vec3 vLocal;
varying vec2 vUv;
varying float vSeed;

void main() {
  vec3 N = normalize(vNormal);
  if (!gl_FrontFacing) N = -N;
  vec3 albedo = uAlbedo * vColor;
  float ao = 1.0;
  ${surface}
  gl_FragColor = finish(shade(albedo, vWorld, N, ao, ${wrap.toFixed(2)}), 1.0);
}
`;
}
