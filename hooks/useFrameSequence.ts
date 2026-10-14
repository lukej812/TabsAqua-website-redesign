"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { frameIndexAt } from "@/lib/motion/descent";

/** Written by scripts/prepare-video.sh next to the frames. */
export type FrameManifest = {
  count: number;
  width: number;
  height: number;
  /** printf-style path with one %d or %04d, for example "/video/frames/frame-%04d.webp". */
  pattern: string;
};

export type FrameSequenceStatus = "idle" | "loading" | "ready" | "failed";

type Options = {
  manifestUrl: string;
  enabled: boolean;
  /** Most frames to load. Phones use fewer, spread evenly across the clip. */
  budget: number;
};

const MAX_DPR = 1.5;
const CONCURRENCY = 4;

function frameUrl(pattern: string, index: number): string {
  return pattern.replace(/%0?(\d*)d/, (_match, width: string) =>
    String(index + 1).padStart(Number(width) || 0, "0"),
  );
}

const idle: (callback: () => void) => number =
  typeof window !== "undefined" && "requestIdleCallback" in window
    ? (callback) => window.requestIdleCallback(callback, { timeout: 500 })
    : (callback) => window.setTimeout(callback, 50);

const cancelIdle: (handle: number) => void =
  typeof window !== "undefined" && "cancelIdleCallback" in window
    ? (handle) => window.cancelIdleCallback(handle)
    : (handle) => window.clearTimeout(handle);

/**
 * Optional fallback renderer: draws an image sequence to one canvas.
 *
 * Loads the first frame at once, then frames nearest the current position
 * first, with distant ones deferred to idle time. Draws the nearest frame that
 * has decoded, so fast scrolling never shows a blank canvas. Caps canvas
 * resolution at 1.5x and releases every image when it unmounts.
 */
export function useFrameSequence(canvasRef: RefObject<HTMLCanvasElement | null>, options: Options) {
  const { manifestUrl, enabled, budget } = options;
  const [status, setStatus] = useState<FrameSequenceStatus>("idle");
  const drawRef = useRef<(progress: number) => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!enabled || !canvas) return;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      setStatus("failed");
      return;
    }

    let cancelled = false;
    let manifest: FrameManifest | null = null;
    // Which source frames we load, spread evenly when over budget.
    let picks: number[] = [];
    let images: (HTMLImageElement | null)[] = [];
    let state: ("empty" | "loading" | "ready")[] = [];
    let target = 0;
    let drawn = -1;
    let active = 0;
    let idleHandle: number | null = null;
    let lastProgress = 0;

    setStatus("loading");

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      drawn = -1;
      draw(lastProgress);
    };

    const nearestReady = (index: number): number => {
      for (let step = 0; step < picks.length; step++) {
        if (state[index - step] === "ready") return index - step;
        if (state[index + step] === "ready") return index + step;
      }
      return -1;
    };

    const paint = (slot: number) => {
      const image = images[slot];
      if (!image || !manifest) return;
      // Cover-fit, like object-fit: cover.
      const scale = Math.max(canvas.width / manifest.width, canvas.height / manifest.height);
      const w = manifest.width * scale;
      const h = manifest.height * scale;
      context.drawImage(image, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      drawn = slot;
      canvas.dataset.frame = String(picks[slot]);
    };

    const draw = (progress: number) => {
      lastProgress = progress;
      if (!picks.length) return;
      target = frameIndexAt(progress, picks.length);
      const slot = nearestReady(target);
      if (slot >= 0 && slot !== drawn) paint(slot);
      pump();
    };

    const load = (slot: number) => {
      if (!manifest || state[slot] !== "empty") return;
      state[slot] = "loading";
      active++;
      const image = new Image();
      image.decoding = "async";
      image.src = frameUrl(manifest.pattern, picks[slot]);
      images[slot] = image;
      image
        .decode()
        .then(() => {
          if (cancelled) return;
          state[slot] = "ready";
          if (slot === 0) setStatus("ready");
          // Repaint if this frame is closer to where we are than what is shown.
          if (drawn < 0 || Math.abs(slot - target) < Math.abs(drawn - target)) paint(slot);
        })
        .catch(() => {
          if (cancelled) return;
          state[slot] = "empty";
          images[slot] = null;
          if (slot === 0) setStatus("failed");
        })
        .finally(() => {
          active--;
          if (!cancelled) pump();
        });
    };

    // Nearest frames load now; the rest wait for idle time.
    const pump = () => {
      if (cancelled || !picks.length) return;
      for (let step = 0; step < picks.length && active < CONCURRENCY; step++) {
        const near = step <= 6;
        for (const slot of [target + step, target - step]) {
          if (slot < 0 || slot >= picks.length || state[slot] !== "empty") continue;
          if (near) load(slot);
          else if (idleHandle === null) {
            idleHandle = idle(() => {
              idleHandle = null;
              load(slot);
            });
          }
          if (active >= CONCURRENCY) break;
        }
      }
    };

    drawRef.current = draw;

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    fetch(manifestUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`Frames manifest: ${response.status}`);
        return response.json() as Promise<FrameManifest>;
      })
      .then((data) => {
        if (cancelled) return;
        manifest = data;
        const count = Math.max(0, Math.floor(data.count));
        const take = Math.min(count, Math.max(2, budget));
        picks = Array.from({ length: take }, (_, i) => Math.round((i * (count - 1)) / Math.max(1, take - 1)));
        images = new Array(take).fill(null);
        state = new Array(take).fill("empty");
        resize();
        load(0);
        pump();
      })
      .catch(() => {
        if (!cancelled) setStatus("failed");
      });

    return () => {
      cancelled = true;
      observer.disconnect();
      if (idleHandle !== null) cancelIdle(idleHandle);
      for (const image of images) if (image) image.src = "";
      images = [];
      state = [];
      picks = [];
      drawRef.current = () => {};
    };
  }, [canvasRef, enabled, manifestUrl, budget]);

  const drawAt = useCallback((progress: number) => drawRef.current(progress), []);

  return { status, drawAt };
}
