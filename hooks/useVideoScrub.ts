"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { videoTimeAt } from "@/lib/motion/descent";
import { SeekCoordinator, type SeekStats } from "@/lib/video/seek-coordinator";

export type VideoScrubStatus = "idle" | "loading" | "ready" | "failed";

export type VideoScrub = {
  status: VideoScrubStatus;
  /** Seek to the time for this progress value (0 to 1). Safe to call every frame. */
  scrubTo: (progress: number) => void;
  /** Live counters from the seek coordinator, for tests and debugging. */
  stats: () => Readonly<SeekStats> | null;
};

/**
 * Drives a muted, inline <video> from scroll progress.
 *
 * Waits for loadedmetadata before using the duration, routes every seek
 * through one SeekCoordinator, and reports "failed" when every <source>
 * errors. Removes all listeners and pending callbacks on unmount.
 */
export function useVideoScrub(
  videoRef: RefObject<HTMLVideoElement | null>,
  enabled: boolean,
  onStats?: (stats: Readonly<SeekStats>) => void,
): VideoScrub {
  const [status, setStatus] = useState<VideoScrubStatus>("idle");
  const coordinatorRef = useRef<SeekCoordinator | null>(null);
  const durationRef = useRef(0);
  const latestProgress = useRef(0);
  const onStatsRef = useRef(onStats);

  useEffect(() => {
    onStatsRef.current = onStats;
  }, [onStats]);

  useEffect(() => {
    const video = videoRef.current;
    if (!enabled || !video) return;

    setStatus("loading");
    const sources = Array.from(video.querySelectorAll("source"));
    let primed = false;

    const ready = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      durationRef.current = video.duration;
      coordinatorRef.current?.destroy();
      coordinatorRef.current = new SeekCoordinator(video, {
        onChange: (stats) => onStatsRef.current?.(stats),
      });
      setStatus("ready");
      // iOS Safari only paints frames of a video that has played once. A muted,
      // inline play and pause unlocks it without showing controls or sound.
      if (!primed) {
        primed = true;
        const attempt = video.play();
        if (attempt && typeof attempt.then === "function") {
          attempt
            .then(() => {
              video.pause();
              coordinatorRef.current?.request(videoTimeAt(latestProgress.current, durationRef.current));
            })
            .catch(() => {});
        } else {
          video.pause();
        }
      }
      coordinatorRef.current.request(videoTimeAt(latestProgress.current, durationRef.current));
    };

    // Each <source> reports its own error; only the last one means nothing can play.
    const lastSource = sources.at(-1);
    const failed = () => {
      coordinatorRef.current?.destroy();
      coordinatorRef.current = null;
      setStatus("failed");
    };
    const onVideoError = () => {
      if (video.error) failed();
    };

    video.addEventListener("loadedmetadata", ready);
    video.addEventListener("error", onVideoError);
    lastSource?.addEventListener("error", failed);

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) ready();
    else if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE && video.preload !== "none") failed();

    return () => {
      video.removeEventListener("loadedmetadata", ready);
      video.removeEventListener("error", onVideoError);
      lastSource?.removeEventListener("error", failed);
      coordinatorRef.current?.destroy();
      coordinatorRef.current = null;
      if (!video.paused) video.pause();
    };
  }, [enabled, videoRef]);

  const scrubTo = useCallback((progress: number) => {
    latestProgress.current = progress;
    const coordinator = coordinatorRef.current;
    if (!coordinator || durationRef.current <= 0) return;
    coordinator.request(videoTimeAt(progress, durationRef.current));
  }, []);

  const stats = useCallback(() => coordinatorRef.current?.stats ?? null, []);

  return { status, scrubTo, stats };
}
