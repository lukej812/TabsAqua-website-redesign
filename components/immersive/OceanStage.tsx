"use client";

import { getImageProps } from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useFrameSequence } from "@/hooks/useFrameSequence";
import { useVideoScrub } from "@/hooks/useVideoScrub";
import { diverPose, follow, stageState, type StageState } from "@/lib/motion/descent";
import {
  chooseTier,
  isSmallScreen,
  prefersReducedMotion,
  subscribeToReducedMotion,
  subscribeToSmallScreen,
  type DescentTier,
} from "@/lib/motion/preferences";
import { createOceanRenderer, hexToRgb, type OceanRenderer } from "@/lib/ocean/renderer";
import type { SeekStats } from "@/lib/video/seek-coordinator";

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
  /** The color of the section after the dive, so the hand-off is seamless. */
  endColor: string;
  /** The illustrated surface. Shown first, and kept for the static tier. */
  art: ReactNode;
  /** The diver silhouette. Hidden when real footage is present. */
  diver: ReactNode;
  /** Test builds only: lets ?renderer=video|frames|scene|static pick the tier. */
  allowRendererOverride?: boolean;
};

const TIERS: readonly DescentTier[] = ["video", "frames", "scene", "static"];

/** The live water renders below screen resolution: it is soft, and phones thank us. */
const SCENE_SCALE = { small: 0.5, large: 0.66 };
const MAX_SCENE_PIXELS = 1_100_000;
/** Phones draw the water at 30 fps; the scroll-linked parts still follow every frame. */
const SMALL_FRAME_MS = 1000 / 30;

const noSubscription = () => () => {};

/**
 * The ocean behind the hero and the descent: a sticky stage that sits under
 * the page content while it scrolls past. One scroll value, smoothed like a
 * weighted camera, drives the footage time, the live water, and the diver.
 *
 * Everything is an enhancement. The server renders the illustrated surface
 * and the content in normal flow; scroll is never hijacked, and the stage only
 * becomes sticky once a moving tier is running.
 */
export function OceanStage({ media, useFrames, footageNote, endColor, art, diver, allowRendererOverride = false }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const diverRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<OceanRenderer | null>(null);
  const stateRef = useRef<StageState>({ progress: 0, depth: 0, end: 0 });

  const [sceneFailed, setSceneFailed] = useState(false);
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
  if (hydrated) {
    const forced = allowRendererOverride
      ? (new URLSearchParams(window.location.search).get("renderer") as DescentTier | null)
      : null;
    tier =
      forced && TIERS.includes(forced)
        ? forced
        : chooseTier({ hasVideo, hasMobileVideo, useFrames, sceneAvailable: !sceneFailed });
    // `reduced` is read so a change of preference re-renders; chooseTier checks it too.
    if (reduced && !forced) tier = "static";
  }

  // Load footage shortly before it is needed. The stage starts on screen, so
  // in practice this is "soon after hydration, in idle time".
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

  // If footage can't load, fall back to the live water, then to the illustration.
  let shown: DescentTier | null = tier;
  if ((tier === "video" && video.status === "failed") || (tier === "frames" && frames.status === "failed")) {
    shown = sceneFailed ? "static" : "scene";
  }
  if (shown === "scene" && sceneFailed) shown = "static";
  const live = shown !== null && shown !== "static";

  const { scrubTo } = video;
  const { drawAt } = frames;

  // The live water: one WebGL context, sized below screen resolution.
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

    return () => {
      observer.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      renderer.destroy();
      rendererRef.current = null;
      setPainted(false);
    };
  }, [shown, endColor]);

  // The one controller: read scroll, smooth it, and draw everything from it.
  useEffect(() => {
    const stage = stageRef.current;
    const wrapper = stage?.parentElement;
    const figure = diverRef.current;
    if (!live || !stage || !wrapper) return;

    let frame = 0;
    let visible = true;
    let target = 0;
    let current = Number.NaN;
    let last = performance.now();
    let lastDraw = 0;
    let firstPaint = true;
    const start = performance.now();

    const measure = () => {
      target = -wrapper.getBoundingClientRect().top;
    };

    // Checked every frame, so drawing stops the moment the stage leaves the
    // screen, without waiting for the observer's next report.
    const onScreen = () => -target < window.innerHeight + 50 && wrapper.offsetHeight - target > -50;

    const tick = (now: number) => {
      frame = 0;
      if (!onScreen()) return;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      current = Number.isNaN(current) ? target : follow(current, target, dt);
      const state = stageState({ scrolled: current, height: wrapper.offsetHeight, viewport: stage.offsetHeight });
      stateRef.current = state;
      const smallScreen = isSmallScreen();

      stage.dataset.progress = state.progress.toFixed(3);
      stage.style.setProperty("--depth", state.depth.toFixed(3));
      stage.style.setProperty("--end", state.end.toFixed(3));

      const renderer = rendererRef.current;
      if (renderer && (!smallScreen || now - lastDraw >= SMALL_FRAME_MS - 1)) {
        renderer.render({ time: (now - start) / 1000, scroll: state.depth, end: state.end });
        lastDraw = now;
        if (firstPaint) {
          firstPaint = false;
          setPainted(true);
        }
      }
      scrubTo(state.progress);
      drawAt(state.progress);

      if (figure) {
        const pose = diverPose(state, smallScreen);
        figure.style.transform = `translate3d(${(pose.x * 100).toFixed(2)}vw, ${(pose.y * 100).toFixed(2)}vh, 0) rotate(${pose.rotate.toFixed(2)}deg) scale(${pose.scale.toFixed(3)})`;
        figure.style.opacity = pose.opacity.toFixed(3);
      }

      // The water keeps moving while it is on screen; footage only needs frames while scrolling.
      const settled = current === target;
      if (visible && !document.hidden && (renderer || !settled)) frame = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (!frame && visible && !document.hidden) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    const onScroll = () => {
      measure();
      wake();
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

    measure();
    wake();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    document.addEventListener("visibilitychange", wake);
    // Pages restored from the back/forward cache need a fresh measurement.
    window.addEventListener("pageshow", onScroll);

    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("pageshow", onScroll);
      delete stage.dataset.progress;
      stage.style.removeProperty("--depth");
      stage.style.removeProperty("--end");
      if (figure) {
        figure.style.transform = "";
        figure.style.opacity = "";
      }
    };
  }, [live, scrubTo, drawAt]);

  const showVideo = wantsVideo && video.status !== "failed";
  const posterProps =
    media.poster && !posterFailed
      ? getImageProps({ src: media.poster, alt: "", fill: true, sizes: "100vw", unoptimized: true }).props
      : null;

  return (
    <div
      ref={stageRef}
      className="stage"
      data-tier={shown ?? "pending"}
      data-live={live ? "" : undefined}
      data-painted={
        (shown === "scene" && painted) ||
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
