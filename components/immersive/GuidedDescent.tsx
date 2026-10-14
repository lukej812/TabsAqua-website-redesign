"use client";

import { getImageProps } from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import "@/styles/guided-descent.css";
import type { DescentChapter } from "@/content/site";
import { useFrameSequence } from "@/hooks/useFrameSequence";
import { useVideoScrub } from "@/hooks/useVideoScrub";
import { chapterIndexAt, chapterMidpoint, chapterState } from "@/lib/motion/descent";
import {
  chooseTier,
  immersiveLayoutAllowed,
  isSmallScreen,
  subscribeToImmersiveLayout,
  subscribeToSmallScreen,
  type DescentTier,
} from "@/lib/motion/preferences";
import type { SeekStats } from "@/lib/video/seek-coordinator";
import { DepthIndicator } from "./DepthIndicator";
import { DescentScene } from "./DescentScene";
import { StoryChapter } from "./StoryChapter";

export type DescentMedia = {
  webm?: string;
  mp4?: string;
  mobileMp4?: string;
  poster?: string;
  mobilePoster?: string;
  framesManifest?: string;
};

type Props = {
  title: string;
  chapters: readonly DescentChapter[];
  cta: { label: string; href: string };
  secondary: { label: string; href: string };
  footageNote: string;
  media: DescentMedia;
  /** NEXT_PUBLIC_USE_FRAME_SEQUENCE is on and the frames manifest exists. */
  useFrames: boolean;
  /** Asset paths that were missing at build time. */
  missing: readonly string[];
  /** Development builds only. */
  showDevWarning: boolean;
  /** Test builds only: lets ?renderer=video|frames|still|editorial pick the tier. */
  allowRendererOverride?: boolean;
};

type Mode = "pending" | "immersive" | "editorial";

/** Most frames a phone loads in frame-sequence mode. */
const MOBILE_FRAME_BUDGET = 60;
const DESKTOP_FRAME_BUDGET = 180;

/** How far a chapter moves while it fades, in px. Small on purpose. */
const TRAVEL_PX = 24;

/** ScrollTrigger scrub smoothing, in seconds. Tuned between 0.25 and 0.6. */
const SCRUB = 0.4;

const TIERS: readonly DescentTier[] = ["video", "frames", "still", "editorial"];

const noSubscription = () => () => {};

type GsapModules = {
  gsap: typeof import("gsap").gsap;
  ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger;
};

/**
 * "The guided descent": a scroll-scrubbed underwater sequence.
 *
 * The server renders every chapter as plain HTML in the editorial layout, so
 * the content never depends on script. When motion is welcome (see
 * IMMERSIVE_LAYOUT_QUERY), this component lazy-loads GSAP + ScrollTrigger,
 * switches to the tall section with a sticky stage while it is still below
 * the screen, and drives one progress value into the video time, chapters,
 * overlay, and depth gauge.
 */
