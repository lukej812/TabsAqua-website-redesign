"use client";

import { getImageProps } from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useFrameSequence } from "@/hooks/useFrameSequence";
import { useVideoScrub } from "@/hooks/useVideoScrub";
import { diverPose, follow, stageState } from "@/lib/motion/descent";
import {
  chooseTier,
  isSmallScreen,
  LIVE_TIERS,
  prefersReducedMotion,
  startingQuality,
  subscribeToReducedMotion,
  subscribeToSmallScreen,
  TIERS,
  type DescentTier,
  type QualityName,
} from "@/lib/motion/preferences";
import { createOceanRenderer, hexToRgb, type OceanRenderer } from "@/lib/ocean/renderer";
import type { SeekStats } from "@/lib/video/seek-coordinator";
import { pathAt, pathIndex, SHOTS, type Shot } from "@/lib/world/path";
import type { World } from "@/lib/world/world";

export type DescentMedia = {
  webm?: string;
  mp4?: string;
  mobileMp4?: string;
  poster?: string;
  mobilePoster?: string;
  framesManifest?: string;
};

type Props = {
  media: DescentMedia;
  /** NEXT_PUBLIC_USE_FRAME_SEQUENCE is on and the frames manifest exists. */
  useFrames: boolean;
  footageNote: string;
  /** The color the 2D water blends into where the descent hands off to the reef. */
  endColor: string;
  /** The illustrated surface. Shown first, and kept for the static tier. */
  art: ReactNode;
  /** The flat diver for the 2D water. The 3D world has its own diver. */
  diver: ReactNode;
};

/** The 2D water renders below screen resolution: it is soft, and phones thank us. */
const SCENE_SCALE = { small: 0.5, large: 0.66 };
const MAX_SCENE_PIXELS = 1_100_000;
/** Phones draw the 2D water at 30 fps; the scroll-linked parts still follow every frame. */
const SMALL_FRAME_MS = 1000 / 30;
/** Vertical field of view for the 3D camera. Phones are tall, so they see more. */
const FOV = { wide: 50, phone: 62 };
/** Frame-time budget for the 3D world, in ms. Over it, the governor lowers resolution. */
const BUDGET = { slow: 32, fast: 18, give_up: 55 };

const noSubscription = () => () => {};

type WorldHandle = { world: World; scale: number; base: number; resize: () => void };

/** `?renderer=world|scene|still|static|video|frames` and `?quality=high|medium|low` pick the tier and quality, for checking each version. */
function overrides(): { tier: DescentTier | null; quality: QualityName | null } {
  if (typeof window === "undefined") return { tier: null, quality: null };
  const q = new URLSearchParams(window.location.search);
  const tier = q.get("renderer") as DescentTier | null;
  const quality = q.get("quality") as QualityName | null;
  return {
    tier: tier && TIERS.includes(tier) ? tier : null,
    quality: quality && ["high", "medium", "low"].includes(quality) ? quality : null,
  };
}

/**
 * The ocean behind the journey: a sticky stage under the page content, from the
 * surface down through the reef and back up. One scroll value, smoothed like a
 * weighted camera, drives everything: the 3D camera along its path, the diver,
 * the footage time, or the 2D water.
 *
 * Everything is an enhancement. The server renders the illustrated surface and
 * all content in normal flow; scroll is never hijacked, and the stage only
 * becomes sticky once a moving tier is running.
 */
