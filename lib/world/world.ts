import * as THREE from "three";
import { seeded } from "../art/random";
import { buildBubbles, buildDescentLine, buildDiver, buildFish } from "./creatures";
import { LOOK, type Quality } from "./look";
import { causticPixels, makeNoise, noisePixels } from "./noise";
import { LINE, SNORKELERS } from "./places";
import { buildReef } from "./reef";
import { buildFloor, buildSeagrass, floorHeight, floorSlope } from "./terrain";
import { buildLightShafts, buildParticles, buildSkyPass, buildSurface, buildWaterDome } from "./water";

export type Vec3 = readonly [number, number, number];

/** Everything one frame needs to know. The page's scroll controller fills this in. */
export type WorldFrame = {
  time: number;
  camera: { position: Vec3; target: Vec3; fov: number };
  diver: { position: Vec3; heading: number; pitch: number; effort: number; visible: boolean };
  /** Screen height of the waterline, 0 (bottom) to 1 (top). Above 1.1 the sky is gone. */
  waterline: number;
  /** 0 to 1: blend the bottom of the frame into `endColor` (an sRGB triple, 0 to 1). */
  end: number;
  endColor: Vec3;
};

export type World = {
  resize: (width: number, height: number, pixelRatio: number) => void;
  frame: (frame: WorldFrame) => void;
  dispose: () => void;
  /** Draw calls and triangles in the last frame, for tests and tuning. */
  stats: () => { calls: number; triangles: number };
};

const SEED = 20261027;

function dataTexture(pixels: Uint8Array, size: number) {
  const t = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.colorSpace = THREE.NoColorSpace;
  t.needsUpdate = true;
  return t;
}

/**
 * Builds the underwater world into a canvas. Returns null when WebGL 2 is not
 * available, so the page can fall back to the 2D water or the still drawing.
 */
