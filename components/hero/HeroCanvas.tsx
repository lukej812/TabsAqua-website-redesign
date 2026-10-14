"use client";

import { useEffect, useRef } from "react";

type Props = {
  className?: string;
  /** Over a real photo or video: draw only the caustic light, nothing else. */
  causticsOnly?: boolean;
};

type Particle = { x: number; y: number; z: number; r: number; a: number; vy: number; phase: number };
type Trail = { x: number; born: number; count: number; speed: number; wobble: number; size: number };

const TAU = Math.PI * 2;

/**
 * The hero's underwater scene, drawn on one 2D canvas until real footage or
 * photos exist: caustic ripples near the surface, slow god rays, drifting
 * particles at three depths, occasional rising bubble trails, and gentle
 * pointer parallax.
 *
 * Performance guardrails (ported from the portfolio's EnergyField):
 * - pixel ratio capped at 1 on phones and 1.25 on desktop; the light is soft,
 *   so retina resolution buys nothing visible
 * - 30fps, or 24 on phones; fewer particles and caustic lines on small screens
 * - waits for the browser to go idle before drawing anything, so it never
 *   competes with hydration or the first paint
 * - pauses when scrolled offscreen or when the tab is hidden
 * - one still frame when reduced motion is preferred
 * - gradients and the particle sprite are built once per resize, not per frame
 */
