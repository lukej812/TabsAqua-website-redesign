"use client";

import { useEffect, useRef, useState } from "react";

type Zone = { readonly id: string; readonly label: string };

/**
 * A slim gauge on the right edge of wide screens: how far down the page you
 * are, and the name of the zone you are in (Surface, The reef, Deeper...).
 * The names are atmosphere, never real depths. Decorative: the header
 * navigation and the headings already say where you are.
 */
export function DepthGauge({ zones }: { zones: readonly Zone[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [tone, setTone] = useState("dark");

  useEffect(() => {
    const gauge = ref.current;
    if (!gauge) return;
    const elements = zones.map((zone) => document.getElementById(zone.id));
    let frame = 0;

    const update = () => {
      frame = 0;
      const root = document.documentElement;
      const max = Math.max(1, root.scrollHeight - window.innerHeight);
      gauge.style.setProperty("--p", Math.min(1, window.scrollY / max).toFixed(4));
      const line = window.innerHeight * 0.5;
      let index = 0;
      elements.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= line) index = i;
      });
      setActive(index);
      // Match the text color to whatever section sits under the gauge.
      const under = document.elementsFromPoint(window.innerWidth - 40, line).find((el) => el.closest("[data-tone]") && !gauge.contains(el));
      setTone(under?.closest("[data-tone]")?.getAttribute("data-tone") ?? "dark");
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    gauge.dataset.ready = "";
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [zones]);

  return (
    <div ref={ref} className="gauge" data-tone={tone} aria-hidden="true">
      <span className="gauge__track">
        <span className="gauge__fill" />
        {zones.map((zone, i) => (
          <span
            key={`${zone.id}-${i}`}
            className="gauge__tick"
            data-on={i <= active ? "" : undefined}
            style={{ top: `${(i / (zones.length - 1)) * 100}%` }}
          />
        ))}
        <span className="gauge__needle" />
      </span>
      <span className="gauge__label">{zones[active].label}</span>
    </div>
  );
}
