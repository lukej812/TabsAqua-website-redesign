/**
 * The 3D world behind the dive: the camera path and its framing, loading after
 * the first paint, text contrast over the world measured from rendered pixels,
 * drawing only while visible, the still frame for reduced motion, and the
 * hand-overs to the 2D water.
 *
 * The browser here renders WebGL in software (SwiftShader), at a fraction of a
 * real GPU's speed, so these tests wait for the camera to settle rather than
 * timing anything.
 */
import { expect, test, type Page } from "@playwright/test";
import { FRAME, pathAt, pathIndex, REST_WATERLINE, SHOTS, viewFor, type V3 } from "../lib/world/path";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Where a point lands across the frame (0 left, 1 right) for a camera at `cam` looking at `look`. */
function screenX(cam: V3, look: V3, point: V3, fov: number, aspect: number): number {
  const f = [look[0] - cam[0], look[1] - cam[1], look[2] - cam[2]];
  const fl = Math.hypot(f[0], f[1], f[2]);
  const fw = [f[0] / fl, f[1] / fl, f[2] / fl];
  // Right = forward x up, so screen right is -x when looking down +z.
  const r = [-fw[2], 0, fw[0]];
  const rl = Math.hypot(r[0], r[2]);
  const d = [point[0] - cam[0], point[1] - cam[1], point[2] - cam[2]];
  const depth = d[0] * fw[0] + d[1] * fw[1] + d[2] * fw[2];
  const across = (d[0] * r[0] + d[2] * r[2]) / rl;
  return 0.5 + across / (depth * Math.tan((fov * Math.PI) / 360) * aspect) / 2;
}

async function waitForWorld(page: Page) {
  const stage = page.locator(".stage");
  await expect(stage).toHaveAttribute("data-tier", "world");
  await expect(stage).toHaveAttribute("data-live", "");
  await expect(stage).toHaveAttribute("data-painted", "", { timeout: 20_000 });
}

/** Scrolls so `selector`'s top sits at `at` of the viewport, then waits for the camera to catch up. */
async function goToShot(page: Page, selector: string, at: number) {
  await page.evaluate(
    ({ selector, at }) => {
      // Cleared first, so only a frame drawn after this scroll can set it again.
      document.querySelector(".stage")!.removeAttribute("data-settled");
      const top = document.querySelector(selector)!.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top - at * window.innerHeight, behavior: "instant" });
    },
    { selector, at },
  );
  await expect(page.locator(".stage")).toHaveAttribute("data-settled", "", { timeout: 60_000 });
}

/** Counts WebGL 2 draw calls on the stage canvas over `ms`. */
async function drawsOver(page: Page, ms: number) {
  return page.evaluate(
    (ms) =>
      new Promise<number>((resolve) => {
        const canvas = document.querySelector<HTMLCanvasElement>(".stage canvas")!;
        const gl = canvas.getContext("webgl2")! as unknown as Record<string, (...args: unknown[]) => unknown>;
        let draws = 0;
        for (const name of ["drawArrays", "drawElements", "drawArraysInstanced", "drawElementsInstanced"]) {
          const original = gl[name].bind(gl);
          gl[name] = (...args: unknown[]) => {
            draws++;
            return original(...args);
          };
        }
        setTimeout(() => resolve(draws), ms);
      }),
    ms,
  );
}

/**
 * Contrast of every visible text in the dive against what is behind it: hides
 * the words, screenshots, and compares each text's own color with the
 * brightest (or, for dark text, darkest) background pixels inside a tight box
 * around its lines.
 */
