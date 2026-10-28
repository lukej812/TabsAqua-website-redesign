/**
 * The water scene behind the hero and the descent, as one fragment shader.
 *
 * The camera starts half in, half out of the water ("over-under"): sky and sun
 * above a moving waterline, turquoise water below. Scrolling sinks the camera,
 * so the waterline rises out of frame, the water darkens, the light rays thin
 * out, and suspended particles drift past. Everything is drawn from math, so
 * there are no image files to download.
 *
 * Kept deliberately small: no textures, one full-screen triangle, a handful of
 * noise calls per pixel, rendered below screen resolution (the water is soft).
 */

export const VERTEX_SHADER = /* glsl */ `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uRes;       // drawing buffer size, in pixels
uniform float uTime;     // seconds, wrapped
uniform float uScroll;   // how far the camera has sunk, in screen heights
uniform float uEnd;      // 0 to 1: blend the bottom into uEndColor; 1 to 2: the reef's edge is (uEnd - 1) up the frame
uniform vec3 uEndColor;  // the color of the section that follows the stage
uniform float uSunX;     // sun position, 0 to 1 across the width
uniform float uWater;    // waterline height at rest, 0 (bottom) to 1 (top)

float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

// Distance to the nearest cell edge of a moving Voronoi grid: the bright
// network of light you see on the underside of the surface.
float causticEdge(vec2 p, float t) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float d1 = 8.0;
  float d2 = 8.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 g = vec2(float(x), float(y));
      vec2 o = vec2(hash(i + g), hash(i + g + 17.17));
      o = 0.5 + 0.42 * sin(t + 6.2831 * o);
      vec2 r = g + o - f;
      float d = dot(r, r);
      if (d < d1) { d2 = d1; d1 = d; }
      else if (d < d2) { d2 = d; }
    }
  }
  return sqrt(d2) - sqrt(d1);
}

vec3 waterColor(float z) {
  // z: distance below the surface, in screen heights.
  vec3 c = vec3(0.373, 0.765, 0.808);                                   // #5fc3ce
  c = mix(c, vec3(0.165, 0.576, 0.678), smoothstep(0.0, 0.24, z));     // #2a93ad
  c = mix(c, vec3(0.090, 0.416, 0.576), smoothstep(0.18, 0.6, z));     // #176a93
  c = mix(c, vec3(0.055, 0.290, 0.447), smoothstep(0.55, 1.3, z));     // #0e4a72
  c = mix(c, vec3(0.039, 0.212, 0.345), smoothstep(1.4, 2.5, z));      // #0a3658
  c = mix(c, vec3(0.027, 0.165, 0.278), smoothstep(2.4, 3.6, z));      // #072a47
  return c;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  float x = uv.x * aspect;
  float t = uTime;

  float water = uWater + uScroll * 0.62;
  // The waterline: three slow swells, so it never looks mechanical.
  float swell = 0.010 * sin(x * 6.0 + t * 0.9)
              + 0.005 * sin(x * 15.0 - t * 1.35)
              + 0.0025 * sin(x * 33.0 + t * 2.1);
  float line = water + swell;
  float sunX = uSunX * aspect;
  float sunDx = abs(x - sunX);

  vec3 col;

  if (uv.y > line) {
    // Above the water: distant sea up to the horizon, then sky and sun.
    float horizon = water + 0.045;
    if (uv.y < horizon) {
      float k = (uv.y - line) / max(horizon - line, 0.001);
      col = mix(vec3(0.106, 0.420, 0.580), vec3(0.290, 0.584, 0.725), k);
      // Sun glitter on the far water, densest under the sun.
      vec2 g = vec2(x, uv.y) * vec2(260.0, 420.0);
      vec2 gc = floor(g);
      float sparkle = step(0.9, hash(gc + floor(t * 6.0 + hash(gc) * 6.0)));
      sparkle *= smoothstep(0.5, 0.1, length(fract(g) - 0.5));
      float path = exp(-sunDx * 3.6);
      col += vec3(1.0, 0.97, 0.88) * sparkle * path * 0.85;
      col += vec3(0.9, 0.95, 1.0) * path * 0.12;
    } else {
      float h = clamp((uv.y - horizon) / max(1.0 - horizon, 0.2), 0.0, 1.0);
      col = mix(vec3(0.851, 0.929, 0.949), vec3(0.475, 0.718, 0.839), smoothstep(0.0, 0.3, h));
      col = mix(col, vec3(0.110, 0.353, 0.541), smoothstep(0.25, 1.0, h));
      // The sun sits a fixed share of the way up the sky at rest, and rises with the horizon.
      vec2 sun = vec2(sunX, horizon + (0.955 - uWater) * 0.42);
      float d = distance(vec2(x, uv.y), sun);
      col += vec3(1.0, 0.95, 0.84) * (0.4 * exp(-d * 7.5) + 0.85 * smoothstep(0.03, 0.021, d));
      // A few soft clouds low on the horizon.
      float cloud = noise(vec2(x * 3.0 + t * 0.01, uv.y * 14.0)) * noise(vec2(x * 7.0 - t * 0.015, uv.y * 30.0));
      col = mix(col, vec3(0.95, 0.97, 0.99), smoothstep(0.32, 0.6, cloud) * (1.0 - smoothstep(0.05, 0.3, h)) * 0.6);
    }
  } else {
    float z = water - uv.y;
    col = waterColor(z);
    // Brighter on the sun's side.
    col += vec3(0.05, 0.09, 0.09) * exp(-sunDx * 1.4) * exp(-z * 1.2);

    // The underside of the surface, seen almost edge on.
    float under = line - uv.y;
    float band = 1.0 - smoothstep(0.0, 0.11, under);
    if (band > 0.0) {
      float e = causticEdge(vec2(x * 7.0, under * 70.0 + t * 0.15), t * 0.8);
      float net = 1.0 - smoothstep(0.0, 0.16, e);
      col = mix(col, vec3(0.62, 0.89, 0.89), band * band * 0.5);
      col += vec3(0.75, 0.95, 0.93) * net * band * band * 0.28;
    }

    // Light rays fanning down from the sun's side, swaying slowly.
    vec2 src = vec2(sunX - 0.25, water + 0.9);
    float angle = atan(x - src.x, src.y - uv.y);
    float rays = noise(vec2(angle * 16.0, t * 0.09)) * noise(vec2(angle * 37.0 + 4.0, t * 0.14 + 2.0));
    rays = smoothstep(0.15, 0.65, rays);
    col += vec3(0.6, 0.85, 0.87) * rays * exp(-z * 1.3) * 0.22;

    // Suspended particles, drifting up past the sinking camera.
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float cells = 16.0 + fi * 11.0;
      vec2 q = vec2(x, uv.y) * cells;
      q.y -= uScroll * cells * (0.55 + fi * 0.35) + t * (0.12 + fi * 0.06);
      q.x += sin(q.y * 0.15 + fi * 7.0 + t * 0.3) * 0.3;
      vec2 cell = floor(q);
      float pick = hash(cell + fi * 31.0);
      if (pick > 0.8) {
        vec2 o = vec2(hash(cell + 3.1), hash(cell + 7.7)) - 0.5;
        float d = length(fract(q) - 0.5 - o * 0.7);
        float size = 0.035 + 0.05 * hash(cell + 9.9) * (1.0 - fi * 0.25);
        float a = smoothstep(size, size * 0.15, d) * (0.1 + 0.12 * fi) * exp(-z * 0.3);
        col += vec3(0.8, 0.93, 0.95) * a;
      }
    }
  }

  // Meniscus: the bright edge where the water meets the lens.
  col += vec3(0.85, 0.97, 1.0) * exp(-abs(uv.y - line) * 420.0) * 0.65;

  // Soft vignette, and the hand-off to the next section's color.
  vec2 v = (uv - 0.5) * vec2(1.0, 0.85);
  col *= 1.0 - 0.22 * dot(v, v) * 2.0;
  // The hand-off to the reef: the bottom of the frame first, then everything
  // below the reef's edge as it rises, so the edge always meets the same color.
  float handoff = min(uEnd, 1.0) * smoothstep(0.6, 0.0, uv.y);
  float edge = uEnd - 1.0;
  if (edge > 0.0) handoff = max(handoff, smoothstep(edge + 0.3, edge, uv.y));
  col = mix(col, uEndColor, handoff);

  // Dither so the deep gradients never band.
  col += (hash(gl_FragCoord.xy + fract(t)) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}
`;
