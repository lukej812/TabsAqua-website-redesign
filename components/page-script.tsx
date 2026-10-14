"use client";

/**
 * Site-wide client script (the guided descent has its own, in components/immersive).
 *
 * Everything here is an enhancement. The server-rendered page is complete
 * without it, and every animation is plain CSS. The script adds:
 *   - copy buttons for the phone number, email, and address
 *   - closing the mobile menu after a link is chosen, or on Escape
 *   - pausing animations that are offscreen, or while the tab is hidden
 *
 * prefers-reduced-motion turns the animations off in CSS.
 */

import { useEffect, useState } from "react";

export function PageScript() {
  const [status, setStatus] = useState("");

  // Mark the page as scripted so copy buttons appear.
  useEffect(() => {
    document.documentElement.classList.add("js");
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

    const onVisibility = () =>
      document.documentElement.toggleAttribute("data-hidden", document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Copy buttons and the mobile menu, by event delegation.
  useEffect(() => {
    const timers = new Map<HTMLElement, number>();

    const onClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      const copy = target.closest<HTMLButtonElement>("[data-copy]");
      if (copy) {
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
        return;
      }

      // Close the mobile menu once a link inside it is chosen, or on a click outside it.
      document.querySelectorAll<HTMLDetailsElement>("details.menu[open]").forEach((menu) => {
        if (!menu.contains(target) || target.closest("a")) menu.open = false;
      });
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const menu = document.querySelector<HTMLDetailsElement>("details.menu[open]");
      if (menu) {
        menu.open = false;
        menu.querySelector("summary")?.focus();
      }
    };

    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  return (
    <p className="sr-only" role="status" aria-live="polite">
      {status}
    </p>
  );
}
