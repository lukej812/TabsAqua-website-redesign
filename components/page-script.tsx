"use client";

/**
 * Site-wide client script (the ocean stage has its own, in components/immersive).
 *
 * Everything here is an enhancement. The server-rendered page is complete
 * without it, and every looping animation is plain CSS. The script adds:
 *   - copy buttons for the phone number, email, address, and planner message
 *   - closing the mobile menu after a link is chosen, or on Escape
 *   - the header's solid state once the page has scrolled
 *   - gentle reveals for content that starts below the screen (motion allowed only)
 *   - tucking the phone booking bar away while the hero buttons or booking section are on screen
 *   - pausing animations that are offscreen, or while the tab is hidden
 *
 * prefers-reduced-motion turns the animations and reveals off.
 */

import { useEffect, useState } from "react";

export function PageScript() {
  const [status, setStatus] = useState("");

  // The layout's inline script normally sets this before paint; this is a fallback.
  useEffect(() => {
    document.documentElement.classList.add("js");
  }, []);

  // Solid header once the page moves.
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    if (!header) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      header.toggleAttribute("data-scrolled", window.scrollY > 24);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    header.dataset.ready = "";
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Reveals: only for content below the screen at load, and only when motion is welcome.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const items = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-reveal", "shown");
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    for (const item of items) {
      if (item.getBoundingClientRect().top > window.innerHeight) {
        item.setAttribute("data-reveal", "pending");
        io.observe(item);
      }
    }
    // Printing, or finding text with the browser, should never meet hidden content.
    const showAll = () => items.forEach((item) => item.setAttribute("data-reveal", "shown"));
    window.addEventListener("beforeprint", showAll);
    return () => {
      io.disconnect();
      window.removeEventListener("beforeprint", showAll);
    };
  }, []);

  // The phone booking bar steps aside while the hero's own buttons or the
  // booking section are on screen, so it never doubles up or covers them.
  useEffect(() => {
    const bar = document.querySelector<HTMLElement>(".book-bar");
    const targets = [document.querySelector(".hero__actions"), document.getElementById("book")].filter(
      (el): el is HTMLElement => el !== null,
    );
    if (!bar || !targets.length) return;
    const showing = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) showing.add(entry.target);
          else showing.delete(entry.target);
        }
        bar.toggleAttribute("data-away", showing.size > 0);
        bar.dataset.ready = "";
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
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