export function createWorld(canvas: HTMLCanvasElement, quality: Quality): World | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: quality.name === "high",
      alpha: false,
      powerPreference: "default",
      stencil: false,
    });
  } catch {
    return null;
  }
  if (!renderer.capabilities.isWebGL2) {
    renderer.dispose();
    return null;
  }
  // Every shader writes display-ready color itself (see finish() in glsl.ts).
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearColor(0x0a3656, 1);

  const rand = seeded(SEED);
  const rnd = () => rand.next();
  const noise = makeNoise(SEED);

  const noiseSize = 128;
  const noisePx = noisePixels(noiseSize, SEED + 7);
  const uniforms: Record<string, THREE.IUniform> = {
    uTime: { value: 0 },
    uCamPos: { value: new THREE.Vector3() },
    uSunDir: { value: new THREE.Vector3(...LOOK.sunDir) },
    uSunColor: { value: new THREE.Vector3(...LOOK.sunColor) },
    uAbsorb: { value: new THREE.Vector3(...LOOK.absorb) },
    uExtinction: { value: new THREE.Vector3(...LOOK.extinction) },
    uWaterUp: { value: new THREE.Vector3(...LOOK.waterUp) },
    uWaterLevel: { value: new THREE.Vector3(...LOOK.waterLevel) },
    uWaterDown: { value: new THREE.Vector3(...LOOK.waterDown) },
    uCausticStrength: { value: LOOK.caustics },
    uCausticTex: { value: dataTexture(causticPixels(256, 7, seeded(SEED + 3)), 256) },
    uNoiseTex: { value: dataTexture(noisePx, noiseSize) },
  };

  // The same seagrass mask the floor shader paints, read on the CPU to plant blades.
  const noiseAlpha = (x: number, z: number) => {
    const u = (((x * 0.031) % 1) + 1) % 1;
    const v = (((z * 0.031) % 1) + 1) % 1;
    const px = Math.floor(u * noiseSize);
    const py = Math.floor(v * noiseSize);
    return noisePx[(py * noiseSize + px) * 4 + 3] / 255;
  };
  const grassMask = (x: number, z: number) => {
    const rock = Math.min(1, Math.max(0, (floorSlope(noise, x, z) - 0.12) / 0.18));
    const a = noiseAlpha(x, z);
    return Math.min(1, Math.max(0, (a - 0.6) / 0.1)) * (1 - rock);
  };

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 400);

  const dome = buildWaterDome(uniforms);
  scene.add(dome);
  const surface = buildSurface(uniforms);
  scene.add(surface);
  scene.add(buildFloor(noise, quality.floorSegments, uniforms));
  scene.add(buildSeagrass(noise, quality.grassBlades, uniforms, rnd, grassMask));
  scene.add(buildReef(noise, uniforms, rnd, quality.reef));
  scene.add(buildDescentLine(uniforms, LINE.x, LINE.z, floorHeight(noise, LINE.x, LINE.z)));

  const diver = buildDiver(uniforms);
  scene.add(diver.object);
  // Two snorkelers floating at the surface over the reef, seen from below.
  const snorkelers = [buildDiver(uniforms, { tank: false, snorkel: true }), buildDiver(uniforms, { tank: false, snorkel: true })];
  snorkelers.forEach((s, i) => {
    const [x, y, z] = SNORKELERS[i].at;
    s.object.position.set(x, y, z);
    s.object.rotation.y = SNORKELERS[i].heading;
  });
  snorkelers.forEach((s) => scene.add(s.object));

  const bubbles = buildBubbles(uniforms, rnd);
  scene.add(bubbles.object);

  const fish = buildFish(
    uniforms,
    rnd,
    [
      { center: new THREE.Vector3(-3.5, -2.6, 20), radius: 6, count: 30, speed: 0.7, height: 1.4 },
      { center: new THREE.Vector3(-9, -5.6, 50), radius: 3.6, count: 40, speed: 0.6, height: 1.6 },
      { center: new THREE.Vector3(5, -5.2, 79), radius: 4.2, count: 35, speed: 0.5, height: 1.5 },
      { center: new THREE.Vector3(-7, -3.4, 131), radius: 3.2, count: 25, speed: 0.5, height: 1.2 },
    ],
    quality.fish,
  );
  scene.add(fish.object);

  scene.add(buildLightShafts(uniforms, rnd, quality.name === "low" ? 34 : 52));
  const particles = buildParticles(uniforms, rnd, quality.particles);
  scene.add(particles);

  const sky = buildSkyPass(uniforms);
  scene.add(sky);
  const skyUniforms = (sky.material as THREE.ShaderMaterial).uniforms;

  const target = new THREE.Vector3();
  let lastTime = 0;

  return {
    resize(width, height, pixelRatio) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      const size = renderer.getDrawingBufferSize(new THREE.Vector2());
      skyUniforms.uRes.value.copy(size);
      (particles.material as THREE.ShaderMaterial).uniforms.uPixelRatio.value = pixelRatio;
      (bubbles.object.material as THREE.ShaderMaterial).uniforms.uPixelRatio.value = pixelRatio * (height / 900);
    },
    frame(f) {
      const dt = Math.min(0.1, Math.max(0, f.time - lastTime));
      lastTime = f.time;
      uniforms.uTime.value = f.time;
      camera.position.set(...f.camera.position);
      target.set(...f.camera.target);
      camera.lookAt(target);
      if (camera.fov !== f.camera.fov) {
        camera.fov = f.camera.fov;
        camera.updateProjectionMatrix();
      }
      uniforms.uCamPos.value.copy(camera.position);
      dome.position.copy(camera.position);
      surface.position.set(camera.position.x, 0, camera.position.z);

      diver.object.visible = f.diver.visible;
      diver.object.position.set(...f.diver.position);
      diver.object.rotation.set(f.diver.pitch, f.diver.heading, 0, "YXZ");
      diver.animate(f.time, f.diver.effort);
      snorkelers.forEach((s, i) => s.animate(f.time + i * 1.3, 0.3));
      scene.updateMatrixWorld();
      bubbles.update(f.time, dt, f.diver.visible ? diver.mouth() : null);
      fish.update(f.time);

      skyUniforms.uWaterline.value = f.waterline;
      skyUniforms.uEnd.value = f.end;
      skyUniforms.uEndColor.value.set(...f.endColor);
      renderer.render(scene, camera);
    },
    dispose() {
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose();
        const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
        mats.forEach((m) => {
          Object.values((m as THREE.ShaderMaterial).uniforms ?? {}).forEach((u) => (u.value as THREE.Texture)?.isTexture && u.value.dispose());
          m.dispose();
        });
      });
      renderer.dispose();
      renderer.forceContextLoss();
    },
    stats() {
      return { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles };
    },
  };
}
