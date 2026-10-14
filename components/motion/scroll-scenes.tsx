"use client";

import { useEffect } from "react";

/**
 * Scroll-linked moments outside the guided descent (which has its own):
 *   - the hero content drifts up and fades as you scroll past it
 *   - the statement lights up word by word
 *   - the course beam fills, across on wide screens and down on phones
 *   - the light rays in each section drift slightly (parallax)
 *
 * GSAP and ScrollTrigger load in idle time, so they never enter the initial
 * bundle. Every element rests in its finished state in CSS: if GSAP fails to
 * load, or reduced motion is preferred, nothing here runs and the page reads
 * exactly the same. Transforms and opacity only.
 */
export function ScrollScenes() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    const load = () =>
      Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
        .then(([{ gsap }, { ScrollTrigger }]) => {
          if (cancelled) return;
          gsap.registerPlugin(ScrollTrigger);
          ScrollTrigger.config({ ignoreMobileResize: true });

          const mm = gsap.matchMedia();
          mm.add("(prefers-reduced-motion: no-preference)", () => {
            const hero = document.querySelector<HTMLElement>(".hero");
            const drift = hero?.querySelector<HTMLElement>(".hero__inner");
            if (hero && drift) {
              gsap.to(drift, {
                y: -80,
                opacity: 0.15,
                ease: "none",
                scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
              });
            }

            const statement = document.querySelector<HTMLElement>("[data-statement]");
            const words = statement?.querySelectorAll<HTMLElement>("[data-word]");
            if (statement && words?.length) {
              gsap.fromTo(
                words,
                { opacity: 0.16 },
                {
                  opacity: 1,
                  ease: "none",
                  stagger: 0.12,
                  scrollTrigger: { trigger: statement, start: "top 80%", end: "bottom 65%", scrub: 0.4 },
                },
              );
            }

            for (const el of document.querySelectorAll<HTMLElement>("[data-parallax]")) {
              gsap.fromTo(
                el,
                { y: -40 },
                {
                  y: 40,
                  ease: "none",
                  scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true },
                },
              );
            }
          });

          // The beam runs across on wide screens and down on phones.
          const beam = document.querySelector<HTMLElement>("[data-beam]");
          const fill = beam?.querySelector<HTMLElement>("[data-beam-fill]");
          if (beam && fill) {
            const scene = (axis: "scaleX" | "scaleY", start: string, end: string) => () => {
              gsap.fromTo(
                fill,
                { [axis]: 0 },
                { [axis]: 1, ease: "none", scrollTrigger: { trigger: beam, start, end, scrub: 0.6 } },
              );
            };
            mm.add("(prefers-reduced-motion: no-preference) and (min-width: 1024px)", scene("scaleX", "top 80%", "top 30%"));
            mm.add("(prefers-reduced-motion: no-preference) and (max-width: 1023px)", scene("scaleY", "top 70%", "bottom 70%"));
          }

          // Layout below can change after load (the guided descent switching to
          // its tall layout, an FAQ opening), so re-measure when the page resizes.
          let timer = 0;
          const resize = new ResizeObserver(() => {
            window.clearTimeout(timer);
            timer = window.setTimeout(() => ScrollTrigger.refresh(), 150);
          });
          resize.observe(document.body);

          cleanup = () => {
            window.clearTimeout(timer);
            resize.disconnect();
            mm.revert();
          };
        })
        .catch(() => {
          // Without GSAP every element rests in its finished state.
        });

    // Safari has no requestIdleCallback; a short timeout does the same job there.
    const idle = typeof window.requestIdleCallback === "function";
    const handle = idle ? window.requestIdleCallback(load, { timeout: 2000 }) : window.setTimeout(load, 300);

    return () => {
      cancelled = true;
      if (idle) window.cancelIdleCallback(handle as number);
      else window.clearTimeout(handle);
      cleanup?.();
    };
  }, []);

  return null;
}
