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
 *
 * prefers-reduced-motion turns the animations off in CSS, and nothing is
 * hidden for a reveal.
 */

import { useEffect, useState } from "react";

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