async function textContrast(page: Page) {
  const boxes = await page.evaluate(() => {
    const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    const header = document.querySelector(".site-header")!.getBoundingClientRect().bottom;
    const out: { text: string; x: number; y: number; w: number; h: number; fg: number; large: boolean }[] = [];
    document.querySelectorAll<HTMLElement>(".dive__content *").forEach((el) => {
      if (el.closest(".planner, .btn, .sr-only, select, input, textarea")) return;
      const range = document.createRange();
      const rects: DOMRect[] = [];
      el.childNodes.forEach((node) => {
        if (node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) return;
        range.selectNodeContents(node);
        rects.push(...Array.from(range.getClientRects()));
      });
      if (!rects.length) return;
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || Number(style.opacity) === 0) return;
      const left = Math.min(...rects.map((r) => r.left));
      const right = Math.max(...rects.map((r) => r.right));
      // Trim each line's leading so the box holds the letters, not the gaps between lines.
      const pad = ((Math.max(...rects.map((r) => r.bottom)) - Math.min(...rects.map((r) => r.top))) / rects.length) * 0.18;
      const top = Math.max(header, Math.min(...rects.map((r) => r.top)) + pad);
      const bottom = Math.min(window.innerHeight, Math.max(...rects.map((r) => r.bottom)) - pad);
      if (bottom - top < 3 || right - left < 3) return;
      const [r, g, b] = style.color.match(/[\d.]+/g)!.map(Number);
      const size = parseFloat(style.fontSize);
      out.push({
        text: el.textContent!.trim().slice(0, 40),
        x: left,
        y: top,
        w: right - left,
        h: bottom - top,
        fg: 0.2126 * lin(r / 255) + 0.7152 * lin(g / 255) + 0.0722 * lin(b / 255),
        large: size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700),
      });
    });
    return out;
  });
  await page.addStyleTag({
    content: `.dive__content, .dive__content * { color: transparent !important; text-shadow: none !important; }
      .site-header, .gauge, .book-bar { visibility: hidden !important; } /* measure-contrast */`,
  });
  await page.waitForTimeout(150);
  const shot = (await page.screenshot()).toString("base64");
  await page.evaluate(() => document.querySelectorAll("style").forEach((s) => s.textContent?.includes("measure-contrast") && s.remove()));
  return page.evaluate(
    async ({ shot, boxes }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${shot}`;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const scale = img.width / window.innerWidth;
      const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      return boxes.map((b) => {
        const data = ctx.getImageData(b.x * scale, b.y * scale, Math.max(1, b.w * scale), Math.max(1, b.h * scale)).data;
        const lums: number[] = [];
        for (let i = 0; i < data.length; i += 16) {
          lums.push(0.2126 * lin(data[i] / 255) + 0.7152 * lin(data[i + 1] / 255) + 0.0722 * lin(data[i + 2] / 255));
        }
        lums.sort((a, z) => a - z);
        // Light text against the brightest 2% of what is behind it; dark text against the darkest.
        const bg = b.fg > 0.4 ? lums[Math.floor(lums.length * 0.98)] : lums[Math.floor(lums.length * 0.02)];
        const ratio = (Math.max(b.fg, bg) + 0.05) / (Math.min(b.fg, bg) + 0.05);
        return { text: b.text, ratio, need: b.large ? 3 : 4.5 };
      });
    },
    { shot, boxes },
  );
}

/* ------------------------------------------------------------------ */
/* The camera path                                                     */
/* ------------------------------------------------------------------ */

test.describe("camera path", () => {
  test("maps scroll between the shots' marks", () => {
    const marks = [0, 100, 300];
    expect(pathIndex(-50, marks)).toBe(0);
    expect(pathIndex(50, marks)).toBeCloseTo(0.5);
    expect(pathIndex(200, marks)).toBeCloseTo(1.5);
    expect(pathIndex(900, marks)).toBe(2);
  });

  test("starts at the surface, goes under, and surfaces again at the end", () => {
    expect(pathAt(0, false).waterline).toBe(REST_WATERLINE.wide);
    expect(pathAt(0, true).waterline).toBe(REST_WATERLINE.phone);
    // The sinking beat keeps the waterline in frame, high up.
    expect(pathAt(1, false).waterline).toBeGreaterThan(REST_WATERLINE.wide);
    expect(pathAt(1, false).waterline).toBeLessThan(1);
    for (let i = 2; i < SHOTS.length - 1; i++) expect(pathAt(i, false).waterline, SHOTS[i].anchor).toBeGreaterThan(1.15);
    expect(pathAt(SHOTS.length - 1, false).waterline).toBe(REST_WATERLINE.wide);
  });

  test("keeps each shot's subject right of the text on wide screens, and in frame on phones", () => {
    for (const [i, shot] of SHOTS.entries()) {
      const subject = shot.subject ?? shot.diver;
      const wide = pathAt(i, false);
      const phone = pathAt(i, true);
      const x = screenX(wide.cam, wide.look, subject, FRAME.wide.fov, FRAME.wide.aspect);
      const y = screenX(phone.cam, phone.look, subject, FRAME.phone.fov, FRAME.phone.aspect);
      // The text column ends near 61% of a 1280px screen.
      expect(x, `${shot.anchor}, wide`).toBeGreaterThan(0.66);
      expect(x, `${shot.anchor}, wide`).toBeLessThan(0.92);
      expect(y, `${shot.anchor}, phone`).toBeGreaterThan(0.35);
      expect(y, `${shot.anchor}, phone`).toBeLessThan(0.85);
    }
  });

  test("frames for the real screen: right of the measured column, or just off center when portrait", () => {
    // 1280 wide, column ending at 784px: a little under halfway into the open water.
    const wide = viewFor(1280, 800, 784);
    expect(wide.portrait).toBe(false);
    expect(wide.x).toBeGreaterThan(784 / 1280);
    expect(wide.x).toBeLessThan(0.85);
    // A landscape tablet: the column takes more of the width, so the subject moves right.
    expect(viewFor(1024, 768, 755).x).toBeGreaterThan(wide.x);
    // Portrait tablets and phones.
    expect(viewFor(768, 1024, 704)).toMatchObject({ portrait: true, x: FRAME.phone.x, fov: FRAME.phone.fov });
    for (const [i, shot] of SHOTS.entries()) {
      for (const [w, h, end] of [
        [1024, 768, 755],
        [1920, 1080, 1104],
        [768, 1024, 704],
      ] as const) {
        const view = viewFor(w, h, end);
        const p = pathAt(i, false, SHOTS, view);
        const x = screenX(p.cam, p.look, shot.subject ?? shot.diver, view.fov, view.aspect);
        expect(x, `${shot.anchor} at ${w}x${h}`).toBeGreaterThan(view.portrait ? 0.35 : end / w + 0.03);
        expect(x, `${shot.anchor} at ${w}x${h}`).toBeLessThan(0.95);
      }
    }
  });

  test("never puts the camera under the sand or above the surface", () => {
    for (let u = 0; u <= SHOTS.length - 1; u += 0.05) {
      for (const phone of [false, true]) {
        const { cam } = pathAt(u, phone);
        expect(cam[1]).toBeLessThan(0);
        expect(cam[1]).toBeGreaterThan(-9);
      }
    }
  });
});

/* ------------------------------------------------------------------ */
/* The world in the page                                               */
/* ------------------------------------------------------------------ */

test.describe("the 3D world", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("renders behind the dive, replaces the flat art, and never requests footage", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
    const requests: string[] = [];
    page.on("request", (request) => requests.push(new URL(request.url()).pathname));
    await page.goto("/");
    await waitForWorld(page);
    await expect(page.locator(".stage canvas")).toBeVisible();
    // The zones' own water and the flat reef step aside: the world is one continuous place.
    await expect
      .poll(() => page.locator("#experiences").evaluate((el) => getComputedStyle(el, "::before").opacity))
      .toBe("0");
    await expect.poll(() => page.locator(".reef").first().evaluate((el) => getComputedStyle(el).opacity)).toBe("0");
    // The stage stays pinned behind the content all the way to the shore.
    await page.locator("#tabitha").evaluate((el) => el.scrollIntoView({ behavior: "instant" }));
    expect(await page.locator(".stage").evaluate((el) => el.getBoundingClientRect().top)).toBe(0);
    expect(requests.filter((r) => r.startsWith("/video/") || r.startsWith("/images/guided-descent"))).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("loads three.js only after the page has painted", async ({ page }) => {
    await page.goto("/");
    await waitForWorld(page);
    const timing = await page.evaluate(async () => {
      const fcp = performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0;
      const scripts = performance.getEntriesByType("resource").filter((e) => e.name.endsWith(".js")) as PerformanceResourceTiming[];
      // three.js keeps its own warning strings through minification.
      for (const script of scripts) {
        const text = await (await fetch(script.name)).text();
        if (text.includes("THREE.WebGLRenderer")) return { fcp, start: script.startTime };
      }
      return { fcp, start: -1 };
    });
    expect(timing.start).toBeGreaterThan(timing.fcp);
  });

  test("follows the camera path, section by section", async ({ page }) => {
    test.setTimeout(150_000);
    await page.goto("/");
    await waitForWorld(page);
    for (const anchor of ["#first-dive", "#experiences", "#certification", "#tabitha", "#groups"]) {
      const index = SHOTS.findIndex((s) => s.anchor === anchor);
      await goToShot(page, anchor, SHOTS[index].at);
      expect(Number(await page.locator(".stage").getAttribute("data-path")), anchor).toBeCloseTo(index, 0);
    }
  });

  for (const { width, height } of [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 375, height: 812 },
  ]) {
    test(`text over the world keeps AA contrast at ${width}px`, async ({ browser }) => {
      test.setTimeout(240_000);
      const context = await browser.newContext({ viewport: { width, height } });
      const page = await context.newPage();
      await page.goto("/");
      await waitForWorld(page);
      // Measure the words, not a fade: show everything the reveal script holds back.
      await page.addStyleTag({ content: "[data-reveal] { opacity: 1 !important; transform: none !important; transition: none !important; }" });
      const stops: [string, number][] = [
        ["#top", 0],
        ["#top", -0.5],
        ["#first-dive", 0.2],
        [".descent__step:nth-child(2)", 0.5],
        ["#experiences", 0.35],
        ["#snorkeling", 0.35],
        ["#guided-tours", 0.35],
        ["#certification", 0.35],
        ["#tabitha", 0.35],
        ["#groups", 0.35],
      ];
      for (const [selector, at] of stops) {
        await goToShot(page, selector, at);
        const failing = (await textContrast(page)).filter((r) => r.ratio < r.need);
        expect(failing, `${selector} at ${at}`).toEqual([]);
      }
      await context.close();
    });
  }

  test("stops drawing when the dive is off screen", async ({ page }) => {
    await page.goto("/");
    await waitForWorld(page);
    // Software rendering draws about a frame a second here, so the windows are long.
    expect(await drawsOver(page, 3000)).toBeGreaterThan(0);
    await page.locator("#faq").evaluate((el) => el.scrollIntoView({ behavior: "instant" }));
    await page.waitForTimeout(2000);
    expect(await drawsOver(page, 2000)).toBe(0);
  });

  test("draws one still frame with reduced motion, then nothing", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto("/");
    const stage = page.locator(".stage");
    await expect(stage).toHaveAttribute("data-tier", "still");
    await expect(stage).toHaveAttribute("data-painted", "", { timeout: 20_000 });
    await expect(stage).not.toHaveAttribute("data-live", "");
    expect(await drawsOver(page, 2000)).toBe(0);
    // Asking for a moving tier does not override the preference.
    await page.goto("/?renderer=world");
    await expect(stage).toHaveAttribute("data-tier", "still");
    await context.close();
  });

  test("hands over to the 2D water when WebGL 2 is missing", async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        if (type === "webgl2") return null;
        return (original as (...args: unknown[]) => RenderingContext | null).call(this, type, ...rest);
      } as typeof original;
    });
    await page.goto("/");
    await expect(page.locator(".stage")).toHaveAttribute("data-tier", "scene");
    await expect(page.locator(".stage")).toHaveAttribute("data-painted", "");
  });

  test("hands over to the 2D water if the GPU drops the world", async ({ page }) => {
    await page.goto("/");
    await waitForWorld(page);
    await page.evaluate(() => {
      const gl = document.querySelector<HTMLCanvasElement>(".stage canvas")!.getContext("webgl2")!;
      gl.getExtension("WEBGL_lose_context")!.loseContext();
    });
    await expect(page.locator(".stage")).toHaveAttribute("data-tier", "scene");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("does not shift the layout while it starts up", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { cls: number }).cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
          if (!entry.hadRecentInput) (window as unknown as { cls: number }).cls += entry.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto("/");
    await waitForWorld(page);
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => (window as unknown as { cls: number }).cls)).toBeLessThan(0.02);
  });

  for (const viewport of [
    { width: 375, height: 812 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ]) {
    test(`screenshots the dive at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      test.setTimeout(240_000);
      await page.setViewportSize(viewport);
      await page.goto("/");
      await waitForWorld(page);
      const stops: [string, number, string][] = [
        ["#top", 0, "surface"],
        ["#top", -0.5, "sinking"],
        ["#first-dive", 0.2, "descent"],
        ["#experiences", 0.35, "reef"],
        ["#snorkeling", 0.35, "snorkeling"],
        ["#certification", 0.35, "deeper"],
        ["#tabitha", 0.35, "safety-stop"],
        [".dive__end", 1, "surfacing"],
        ["#book", 0, "booking"],
      ];
      for (const [selector, at, name] of stops) {
        if (name === "booking") {
          await page.locator(selector).evaluate((el) => el.scrollIntoView({ behavior: "instant" }));
          await page.waitForTimeout(600);
        } else {
          await goToShot(page, selector, at);
        }
        await page.screenshot({ path: `test-results/screenshots/world-${viewport.width}-${name}.png` });
      }
    });
  }
});