export function OceanStage({ media, useFrames, footageNote, endColor, art, diver }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLCanvasElement>(null);
  const worldCanvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const diverRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<OceanRenderer | null>(null);
  const worldRef = useRef<WorldHandle | null>(null);
  const wakeRef = useRef<() => void>(() => {});

  const [sceneFailed, setSceneFailed] = useState(false);
  const [worldFailed, setWorldFailed] = useState(false);
  const [painted, setPainted] = useState(false);
  const [near, setNear] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const [videoShown, setVideoShown] = useState(false);

  // Browser-only facts, read without a hydration mismatch. The server answers "unknown".
  const hydrated = useSyncExternalStore(noSubscription, () => true, () => false);
  const reduced = useSyncExternalStore(subscribeToReducedMotion, prefersReducedMotion, () => true);
  const small = useSyncExternalStore(subscribeToSmallScreen, isSmallScreen, () => false);

  const hasVideo = Boolean(media.webm || media.mp4);
  const hasMobileVideo = Boolean(media.mobileMp4);
  const hasFootage = hasVideo || hasMobileVideo || useFrames || Boolean(media.poster);

  let tier: DescentTier | null = null;
  const forced = hydrated ? overrides() : { tier: null, quality: null };
  if (hydrated) {
    // A forced tier never overrides reduced motion: a moving tier asked for there stays still.
    const honored = forced.tier && !(reduced && LIVE_TIERS.includes(forced.tier)) ? forced.tier : null;
    tier =
      honored ??
      chooseTier({
        hasVideo,
        hasMobileVideo,
        useFrames,
        hasPoster: Boolean(media.poster),
        worldAvailable: !worldFailed,
        sceneAvailable: !sceneFailed,
      });
  }

  // Load footage shortly before it is needed: soon after hydration, in idle time.
  useEffect(() => {
    if (!hydrated || near) return;
    const idle = typeof window.requestIdleCallback === "function";
    const handle = idle ? window.requestIdleCallback(() => setNear(true), { timeout: 1200 }) : window.setTimeout(() => setNear(true), 300);
    return () => (idle ? window.cancelIdleCallback(handle) : window.clearTimeout(handle));
  }, [hydrated, near]);

  const writeStats = useCallback((stats: Readonly<SeekStats>) => {
    const video = videoRef.current;
    if (!video) return;
    video.dataset.seeksStarted = String(stats.started);
    video.dataset.seeksSuperseded = String(stats.superseded);
    video.dataset.maxInFlight = String(stats.maxInFlight);
    video.dataset.maxQueued = String(stats.maxQueued);
  }, []);

  const wantsVideo = tier === "video" && near;
  const video = useVideoScrub(videoRef, wantsVideo, writeStats);
  const frames = useFrameSequence(framesRef, {
    manifestUrl: media.framesManifest ?? "",
    enabled: tier === "frames" && near && Boolean(media.framesManifest),
    budget: small ? 60 : 180,
  });

  // Each tier falls back to the next one down if it can't run here.
  let shown: DescentTier | null = tier;
  if ((tier === "video" && video.status === "failed") || (tier === "frames" && frames.status === "failed")) shown = "world";
  if (shown === "world" && worldFailed) shown = "scene";
  if (shown === "still" && worldFailed) shown = "static";
  if (shown === "scene" && sceneFailed) shown = "static";
  const live = shown !== null && LIVE_TIERS.includes(shown);

  const { scrubTo } = video;
  const { drawAt } = frames;

  // The 2D water: one WebGL 1 context, sized below screen resolution.
  useEffect(() => {
    const canvas = sceneRef.current;
    const stage = stageRef.current;
    if (shown !== "scene" || !canvas || !stage) return;
    const renderer = createOceanRenderer(canvas, { endColor: hexToRgb(endColor), sunX: 0.74, water: 0.66 });
    if (!renderer) {
      setSceneFailed(true);
      return;
    }
    rendererRef.current = renderer;
    const resize = () => {
      // The waterline comes from the same CSS variable the static art uses.
      const waterTop = parseFloat(getComputedStyle(stage).getPropertyValue("--water-top"));
      if (Number.isFinite(waterTop)) renderer.settings({ water: 1 - waterTop / 100 });
      const scale = isSmallScreen() ? SCENE_SCALE.small : SCENE_SCALE.large;
      let w = stage.clientWidth * scale;
      let h = stage.clientHeight * scale;
      const over = (w * h) / MAX_SCENE_PIXELS;
      if (over > 1) {
        w /= Math.sqrt(over);
        h /= Math.sqrt(over);
      }
      renderer.resize(w, h);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    const onLost = (event: Event) => {
      event.preventDefault();
      setSceneFailed(true);
    };
    canvas.addEventListener("webglcontextlost", onLost);
    wakeRef.current();
    return () => {
      observer.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      renderer.destroy();
      rendererRef.current = null;
      setPainted(false);
    };
  }, [shown, endColor]);

  // The 3D world: three.js loads only now, in idle time, never in the first paint.
  const forcedQuality = forced.quality;
  useEffect(() => {
    const canvas = worldCanvasRef.current;
    const stage = stageRef.current;
    if ((shown !== "world" && shown !== "still") || !canvas || !stage) return;
    let cancelled = false;
    let observer: ResizeObserver | null = null;
    const onLost = (event: Event) => {
      event.preventDefault();
      setWorldFailed(true);
    };

    const start = () =>
      Promise.all([import("@/lib/world/world"), import("@/lib/world/look")])
        .then(([{ createWorld }, { QUALITY }]) => {
          if (cancelled) return;
          const quality = QUALITY[forcedQuality ?? startingQuality()];
          const world = createWorld(canvas, quality);
          if (!world) {
            setWorldFailed(true);
            return;
          }
          const handle: WorldHandle = {
            world,
            scale: 1,
            base: quality.scale,
            resize: () => {
              const ratio = Math.min(window.devicePixelRatio || 1, 1.5) * handle.base * handle.scale;
              world.resize(stage.clientWidth, stage.clientHeight, ratio);
            },
          };
          worldRef.current = handle;
          handle.resize();
          observer = new ResizeObserver(handle.resize);
          observer.observe(stage);
          canvas.addEventListener("webglcontextlost", onLost);
          if (shown === "still") {
            // One frame, at the surface shot, and no motion after it.
            const phone = isSmallScreen();
            const p = pathAt(0, phone);
            world.frame({
              time: 12,
              camera: { position: p.cam, target: p.look, fov: phone ? FOV.phone : FOV.wide },
              diver: { position: p.diver, heading: p.heading, pitch: p.pitch, effort: 0.6, visible: true },
              waterline: p.waterline,
              end: 0,
              endColor: [0, 0, 0],
            });
            setPainted(true);
          } else {
            wakeRef.current();
          }
        })
        .catch(() => {
          if (!cancelled) setWorldFailed(true);
        });

    const idle = typeof window.requestIdleCallback === "function";
    const handleId = idle ? window.requestIdleCallback(start, { timeout: 800 }) : window.setTimeout(start, 120);
    return () => {
      cancelled = true;
      if (idle) window.cancelIdleCallback(handleId as number);
      else window.clearTimeout(handleId as number);
      observer?.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      worldRef.current?.world.dispose();
      worldRef.current = null;
      setPainted(false);
    };
  }, [shown, forcedQuality]);

  // The one controller: read scroll, smooth it, and draw everything from it.
  useEffect(() => {
    const stage = stageRef.current;
    const wrapper = stage?.parentElement;
    const figure = diverRef.current;
    if (!live || !stage || !wrapper) return;
    const governed = forced.tier === null && forced.quality === null;

    let frame = 0;
    let visible = true;
    let target = window.scrollY;
    let current = Number.NaN;
    let last = performance.now();
    let lastDraw = 0;
    let firstPaint = true;
    const start = performance.now();
    let shots: Shot[] = [];
    let marks: number[] = [];
    let diveTop = 0;
    let descentEnd = 0;
    let samples: number[] = [];

    // Where each shot happens, in page scroll. Measured from the live layout, so
    // the camera always meets its section, whatever the screen size or text length.
    const measure = () => {
      const vh = window.innerHeight;
      const y = window.scrollY;
      diveTop = wrapper.getBoundingClientRect().top + y;
      const reef = wrapper.querySelector("#experiences");
      descentEnd = reef ? reef.getBoundingClientRect().top + y : diveTop + wrapper.offsetHeight;
      shots = [];
      marks = [];
      for (const shot of SHOTS) {
        const el = wrapper.querySelector(shot.anchor);
        if (!el) continue;
        const mark = el.getBoundingClientRect().top + y - shot.at * vh;
        marks.push(marks.length ? Math.max(mark, marks[marks.length - 1] + 1) : mark);
        shots.push(shot);
      }
    };

    // Checked every frame, so drawing stops the moment the stage leaves the screen.
    const onScreen = () => {
      const top = diveTop - target;
      return top < window.innerHeight + 50 && top + wrapper.offsetHeight > -50;
    };

    const tick = (now: number) => {
      frame = 0;
      if (!onScreen()) return;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      current = Number.isNaN(current) ? target : follow(current, target, dt);
      const phone = isSmallScreen();
      const time = (now - start) / 1000;

      const u = pathIndex(current, marks);
      const path = shots.length > 1 ? pathAt(u, phone, shots) : pathAt(0, phone);
      // The surface and descent part, for the 2D water and the flat diver.
      const state = stageState({ scrolled: current - diveTop, height: descentEnd - diveTop, viewport: stage.offsetHeight });

      stage.dataset.progress = state.progress.toFixed(3);
      stage.dataset.path = u.toFixed(3);
      // The camera has caught up with the scroll (for tests and tooling).
      stage.toggleAttribute("data-settled", Math.abs(target - current) < 0.5);
      stage.style.setProperty("--depth", state.depth.toFixed(3));
      stage.style.setProperty("--end", state.end.toFixed(3));
      stage.style.setProperty("--scrim", path.scrim.toFixed(3));

      const handle = worldRef.current;
      if (handle) {
        handle.world.frame({
          time,
          camera: { position: path.cam, target: path.look, fov: phone ? FOV.phone : FOV.wide },
          diver: { position: path.diver, heading: path.heading, pitch: path.pitch, effort: path.effort, visible: true },
          waterline: path.waterline,
          end: 0,
          endColor: [0, 0, 0],
        });
        if (firstPaint) {
          firstPaint = false;
          setPainted(true);
        } else if (governed) {
          // The governor: keep the frame time in budget by trading resolution, and
          // hand over to the lighter 2D water if even the lowest setting is too slow.
          samples.push(dt * 1000);
          if (samples.length >= 45) {
            const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
            samples = [];
            if (avg > BUDGET.give_up && handle.scale <= 0.6) setWorldFailed(true);
            else if (avg > BUDGET.slow && handle.scale > 0.6) {
              handle.scale = Math.max(0.6, handle.scale * 0.85);
              handle.resize();
            } else if (avg < BUDGET.fast && handle.scale < 1) {
              handle.scale = Math.min(1, handle.scale * 1.1);
              handle.resize();
            }
            stage.dataset.scale = handle.scale.toFixed(2);
          }
        }
      }

      // The 2D water only shows behind the surface and descent; the reef covers it after that.
      const renderer = rendererRef.current;
      if (renderer && current < descentEnd && (!phone || now - lastDraw >= SMALL_FRAME_MS - 1)) {
        // Once the reef's edge is on screen, how far up it has come, 0 to 1.
        const edge = Math.min(1, Math.max(0, (current + stage.offsetHeight - descentEnd) / stage.offsetHeight));
        renderer.render({ time, scroll: state.depth, end: state.end + (state.end >= 1 ? edge : 0) });
        lastDraw = now;
        if (firstPaint) {
          firstPaint = false;
          setPainted(true);
        }
      }

      // Footage covers the surface to the reef, so it follows the descent's progress.
      scrubTo(state.progress);
      drawAt(state.progress);

      if (figure && shown === "scene") {
        const pose = diverPose(state, phone);
        figure.style.transform = `translate3d(${(pose.x * 100).toFixed(2)}vw, ${(pose.y * 100).toFixed(2)}vh, 0) rotate(${pose.rotate.toFixed(2)}deg) scale(${pose.scale.toFixed(3)})`;
        figure.style.opacity = pose.opacity.toFixed(3);
      }

      // The water keeps moving while it is on screen; footage only needs frames while scrolling.
      const settled = current === target;
      if (visible && !document.hidden && (renderer || handle || !settled)) frame = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (!frame && visible && !document.hidden) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    wakeRef.current = wake;
    const onScroll = () => {
      target = window.scrollY;
      wake();
    };
    const onResize = () => {
      measure();
      onScroll();
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) wake();
        else {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      },
      { rootMargin: "50px 0px" },
    );
    io.observe(wrapper);
    // Content can change height after load (fonts, images, an opened answer).
    const ro = new ResizeObserver(onResize);
    ro.observe(wrapper);

    measure();
    wake();
    document.fonts?.ready.then(onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", wake);
    // Pages restored from the back/forward cache need a fresh measurement.
    window.addEventListener("pageshow", onResize);

    return () => {
      cancelAnimationFrame(frame);
      wakeRef.current = () => {};
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("pageshow", onResize);
      delete stage.dataset.progress;
      delete stage.dataset.path;
      stage.removeAttribute("data-settled");
      stage.style.removeProperty("--depth");
      stage.style.removeProperty("--end");
      stage.style.removeProperty("--scrim");
      if (figure) {
        figure.style.transform = "";
        figure.style.opacity = "";
      }
    };
    // forced.* are stable for the page's lifetime (read from the URL).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, shown, scrubTo, drawAt]);

  const showVideo = wantsVideo && video.status !== "failed";
  const posterProps =
    media.poster && !posterFailed
      ? getImageProps({ src: media.poster, alt: "", fill: true, sizes: "100vw", unoptimized: true }).props
      : null;
  const worldTier = shown === "world" || shown === "still";

  return (
    <div
      ref={stageRef}
      className="stage"
      data-tier={shown ?? "pending"}
      data-live={live ? "" : undefined}
      data-painted={
        ((shown === "scene" || worldTier) && painted) ||
        (shown === "video" && videoShown) ||
        (shown === "frames" && frames.status === "ready")
          ? ""
          : undefined
      }
      data-footage={hasFootage ? "" : undefined}
    >
      <div className="stage__art" aria-hidden="true">
        {art}
        {posterProps && (
          <picture className="stage__poster">
            {media.mobilePoster && <source media="(max-width: 767px)" srcSet={media.mobilePoster} />}
            {/* Decorative: alt="" comes from getImageProps. */}
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <img {...posterProps} fetchPriority="high" onError={() => setPosterFailed(true)} />
          </picture>
        )}
      </div>
      {shown === "scene" && <canvas ref={sceneRef} className="stage__canvas" aria-hidden="true" />}
      {worldTier && <canvas ref={worldCanvasRef} className="stage__canvas" aria-hidden="true" />}
      {shown === "frames" && <canvas ref={framesRef} className="stage__canvas" aria-hidden="true" />}
      {showVideo && (
        <video
          ref={videoRef}
          className="stage__video"
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          tabIndex={-1}
          aria-hidden="true"
          onLoadedData={() => setVideoShown(true)}
        >
          {small && media.mobileMp4 ? (
            <source src={media.mobileMp4} type="video/mp4" />
          ) : (
            // H.264 first: in testing it seeked faster than VP9 at a smaller size, and
            // it is hardware-decoded on iPhones. WebM is the fallback. See docs/video-production.md.
            <>
              {media.mp4 && <source src={media.mp4} type="video/mp4" />}
              {media.webm && <source src={media.webm} type="video/webm" />}
            </>
          )}
        </video>
      )}
      <div className="stage__scrim" aria-hidden="true" />
      <div ref={diverRef} className="stage__diver" aria-hidden="true">
        {diver}
        <span className="bubbles">
          <span />
          <span />
          <span />
          <span />
        </span>
      </div>
      {hasFootage && (shown === "video" || shown === "frames") && <p className="stage__note">{footageNote}</p>}
    </div>
  );
}
