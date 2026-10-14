/**
 * Pointer effects for mouse and trackpad users, by event delegation, so the
 * elements stay server-rendered:
 *   - [data-magnetic]: primary buttons lean toward the cursor
 *   - [data-tilt]: cards tilt up to about 6 degrees, and a .spotlight glow
 *     follows the cursor (--mx / --my)
 * Off for touch, and when reduced motion is preferred. Transforms only, set
 * in one animation frame per pointer move.
 */

const MAX_TILT = 6;

export function startPointerEffects(): () => void {
  const allowed = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
  let magnet: HTMLElement | null = null;
  let tilt: HTMLElement | null = null;
  let frame = 0;
  let last: PointerEvent | null = null;

  const release = (el: HTMLElement | null, attr: string) => {
    if (!el) return;
    el.style.transform = "";
    el.removeAttribute(attr);
  };

  const apply = () => {
    frame = 0;
    const event = last;
    if (!event) return;

    if (magnet) {
      const rect = magnet.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const x = Math.max(-10, Math.min(10, dx * 0.25));
      const y = Math.max(-8, Math.min(8, dy * 0.35));
      magnet.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    }

    if (tilt) {
      const rect = tilt.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      tilt.style.setProperty("--mx", `${(px * rect.width).toFixed(0)}px`);
      tilt.style.setProperty("--my", `${(py * rect.height).toFixed(0)}px`);
      const rx = (0.5 - py) * MAX_TILT;
      const ry = (px - 0.5) * MAX_TILT;
      tilt.style.transform = `perspective(1000px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    }
  };

  const onMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse" || !allowed.matches) return;
    const target = event.target as Element | null;
    const nextMagnet = target?.closest<HTMLElement>("[data-magnetic]") ?? null;
    const nextTilt = target?.closest<HTMLElement>("[data-tilt]") ?? null;
    if (nextMagnet !== magnet) {
      release(magnet, "data-pulling");
      magnet = nextMagnet;
      magnet?.setAttribute("data-pulling", "");
    }
    if (nextTilt !== tilt) {
      release(tilt, "data-tilting");
      tilt = nextTilt;
      tilt?.setAttribute("data-tilting", "");
    }
    last = event;
    if ((magnet || tilt) && !frame) frame = requestAnimationFrame(apply);
  };

  const onLeave = () => {
    release(magnet, "data-pulling");
    release(tilt, "data-tilting");
    magnet = tilt = null;
  };

  document.addEventListener("pointermove", onMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onLeave);
  return () => {
    cancelAnimationFrame(frame);
    onLeave();
    document.removeEventListener("pointermove", onMove);
    document.documentElement.removeEventListener("pointerleave", onLeave);
  };
}

/**
 * Numbers in [data-count] count up from zero the first time they come into
 * view. The final value is already in the HTML (and in screen-reader text),
 * so nothing changes without script or with reduced motion.
 */
export function startCountUp(): () => void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const items = Array.from(document.querySelectorAll<HTMLElement>("[data-count]"));
  const frames = new Set<number>();
  const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

  const run = (el: HTMLElement) => {
    const target = Number(el.dataset.count);
    const start = performance.now();
    const duration = 1400;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      el.textContent = String(Math.round(target * easeOutExpo(t)));
      if (t < 1) frames.add(requestAnimationFrame(step));
    };
    frames.add(requestAnimationFrame(step));
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        run(entry.target as HTMLElement);
      }
    },
    { threshold: 0.6 },
  );

  // Only numbers still below the screen reset to zero; anything already
  // visible keeps its value, so nothing jumps.
  for (const el of items) {
    if (el.getBoundingClientRect().top > window.innerHeight) {
      el.textContent = "0";
      observer.observe(el);
    }
  }

  return () => {
    observer.disconnect();
    frames.forEach((id) => cancelAnimationFrame(id));
    items.forEach((el) => (el.textContent = el.dataset.count ?? el.textContent));
  };
}
