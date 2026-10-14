"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "../icons";

type Slide = { key: string; name: string; content: ReactNode };

type Props = {
  label: string;
  slides: Slide[];
  /** Sits in the row beside the arrows, like the reference's chip. */
  chip: ReactNode;
};

/**
 * The hero's experience cards. A native scroll-snap track, so touch swipe and
 * trackpads work as they should; the arrows and arrow keys scroll it one card
 * at a time. Which card is current comes from an IntersectionObserver, so
 * scrolling never forces a layout read. Without JavaScript the track still
 * scrolls; only the arrows are hidden.
 */
export function HeroCarousel({ label, slides, chip }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const [index, setIndex] = useState(0);
  const [announce, setAnnounce] = useState("");
  const interacted = useRef(false);
  const last = slides.length - 1;

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const visible = new Set<number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const i = slideRefs.current.indexOf(entry.target as HTMLDivElement);
          if (entry.intersectionRatio >= 0.6) visible.add(i);
          else visible.delete(i);
        }
        if (visible.size) setIndex(Math.min(...visible));
      },
      { root: track, threshold: [0, 0.6, 1] },
    );
    slideRefs.current.forEach((slide) => slide && observer.observe(slide));
    return () => observer.disconnect();
  }, []);

  // Announce the position once the visitor has moved the carousel.
  useEffect(() => {
    if (interacted.current) setAnnounce(`${index + 1} of ${slides.length}`);
  }, [index, slides.length]);

  // Keep focus on an arrow that still works when the other end is reached.
  useEffect(() => {
    const active = document.activeElement;
    if (index === 0 && active === prevRef.current) nextRef.current?.focus();
    if (index === last && active === nextRef.current) prevRef.current?.focus();
  }, [index, last]);

  const go = useCallback(
    (target: number) => {
      const track = trackRef.current;
      const slide = slideRefs.current[Math.max(0, Math.min(last, target))];
      if (!track || !slide) return;
      interacted.current = true;
      const smooth = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
      // The track is the slides' offset parent, so offsetLeft is a scroll position.
      track.scrollTo({ left: slide.offsetLeft, behavior: smooth ? "smooth" : "auto" });
    },
    [last],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      go(0);
    } else if (event.key === "End") {
      event.preventDefault();
      go(last);
    }
  };

  return (
    <div className="hero__bottom" role="region" aria-roledescription="carousel" aria-label={label}>
      <div className="hero__row">
        {chip}
        <div className="carousel-nav glass glass-blur js-only">
          <button
            ref={prevRef}
            type="button"
            className="icon-btn"
            aria-label="Previous experience"
            aria-controls="hero-carousel-track"
            data-action="carousel-prev"
            disabled={index === 0}
            onClick={() => go(index - 1)}
          >
            <ArrowLeftIcon size={18} className="btn__icon btn__icon--nudge-back" />
          </button>
          <button
            ref={nextRef}
            type="button"
            className="icon-btn"
            aria-label="Next experience"
            aria-controls="hero-carousel-track"
            data-action="carousel-next"
            disabled={index === last}
            onClick={() => go(index + 1)}
          >
            <ArrowRightIcon size={18} className="btn__icon btn__icon--nudge" />
          </button>
        </div>
      </div>
      <div className="carousel">
        <div
          ref={trackRef}
          id="hero-carousel-track"
          className="carousel__track"
          tabIndex={0}
          aria-label={`${label}. Use the arrow keys to move between cards.`}
          onKeyDown={onKeyDown}
          onPointerDown={() => (interacted.current = true)}
          onWheel={() => (interacted.current = true)}
        >
          {slides.map((slide, i) => (
            <div
              key={slide.key}
              ref={(el) => {
                slideRefs.current[i] = el;
              }}
              className="carousel__slide"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slides.length}: ${slide.name}`}
              data-current={i === index ? "" : undefined}
            >
              {slide.content}
            </div>
          ))}
        </div>
        <p className="sr-only" aria-live="polite" aria-atomic="true" data-carousel-status>
          {announce}
        </p>
      </div>
    </div>
  );
}
