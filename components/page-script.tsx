"use client";

/**
 * Site-wide client script (the header, hero, guided descent, and form have
 * their own).
 *
 * Everything here is an enhancement. The server-rendered page is complete
 * without it. The script adds:
 *   - reveals: one shared IntersectionObserver fades and lifts [data-reveal]
 *     elements about 15% before they enter the viewport
 *   - copy buttons for the phone number, email, and address
 *   - pausing animations that are offscreen, or while the tab is hidden
 *   - magnetic buttons, card tilt and spotlight (mouse only), and the
 *     count-up numbers (components/motion/pointer-effects.ts)
 *   - in-page links that still land on their section if the page grows
 *     mid-jump (the guided descent switching to its tall layout)
 *   - a Vercel Web Analytics "Book click" event for every booking link, so
 *     Tabitha can see which services people try to book
 *
 * prefers-reduced-motion turns the animations off in CSS, and nothing is
 * hidden for a reveal.
 */

import { track } from "@vercel/analytics/react";
import { useEffect, useState } from "react";
import { startCountUp, startPointerEffects } from "./motion/pointer-effects";

declare global {
  interface Window {
    /** Set once the reveal observer is running, so the boot script's failsafe stands down. */
    __revealReady?: boolean;
  }
}

export function PageScript() {
  const [status, setStatus] = useState("");

  // Reveals. Elements start hidden only because the boot script in
  // app/layout.tsx marked the page as scripted; reduced motion hides nothing.
  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const observer = new IntersectionObserver(
      (entries) => {
        window.__revealReady = true;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-revealed", "");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px 15% 0px" },
    );
    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // If the page changes height just after an in-page jump (the guided descent
  // switches to its tall layout in idle time), aim at the target again.
  useEffect(() => {
    let jumpedAt = -Infinity;
    const onClick = (event: MouseEvent) => {
      if ((event.target as Element | null)?.closest('a[href^="#"]')) jumpedAt = performance.now();
    };
    const onHash = () => (jumpedAt = performance.now());
    let height = document.documentElement.scrollHeight;
    const resize = new ResizeObserver(() => {
      const next = document.documentElement.scrollHeight;
      if (next === height) return;
      height = next;
      if (performance.now() - jumpedAt > 2500 || !window.location.hash) return;
      const smooth = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
      document
        .getElementById(decodeURIComponent(window.location.hash.slice(1)))
        ?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    });
    resize.observe(document.body);
    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", onHash);
    return () => {
      resize.disconnect();
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  // Which services people try to book. A no-op unless Vercel's script loaded.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[data-book]");
      if (!link) return;
      track("Book click", {
        service: link.dataset.book ?? "unknown",
        section: link.closest("section[id]")?.id ?? "page",
      });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => startPointerEffects(), []);
  useEffect(() => startCountUp(), []);

  // Pause animated pieces while they are offscreen, and everything while the tab is hidden.
  useEffect(() => {
    const animated = Array.from(document.querySelectorAll<HTMLElement>("[data-anim]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.toggleAttribute("data-paused", !entry.isIntersecting);
        }
      },
      { rootMargin: "100px 0px" },
    );
    animated.forEach((el) => io.observe(el));

    const onVisibility = () => document.documentElement.toggleAttribute("data-hidden", document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Copy buttons, by event delegation.
  useEffect(() => {
    const timers = new Map<HTMLElement, number>();

    const onClick = async (event: MouseEvent) => {
      const copy = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-copy]");
      if (!copy) return;
      const value = copy.dataset.copy ?? "";
      const label = copy.dataset.copyLabel ?? "Text";
      const text = copy.querySelector<HTMLElement>("[data-copy-text]");
      try {
        await navigator.clipboard.writeText(value);
        setStatus(`${label} copied.`);
        if (text) text.textContent = "Copied";
      } catch {
        setStatus(`Couldn't copy. Select the ${label.toLowerCase()} and copy it instead.`);
      }
      window.clearTimeout(timers.get(copy));
      timers.set(
        copy,
        window.setTimeout(() => {
          if (text) text.textContent = "Copy";
        }, 2000),
      );
    };

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  return (
    <p className="sr-only" role="status" aria-live="polite">
      {status}
    </p>
  );
}
