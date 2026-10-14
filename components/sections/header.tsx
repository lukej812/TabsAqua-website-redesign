"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import { business, contact, headerCopy, nav } from "@/content/site";
import { Emblem } from "../emblem";
import { CloseIcon, MenuIcon } from "../icons";

type NavId = (typeof nav)[number]["id"];

/**
 * Tracks which section crosses a line 35% down the viewport, with an
 * IntersectionObserver so scrolling never forces a layout read. Blocks in
 * <main> that aren't in the nav count as the nav section before them; the
 * hero and the guided descent count as none.
 */
function useActiveSection(): NavId | null {
  const [active, setActive] = useState<NavId | null>(null);

  useEffect(() => {
    const main = document.getElementById("main");
    if (!main) return;
    const ids = new Set<string>(nav.map((n) => n.id));
    const owner = new Map<Element, NavId | null>();
    let current: NavId | null = null;
    for (const el of Array.from(main.children)) {
      if (ids.has(el.id)) current = el.id as NavId;
      owner.set(el, current);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && owner.has(entry.target)) setActive(owner.get(entry.target) ?? null);
        }
      },
      { rootMargin: "-35% 0px -64% 0px" },
    );
    owner.forEach((_, el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return active;
}

/**
 * Fixed header. Transparent over the hero, a glass pill after 24px of scroll.
 * Wide screens: section links with a sliding active indicator. Phones and
 * tablets: a full-screen menu that locks scroll, traps focus, closes on
 * Escape, and returns focus to its button. Without JavaScript the menu button
 * becomes a link to the footer navigation.
 */
export function SiteHeader() {
  const active = useActiveSection();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // The pill appears once a 24px sentinel at the top of the page scrolls away.
  useEffect(() => {
    const sentinel = document.getElementById("scroll-sentinel");
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting));
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Scroll progress line. The scroll handler reads only scrollY; the page
  // height is measured when something resizes.
  useEffect(() => {
    const bar = progressRef.current;
    if (!bar) return;
    let max = 1;
    let frame = 0;
    const paint = () => {
      frame = 0;
      bar.style.transform = `scaleX(${Math.min(1, Math.max(0, window.scrollY / max)).toFixed(4)})`;
    };
    const measure = () => {
      max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      paint();
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const resize = new ResizeObserver(measure);
    resize.observe(document.body);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", onScroll, { passive: true });
    measure();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Slide the indicator under the active link. Layout is read here, on a
  // section change or a resize, never while scrolling.
  const placeIndicator = useCallback(() => {
    const navEl = navRef.current;
    const indicator = indicatorRef.current;
    if (!navEl || !indicator) return;
    const link = active ? navEl.querySelector<HTMLElement>(`a[href="#${active}"]`) : null;
    navEl.toggleAttribute("data-has-active", Boolean(link && link.offsetWidth));
    if (!link || !link.offsetWidth) return;
    const inset = 14;
    indicator.style.transform = `translateX(${link.offsetLeft + inset}px) scaleX(${(link.offsetWidth - inset * 2) / 100})`;
  }, [active]);

  useEffect(() => {
    placeIndicator();
    window.addEventListener("resize", placeIndicator);
    document.fonts?.ready.then(placeIndicator);
    return () => window.removeEventListener("resize", placeIndicator);
  }, [placeIndicator]);

  // Mobile menu: lock scroll, trap focus, Escape closes, focus returns to the button.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    root.setAttribute("data-menu-open", "");
    menuRef.current?.querySelector<HTMLElement>("a")?.focus();

    const focusables = () =>
      [buttonRef.current, ...Array.from(menuRef.current?.querySelectorAll<HTMLElement>("a") ?? [])].filter(
        (el): el is HTMLElement => Boolean(el),
      );

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      const index = items.indexOf(document.activeElement as HTMLElement);
      const next = event.shiftKey
        ? items[(index <= 0 ? items.length : index) - 1]
        : items[(index + 1) % items.length];
      event.preventDefault();
      next.focus();
    };
    const onResize = () => {
      if (window.matchMedia("(min-width: 1100px)").matches) setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    const button = buttonRef.current;
    return () => {
      root.style.overflow = previousOverflow;
      root.removeAttribute("data-menu-open");
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      button?.focus({ preventScroll: true });
    };
  }, [open]);

  // Close first so scrolling is unlocked, then follow the link.
  const onMenuLink = (event: MouseEvent<HTMLAnchorElement>) => {
    const href = event.currentTarget.getAttribute("href");
    if (!href?.startsWith("#")) {
      setOpen(false);
      return;
    }
    event.preventDefault();
    flushSync(() => setOpen(false));
    if (window.location.hash !== href) {
      window.location.hash = href;
      return;
    }
    const smooth = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
    document.getElementById(href.slice(1))?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  return (
    <header
      className="site-header"
      data-scrolled={scrolled ? "" : undefined}
      data-menu-open={open ? "" : undefined}
    >
      <div ref={progressRef} className="progress" aria-hidden="true" />
      <div className="header-bar">
        <a className="brand" href="#top">
          <Emblem />
          <span className="brand__name">Tabs AquaQuest</span>
          <span className="sr-only"> Diving, back to top</span>
        </a>

        <nav ref={navRef} className="site-nav" aria-label="Main">
          <ul>
            {nav.map((item) => (
              <li key={item.id}>
                <a
                  className="site-nav__link label"
                  href={`#${item.id}`}
                  aria-current={active === item.id ? "true" : undefined}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <span ref={indicatorRef} className="site-nav__indicator" aria-hidden="true" />
        </nav>

        <a className="btn btn--glass btn--label header-book glass-blur" href="#experiences">
          {headerCopy.bookCta}
        </a>

        <button
          ref={buttonRef}
          type="button"
          className="menu-button js-only"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? headerCopy.menuClose : headerCopy.menuOpen}
          data-action="menu"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
        </button>
        <a className="menu-button__label label no-js-only" href="#footer-nav">
          Menu
        </a>
      </div>

      <div ref={menuRef} id="mobile-menu" className="mobile-menu" hidden={!open}>
        <nav aria-label="Menu">
          <ul className="mobile-menu__links">
            {nav.map((item, i) => (
              <li key={item.id} style={{ "--i": i } as CSSProperties}>
                <a
                  href={`#${item.id}`}
                  aria-current={active === item.id ? "true" : undefined}
                  onClick={onMenuLink}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mobile-menu__contact" style={{ "--i": nav.length } as CSSProperties}>
          <p className="label">{business.name}</p>
          <a className="text-link" href={contact.phone.href}>
            Call {contact.phone.display}
          </a>
          <a className="text-link" href={contact.email.href}>
            {contact.email.display}
          </a>
        </div>
      </div>
    </header>
  );
}