export function GuidedDescent({
  title,
  chapters,
  cta,
  secondary,
  footageNote,
  media,
  useFrames,
  missing,
  showDevWarning,
  allowRendererOverride = false,
}: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const depthRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<(HTMLLIElement | null)[]>([]);
  const triggerRef = useRef<{ start: number; end: number } | null>(null);
  const activeRef = useRef(-1);
  const percentRef = useRef(-1);

  const gsapRef = useRef<GsapModules | null>(null);
  const [gsapFailed, setGsapFailed] = useState(false);
  /** GSAP loaded and the section was still below the screen, so switching layout moved nothing in view. */
  const [ready, setReady] = useState(false);
  /** GSAP arrived after the visitor reached the section. Stay editorial rather than jump. */
  const [late, setLate] = useState(false);
  const [near, setNear] = useState(false);
  const [videoShown, setVideoShown] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);

  // Browser-only facts, read without a hydration mismatch. The server answers "unknown".
  const hydrated = useSyncExternalStore(noSubscription, () => true, () => false);
  const layoutOk = useSyncExternalStore<boolean | null>(subscribeToImmersiveLayout, immersiveLayoutAllowed, () => null);
  const small = useSyncExternalStore(subscribeToSmallScreen, isSmallScreen, () => false);

  const hasVideo = Boolean(media.webm || media.mp4);
  const hasMobileVideo = Boolean(media.mobileMp4);

  // What this browser gets. Recomputed when motion preference, zoom, or window size changes.
  let tier: DescentTier | null = null;
  if (hydrated) {
    const forced = allowRendererOverride
      ? (new URLSearchParams(window.location.search).get("renderer") as DescentTier | null)
      : null;
    tier = forced && TIERS.includes(forced) ? forced : chooseTier({ hasVideo, hasMobileVideo, useFrames });
  }

  // Motion is welcome here: a tier that animates, a tall enough window, and GSAP not broken.
  const canAnimate = tier !== null && tier !== "editorial" && layoutOk === true && !gsapFailed;
  const mode: Mode = !canAnimate || late ? "editorial" : ready ? "immersive" : "pending";
  const immersive = mode === "immersive";

  // Start loading media shortly before the section scrolls into view.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || near) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "150% 0px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [near]);

  const writeStats = useCallback((stats: Readonly<SeekStats>) => {
    const video = videoRef.current;
    if (!video) return;
    video.dataset.seeksStarted = String(stats.started);
    video.dataset.seeksSuperseded = String(stats.superseded);
    video.dataset.maxInFlight = String(stats.maxInFlight);
    video.dataset.maxQueued = String(stats.maxQueued);
  }, []);

  const wantsVideo = immersive && near && tier === "video";
  const video = useVideoScrub(videoRef, wantsVideo, writeStats);
  const frames = useFrameSequence(canvasRef, {
    manifestUrl: media.framesManifest ?? "",
    enabled: immersive && near && tier === "frames" && Boolean(media.framesManifest),
    budget: small ? MOBILE_FRAME_BUDGET : DESKTOP_FRAME_BUDGET,
  });

  // If the media can't load, keep the motion and show the still image instead.
  const shownTier: DescentTier | null =
    (tier === "video" && video.status === "failed") || (tier === "frames" && frames.status === "failed")
      ? "still"
      : tier;

  const { scrubTo } = video;
  const { drawAt } = frames;

  /** One progress value in, every visual out. Called by the single ScrollTrigger only. */
  const render = useCallback(
    (progress: number) => {
      const stage = stageRef.current;
      if (!stage) return;
      const ranges = chapters.map((c) => c.range);
      stage.style.setProperty("--p", progress.toFixed(4));

      const active = chapterIndexAt(progress, ranges);
      chapterRefs.current.forEach((el, i) => {
        if (!el) return;
        const { opacity, offset } = chapterState(progress, i, ranges);
        el.style.opacity = opacity.toFixed(3);
        el.style.transform = offset === 0 ? "" : `translate3d(0, ${(offset * TRAVEL_PX).toFixed(1)}px, 0)`;
        el.toggleAttribute("data-active", i === active);
      });

      const depth = depthRef.current;
      const percent = Math.round(progress * 100);
      if (depth && (percent !== percentRef.current || active !== activeRef.current)) {
        depth.setAttribute("aria-valuenow", String(percent));
        depth.setAttribute("aria-valuetext", `Chapter ${active + 1} of ${chapters.length}: ${chapters[active].label}`);
        depth.querySelectorAll("li").forEach((li, i) => li.toggleAttribute("data-active", i === active));
      }
      percentRef.current = percent;
      activeRef.current = active;

      scrubTo(progress);
      drawAt(progress);
    },
    [chapters, scrubTo, drawAt],
  );

  /** Undo everything render() wrote, for the editorial layout. */
  const clearStyles = useCallback(() => {
    stageRef.current?.style.removeProperty("--p");
    chapterRefs.current.forEach((el, i) => {
      if (!el) return;
      el.style.opacity = "";
      el.style.transform = "";
      el.toggleAttribute("data-active", i === 0);
    });
    activeRef.current = -1;
    percentRef.current = -1;
  }, []);

  // Load GSAP + ScrollTrigger in idle time after hydration, so they are usually
  // ready before the visitor reaches the section. Switch to the immersive
  // layout only while the section is still below the screen; switching then
  // changes nothing the visitor can see.
  useEffect(() => {
    const section = sectionRef.current;
    if (!canAnimate || !section) return;

    let cancelled = false;
    const load = () =>
      Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
        .then(([{ gsap }, { ScrollTrigger }]) => {
          if (cancelled) return;
          gsap.registerPlugin(ScrollTrigger);
          // Phones resize the viewport as the address bar hides; don't re-measure for that.
          ScrollTrigger.config({ ignoreMobileResize: true });
          gsapRef.current = { gsap, ScrollTrigger };
          if (section.getBoundingClientRect().top >= window.innerHeight) setReady(true);
          else setLate(true);
        })
        .catch(() => {
          // Without GSAP the chapters still read well in the editorial layout.
          if (!cancelled) setGsapFailed(true);
        });

    // Safari has no requestIdleCallback; a short timeout does the same job there.
    const idle = typeof window.requestIdleCallback === "function";
    const handle = idle ? window.requestIdleCallback(load, { timeout: 1500 }) : globalThis.setTimeout(load, 200);

    return () => {
      cancelled = true;
      if (idle) window.cancelIdleCallback(handle as number);
      else globalThis.clearTimeout(handle);
      setReady(false);
    };
  }, [canAnimate]);

  // The one progress controller. Created after React has switched the layout,
  // so ScrollTrigger measures the tall section, not the editorial one.
  useEffect(() => {
    const section = sectionRef.current;
    const modules = gsapRef.current;
    if (!immersive || !section || !modules) return;
    const { gsap, ScrollTrigger } = modules;

    // The stage sticks below the header, so progress starts there.
    const offsets = () => {
      const stage = stageRef.current;
      const top = stage ? parseFloat(getComputedStyle(stage).top) || 0 : 0;
      const bottomGap = stage ? window.innerHeight - top - stage.offsetHeight : 0;
      return { top, bottom: Math.max(0, bottomGap) };
    };

    const proxy = { p: 0 };
    const ctx = gsap.context(() => {
      gsap.to(proxy, {
        p: 1,
        ease: "none",
        onUpdate: () => render(proxy.p),
        scrollTrigger: {
          trigger: section,
          start: () => `top top+=${offsets().top}`,
          end: () => `bottom bottom-=${offsets().bottom}`,
          scrub: SCRUB,
          invalidateOnRefresh: true,
          onRefresh: (self) => {
            triggerRef.current = { start: self.start, end: self.end };
          },
        },
      });
    }, section);
    render(proxy.p);

    // Fonts and pages restored from the back/forward cache can move the section.
    let live = true;
    document.fonts?.ready.then(() => {
      if (live) ScrollTrigger.refresh();
    });
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) ScrollTrigger.refresh();
    };
    window.addEventListener("pageshow", onPageShow);

    return () => {
      live = false;
      window.removeEventListener("pageshow", onPageShow);
      ctx.revert();
      triggerRef.current = null;
      clearStyles();
    };
  }, [immersive, render, clearStyles]);

  // Keyboard users: focusing a link in a hidden chapter scrolls that chapter
  // into view. Focus itself never moves.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || mode !== "immersive") return;
    const ranges = chapters.map((c) => c.range);
    const onFocus = (event: FocusEvent) => {
      const chapter = (event.target as HTMLElement).closest<HTMLElement>("[data-chapter]");
      const trigger = triggerRef.current;
      if (!chapter || !trigger) return;
      const index = Number(chapter.dataset.chapter);
      if (index === activeRef.current) return;
      const top = trigger.start + (trigger.end - trigger.start) * chapterMidpoint(index, ranges);
      window.scrollTo({ top, behavior: "instant" });
    };
    section.addEventListener("focusin", onFocus);
    return () => section.removeEventListener("focusin", onFocus);
  }, [mode, chapters]);

  const showVideo = wantsVideo && video.status !== "failed";
  const posterProps =
    media.poster && !posterFailed
      ? getImageProps({ src: media.poster, alt: "", fill: true, sizes: "100vw", unoptimized: true }).props
      : null;

  return (
    <section
      ref={sectionRef}
      id="guided-descent"
      className="gd"
      data-mode={mode}
      data-tier={shownTier ?? "pending"}
      data-anim
      aria-labelledby="gd-title"
    >
      <h2 id="gd-title" className="sr-only">
        {title}
      </h2>
      <div ref={stageRef} className="gd__stage" data-video-shown={videoShown ? "" : undefined}>
        <div className="gd__media" aria-hidden="true">
          {posterProps ? (
            <picture className="gd__poster">
              {media.mobilePoster && <source media="(max-width: 767px)" srcSet={media.mobilePoster} />}
              {/* Decorative: alt="" comes from getImageProps. */}
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <img {...posterProps} loading="lazy" onError={() => setPosterFailed(true)} />
            </picture>
          ) : (
            <DescentScene />
          )}
          {showVideo && (
            <video
              ref={videoRef}
              className="gd__video"
              muted
              playsInline
              preload="auto"
              disablePictureInPicture
              disableRemotePlayback
              tabIndex={-1}
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
          {shownTier === "frames" && immersive && <canvas ref={canvasRef} className="gd__canvas" />}
          <div className="gd__tint" />
          <div className="gd__rays" />
          <div className="gd__grain" />
          <div className="gd__bubbles">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="gd__bubble" />
            ))}
          </div>
        </div>

        <ol className="gd__chapters">
          {chapters.map((chapter, i) => (
            <StoryChapter
              key={chapter.id}
              ref={(el) => {
                chapterRefs.current[i] = el;
              }}
              chapter={chapter}
              index={i}
              total={chapters.length}
              cta={i === chapters.length - 1 ? cta : undefined}
              secondary={i === chapters.length - 1 ? secondary : undefined}
            />
          ))}
        </ol>

        <DepthIndicator ref={depthRef} chapters={chapters} />

        {(hasVideo || useFrames) && <p className="gd__note">{footageNote}</p>}

        {showDevWarning && missing.length > 0 && (
          <p className="gd__dev-warning" role="note">
            Development only: guided descent assets missing ({missing.join(", ")}). Showing the
            fallback. See docs/video-production.md.
          </p>
        )}
      </div>
    </section>
  );
}