export function HeroCanvas({ className, causticsOnly = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const small = window.matchMedia("(max-width: 767px)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const FRAME_MS = 1000 / (small ? 24 : 30);
    const CAUSTIC_LINES = small ? 7 : 11;
    const STEP = small ? 18 : 14;
    const RAYS = small ? 4 : 6;
    const PARTICLES = small ? 34 : 78;

    let width = 0;
    let height = 0;
    let raf = 0;
    let last = 0;
    let ready = false;
    let inView = true;
    let causticStroke: CanvasGradient | null = null;
    let rayFill: CanvasGradient | null = null;
    let sprite: HTMLCanvasElement | null = null;
    const start = performance.now();
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

    // A seeded random, so the scene is the same on every load.
    let seed = 7;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    const particles: Particle[] = Array.from({ length: PARTICLES }, () => {
      const z = [0.35, 0.65, 1][Math.floor(random() * 3)];
      return {
        x: random(),
        y: random(),
        z,
        r: (0.6 + random() * 1.3) * z,
        a: 0.18 + random() * 0.4 * z,
        vy: (0.004 + random() * 0.008) * z,
        phase: random() * TAU,
      };
    });

    const rays = Array.from({ length: RAYS }, (_, i) => ({
      x: (i + 0.35 + random() * 0.4) / RAYS,
      top: 36 + random() * 70,
      bottom: 180 + random() * 260,
      length: 0.72 + random() * 0.3,
      lean: (random() - 0.5) * 0.22,
      phase: random() * TAU,
      speed: 0.6 + random() * 0.6,
    }));

    let trails: Trail[] = [];
    let nextTrail = 1800;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, small ? 1 : 1.25);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const band = height * 0.46;
      causticStroke = ctx.createLinearGradient(0, 0, 0, band);
      causticStroke.addColorStop(0, "rgba(214, 248, 245, 0.13)");
      causticStroke.addColorStop(0.45, "rgba(170, 232, 228, 0.06)");
      causticStroke.addColorStop(1, "rgba(127, 214, 208, 0)");

      rayFill = ctx.createLinearGradient(0, 0, 0, height);
      rayFill.addColorStop(0, "rgba(200, 240, 238, 0.5)");
      rayFill.addColorStop(0.55, "rgba(127, 214, 208, 0.12)");
      rayFill.addColorStop(1, "rgba(127, 214, 208, 0)");

      // One soft dot, drawn once and stamped for every particle.
      sprite = document.createElement("canvas");
      sprite.width = sprite.height = 32;
      const s = sprite.getContext("2d");
      if (s) {
        const g = s.createRadialGradient(16, 16, 0, 16, 16, 16);
        g.addColorStop(0, "rgba(234, 244, 248, 1)");
        g.addColorStop(0.35, "rgba(234, 244, 248, 0.55)");
        g.addColorStop(1, "rgba(234, 244, 248, 0)");
        s.fillStyle = g;
        s.fillRect(0, 0, 32, 32);
      }
    };

    /** Two families of wavy lines near the surface. Where they cross, the light pools, like caustics. */
    const drawCaustics = (t: number) => {
      if (!causticStroke) return;
      const band = height * 0.46;
      ctx.strokeStyle = causticStroke;
      for (let family = 0; family < 2; family++) {
        const dir = family === 0 ? 1 : -1;
        const k1 = family === 0 ? 0.011 : 0.0085;
        const k2 = family === 0 ? 0.023 : 0.031;
        for (let i = 0; i < CAUSTIC_LINES; i++) {
          const f = (i + 0.5) / CAUSTIC_LINES;
          // Lines bunch up toward the surface, as if seen at an angle.
          const base = band * f * f * 0.95 + 4;
          const amp = 6 + 22 * f;
          const phase = i * 1.7 + family * 2.3;
          ctx.lineWidth = 1.2 + 2.6 * (1 - f);
          ctx.beginPath();
          for (let x = -STEP; x <= width + STEP; x += STEP) {
            const y =
              base +
              Math.sin(x * k1 + t * 0.00042 * dir + phase) * amp +
              Math.sin(x * k2 - t * 0.00067 * dir + phase * 0.6) * amp * 0.35;
            if (x === -STEP) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }
    };

    /** Shafts of light fanning down from the surface, swaying and breathing slowly. */
    const drawRays = (t: number, px: number) => {
      if (!rayFill) return;
      ctx.fillStyle = rayFill;
      for (const ray of rays) {
        const sway = Math.sin(t * 0.00011 * ray.speed + ray.phase) * 0.05;
        const breathe = 0.5 + 0.5 * Math.sin(t * 0.00019 * ray.speed + ray.phase * 1.3);
        const fan = (ray.x - 0.55) * 0.5; // rays lean away from a sun above center-right
        ctx.save();
        ctx.globalAlpha = 0.07 + 0.11 * breathe;
        ctx.translate(ray.x * width + px * 14, -10);
        ctx.rotate(fan + ray.lean + sway);
        const length = height * ray.length * 1.15;
        ctx.beginPath();
        ctx.moveTo(-ray.top / 2, 0);
        ctx.lineTo(ray.top / 2, 0);
        ctx.lineTo(ray.bottom / 2, length);
        ctx.lineTo(-ray.bottom / 2, length);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    };

    /** Marine snow at three depths. Nearer layers drift faster and move more with the pointer. */
    const drawParticles = (t: number, dt: number, px: number, py: number) => {
      if (!sprite) return;
      for (const p of particles) {
        p.y += (p.vy * dt) / 1000;
        if (p.y > 1.04) {
          p.y -= 1.08;
          p.x = random();
        }
        const x = p.x * width + Math.sin(t * 0.0003 + p.phase) * 10 * p.z + px * 22 * p.z;
        const y = p.y * height + py * 14 * p.z;
        const size = p.r * 4.5;
        ctx.globalAlpha = p.a;
        ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
    };

    /** Now and then, a short trail of bubbles rises from the depths. */
    const drawBubbles = (t: number, px: number) => {
      if (t > nextTrail && trails.length < 3) {
        trails.push({
          x: 0.12 + random() * 0.76,
          born: t,
          count: 5 + Math.floor(random() * 4),
          speed: 34 + random() * 30,
          wobble: 3 + random() * 5,
          size: 1.6 + random() * 1.8,
        });
        nextTrail = t + (small ? 4200 : 2800) + random() * 3200;
      }
      ctx.lineWidth = 1;
      trails = trails.filter((trail) => {
        let alive = false;
        for (let j = 0; j < trail.count; j++) {
          const age = (t - trail.born - j * 240) / 1000;
          if (age < 0) {
            alive = true;
            continue;
          }
          const y = height + 12 - age * trail.speed * (1 + j * 0.04);
          if (y < -12) continue;
          alive = true;
          const x = trail.x * width + Math.sin(age * 3.2 + j) * trail.wobble + px * 18;
          const r = trail.size * (0.7 + 0.45 * ((j * 37) % 5) / 5) * (1 + (1 - y / height) * 0.35);
          const fade = Math.min(1, Math.max(0, y / (height * 0.25)));
          ctx.globalAlpha = 0.5 * fade;
          ctx.strokeStyle = "rgba(234, 244, 248, 1)";
          ctx.beginPath();
          ctx.arc(x, y, r, 0, TAU);
          ctx.stroke();
          ctx.globalAlpha = 0.35 * fade;
          ctx.fillStyle = "rgba(234, 244, 248, 1)";
          ctx.fillRect(x - r * 0.45, y - r * 0.5, 1, 1);
        }
        return alive;
      });
      ctx.globalAlpha = 1;
    };

    let lastDraw = start;
    const draw = (now: number) => {
      const t = now - start;
      const dt = Math.min(100, now - lastDraw);
      lastDraw = now;
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";
      if (!causticsOnly) drawRays(t, pointer.x);
      drawCaustics(t);
      ctx.globalCompositeOperation = "source-over";
      if (!causticsOnly) {
        drawParticles(t, dt, pointer.x, pointer.y);
        drawBubbles(t, pointer.x);
      }
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < FRAME_MS) return;
      last = now;
      draw(now);
    };

    const play = () => {
      if (!raf && ready && inView && !document.hidden && !reducedQuery.matches) {
        lastDraw = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };
    const pause = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    // Nothing is drawn until the browser is idle: the CSS water is the first
    // frame, and the canvas fades in over it, so it never delays the headline.
    let sized = false;
    const resizeObserver = new ResizeObserver(() => {
      if (!sized) return;
      resize();
      if (!raf) draw(performance.now());
    });
    resizeObserver.observe(canvas);

    const intersection = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) play();
      else pause();
    });
    intersection.observe(canvas);

    const onVisibility = () => (document.hidden ? pause() : play());
    document.addEventListener("visibilitychange", onVisibility);

    const onMotionChange = () => {
      if (reducedQuery.matches) {
        pause();
        if (sized) draw(start + 6000);
      } else play();
    };
    reducedQuery.addEventListener("change", onMotionChange);

    // Gentle parallax toward the pointer, mouse and trackpad only.
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || reducedQuery.matches) return;
      const rect = canvas.getBoundingClientRect();
      pointer.tx = Math.max(-1, Math.min(1, (event.clientX - rect.left) / (rect.width / 2) - 1));
      pointer.ty = Math.max(-1, Math.min(1, (event.clientY - rect.top) / (rect.height / 2) - 1));
    };
    if (finePointer) window.addEventListener("pointermove", onPointer, { passive: true });

    const startWhenIdle = () => {
      sized = true;
      resize();
      draw(start + 6000);
      canvas.setAttribute("data-ready", "");
      ready = true;
      play();
    };
    const idle = typeof window.requestIdleCallback === "function";
    const handle = idle
      ? window.requestIdleCallback(startWhenIdle, { timeout: 2500 })
      : window.setTimeout(startWhenIdle, 1200);

    return () => {
      if (idle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
      pause();
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reducedQuery.removeEventListener("change", onMotionChange);
      window.removeEventListener("pointermove", onPointer);
    };
  }, [causticsOnly]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
