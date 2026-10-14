"use client";

import { useEffect, useRef } from "react";

/**
 * A soft light that trails the cursor across the hero. Mouse and trackpad
 * only, and off when reduced motion is preferred. Moves with transform, and
 * stops its frame loop as soon as it settles.
 */
export function HeroGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const glow = ref.current;
    const host = glow?.closest<HTMLElement>(".hero");
    if (!glow || !host) return;
    if (!window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;

    const pos = { x: 0, y: 0, tx: 0, ty: 0 };
    let raf = 0;
    let placed = false;

    const step = () => {
      pos.x += (pos.tx - pos.x) * 0.12;
      pos.y += (pos.ty - pos.y) * 0.12;
      glow.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0)`;
      raf = Math.abs(pos.tx - pos.x) + Math.abs(pos.ty - pos.y) > 0.5 ? requestAnimationFrame(step) : 0;
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = host.getBoundingClientRect();
      pos.tx = event.clientX - rect.left;
      pos.ty = event.clientY - rect.top;
      if (!placed) {
        pos.x = pos.tx;
        pos.y = pos.ty;
        placed = true;
      }
      glow.setAttribute("data-active", "");
      if (!raf) raf = requestAnimationFrame(step);
    };
    const onLeave = () => glow.removeAttribute("data-active");

    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <div ref={ref} className="hero__glow" aria-hidden="true" />;
}
