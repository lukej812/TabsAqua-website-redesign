/**
 * The surface and the descent: the scroll mapping, the lighter 2D water scene,
 * every fallback, text contrast over the moving water, and the optional footage.
 * The 3D world, the default tier, has its own file: tests/world.spec.ts.
 *
 * Port 3100 is the site as it ships today (no footage, so the 3D world, and the
 * 2D scene with ?renderer=scene). Port 3101 is a build that treats the footage
 * as present; these tests serve synthetic fixtures from
 * tests/fixtures/guided-descent at the media paths (an ffmpeg test pattern, not
 * footage).
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page, type Route } from "@playwright/test";
import { descent } from "../content/site";
import { diverPose, follow, frameIndexAt, stageState, videoTimeAt } from "../lib/motion/descent";
import { SeekCoordinator, type SeekableMedia } from "../lib/video/seek-coordinator";

const SITE = "http://localhost:3100";
const MEDIA = "http://localhost:3101";
const FIXTURES = path.resolve("tests/fixtures/guided-descent");
const DURATION = 12;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".webp": "image/webp",
  ".json": "application/json",
};

/** Serves a file with HTTP range support, like a real static host. */
function fulfillFile(route: Route, file: string) {
  const body = readFileSync(file);
  const type = TYPES[path.extname(file)] ?? "application/octet-stream";
  const range = route.request().headers()["range"];
  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    const start = match?.[1] ? Number(match[1]) : 0;
    const end = match?.[2] ? Math.min(Number(match[2]), body.length - 1) : body.length - 1;
    return route.fulfill({
      status: 206,
      headers: {
        "content-type": type,
        "accept-ranges": "bytes",
        "content-range": `bytes ${start}-${end}/${body.length}`,
      },
      body: body.subarray(start, end + 1),
    });
  }
  return route.fulfill({ status: 200, headers: { "content-type": type, "accept-ranges": "bytes" }, body });
}

/** Serves the synthetic fixtures at the real media paths. `fail` paths answer 404. */
async function serveMedia(page: Page, fail: string[] = []) {
  const requests: string[] = [];
  await page.route(/\/(video\/|images\/guided-descent)/, (route) => {
    const pathname = new URL(route.request().url()).pathname;
    requests.push(pathname);
    if (fail.some((f) => pathname.endsWith(f))) return route.fulfill({ status: 404, body: "" });
    const file = pathname.startsWith("/video/frames/")
      ? path.join(FIXTURES, "frames", path.basename(pathname))
      : path.join(FIXTURES, path.basename(pathname));
    if (!existsSync(file)) return route.fulfill({ status: 404, body: "" });
    return fulfillFile(route, file);
  });
  return requests;
}

/** Collects real errors. Deliberate 404s from failed-media tests are expected. */
function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !/Failed to load resource/.test(message.text())) errors.push(message.text());
  });
  return errors;
}

/**
 * Scrolls so the descent sits at `progress` (0 to 1), measured the way
 * OceanStage does: from the top of the dive to the reef.
 */
async function scrollToProgress(page: Page, progress: number) {
  await page.evaluate((p) => {
    const dive = document.querySelector<HTMLElement>(".dive")!;
    const stage = dive.querySelector<HTMLElement>(".stage")!;
    const top = dive.getBoundingClientRect().top + window.scrollY;
    const reef = document.querySelector<HTMLElement>("#experiences")!.getBoundingClientRect().top + window.scrollY;
    const travel = reef - top - stage.offsetHeight;
    window.scrollTo({ top: top + travel * p, behavior: "instant" });
  }, progress);
}

/** Waits for the smoothed camera to settle on `progress`. The software-rendered 3D world draws about a frame a second. */
async function settle(page: Page, progress: number) {
  await expect
    .poll(async () => Number(await page.locator(".stage").getAttribute("data-progress")), { timeout: 20_000 })
    .toBeCloseTo(progress, 1);
}

async function waitForLive(page: Page, tier: string) {
  const stage = page.locator(".stage");
  await expect(stage).toHaveAttribute("data-tier", tier);
  await expect(stage).toHaveAttribute("data-live", "");
}

async function videoState(page: Page) {
  return page.locator(".stage video").evaluate((v: HTMLVideoElement) => ({
    time: v.currentTime,
    duration: v.duration,
    readyState: v.readyState,
    src: v.currentSrc,
    maxInFlight: Number(v.dataset.maxInFlight ?? 0),
    maxQueued: Number(v.dataset.maxQueued ?? 0),
  }));
}

/** Waits until the video shows the frame for `progress`. */
async function expectVideoAt(page: Page, progress: number) {
  await expect
    .poll(async () => (await videoState(page)).time, { timeout: 5000 })
    .toBeCloseTo(videoTimeAt(progress, DURATION), 0);
}

/**
 * The darkest contrast white text gets against what is behind it: hides the
 * text, screenshots, and reads the brightest background pixels under each box.
 */
async function worstContrastBehind(page: Page, selectors: string[]) {
  const boxes = await page.evaluate((list) => {
    const out: { selector: string; x: number; y: number; w: number; h: number }[] = [];
    for (const selector of list) {
      document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width && r.height && r.bottom > 0 && r.top < window.innerHeight) {
          out.push({ selector, x: r.x, y: Math.max(0, r.y), w: r.width, h: Math.min(r.height, window.innerHeight - r.y) });
        }
      });
    }
    return out;
  }, selectors);
  // Only the words disappear: the soft pools of deeper water behind them stay, as they would for a reader.
  const textOnly = selectors.flatMap((sel) => [sel, `${sel} *`]).join(", ");
  await page.addStyleTag({
    content: `${textOnly} { color: transparent !important; text-shadow: none !important; border-color: transparent !important; }
      .site-header, .gauge, .stage__diver { visibility: hidden !important; } /* measure-contrast */`,
  });
  await page.waitForTimeout(100);
  const shot = (await page.screenshot()).toString("base64");
  const ratios = await page.evaluate(
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
        // The 98th percentile: the brightest background, ignoring a stray particle.
        const bright = lums[Math.floor(lums.length * 0.98)];
        return { selector: b.selector, ratio: 1.05 / (bright + 0.05) };
      });
    },
    { shot, boxes },
  );
  await page.evaluate(() => document.querySelectorAll("style").forEach((s) => s.textContent?.includes("measure-contrast") && s.remove()));
  return ratios;
}

/* ------------------------------------------------------------------ */
/* Pure logic                                                          */
/* ------------------------------------------------------------------ */

test.describe("scroll mapping", () => {
  test("maps scroll to progress, depth, and the hand-off", () => {
    const at = (scrolled: number) => stageState({ scrolled, height: 4000, viewport: 1000 });
    expect(at(-200)).toEqual({ progress: 0, depth: 0, end: 0 });
    expect(at(1500).progress).toBeCloseTo(0.5);
    expect(at(1500).depth).toBeCloseTo(1.5);
    expect(at(1500).end).toBe(0);
    expect(at(3000)).toEqual({ progress: 1, depth: 3, end: 1 });
    expect(at(9000).progress).toBe(1);
  });

  test("maps progress to footage time and frames", () => {
    expect(videoTimeAt(0, DURATION)).toBe(0);
    expect(videoTimeAt(0.5, DURATION)).toBeCloseTo((DURATION - 1 / 30) / 2, 5);
    expect(videoTimeAt(1, DURATION)).toBeLessThan(DURATION);
    expect(videoTimeAt(0.5, Number.NaN)).toBe(0);
    expect(frameIndexAt(0, 48)).toBe(0);
    expect(frameIndexAt(1, 48)).toBe(47);
    expect(frameIndexAt(0.75, 48)).toBe(35);
  });

  test("the camera follows smoothly and always arrives", () => {
    let current = 0;
    for (let i = 0; i < 120; i++) current = follow(current, 100, 1 / 60);
    expect(current).toBe(100);
    expect(follow(0, 100, 1 / 60)).toBeGreaterThan(0);
    expect(follow(0, 100, 1 / 60)).toBeLessThan(20);
  });

  test("on phones the diver gets out of the text's way", () => {
    const state = (depth: number) => ({ progress: depth / 3, depth, end: 0 });
    expect(diverPose(state(0), true).opacity).toBe(1);
    expect(diverPose(state(0.6), true).opacity).toBe(0);
    expect(diverPose(state(1.5), false).opacity).toBe(1);
    expect(diverPose({ progress: 1, depth: 3, end: 1 }, false).y).toBeGreaterThan(0.5);
  });
});

test.describe("seek coordinator", () => {
  class FakeVideo extends EventTarget implements SeekableMedia {
    private time = 0;
    seeks: number[] = [];
    frameCallbacks: (() => void)[] = [];
    get currentTime() {
      return this.time;
    }
    set currentTime(value: number) {
      this.time = value;
      this.seeks.push(value);
    }
    finishSeek() {
      this.dispatchEvent(new Event("seeked"));
    }
  }

  const immediate = (callback: () => void) => callback();

  test("allows one active seek and one latest queued seek", () => {
    const video = new FakeVideo();
    const coordinator = new SeekCoordinator(video, { nextFrame: immediate });
    for (let i = 1; i <= 100; i++) coordinator.request(i / 10);
    expect(video.seeks).toEqual([0.1]);
    expect(coordinator.pending).toBe(10);
    expect(coordinator.stats.superseded).toBe(98);
    video.finishSeek();
    expect(video.seeks).toEqual([0.1, 10]);
    expect(coordinator.pending).toBeNull();
    video.finishSeek();
    expect(coordinator.busy).toBe(false);
    expect(coordinator.stats.maxInFlight).toBe(1);
    expect(coordinator.stats.maxQueued).toBe(1);
    coordinator.destroy();
  });

  test("handles fast changes of direction without a backlog", () => {
    const video = new FakeVideo();
    const coordinator = new SeekCoordinator(video, { nextFrame: immediate });
    const targets: number[] = [];
    for (let i = 0; i < 200; i++) {
      const t = i % 2 === 0 ? 1 + i / 100 : 9 - i / 100;
      targets.push(t);
      coordinator.request(t);
      if (i % 7 === 0) video.finishSeek();
    }
    while (coordinator.busy) video.finishSeek();
    expect(video.currentTime).toBeCloseTo(targets.at(-1)!, 5);
    expect(video.seeks.length).toBeLessThan(targets.length / 3);
    coordinator.destroy();
  });

  test("waits for the frame to be presented when requestVideoFrameCallback exists", () => {
    const video = new FakeVideo();
    (video as SeekableMedia).requestVideoFrameCallback = (callback) => video.frameCallbacks.push(callback);
    const coordinator = new SeekCoordinator(video);
    coordinator.request(1);
    coordinator.request(2);
    video.finishSeek();
    expect(coordinator.busy).toBe(true);
    expect(video.seeks).toEqual([1]);
    video.frameCallbacks.shift()!();
    expect(video.seeks).toEqual([1, 2]);
    coordinator.destroy();
  });

  test("recovers when seeked never fires", async () => {
    const video = new FakeVideo();
    const coordinator = new SeekCoordinator(video, { seekTimeoutMs: 20, nextFrame: immediate });
    coordinator.request(1);
    coordinator.request(5);
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(video.seeks).toEqual([1, 5]);
    coordinator.destroy();
  });

  test("does nothing after destroy", () => {
    const video = new FakeVideo();
    const coordinator = new SeekCoordinator(video, { nextFrame: immediate });
    coordinator.request(1);
    coordinator.request(2);
    coordinator.destroy();
    video.finishSeek();
    coordinator.request(3);
    expect(video.seeks).toEqual([1]);
  });
});

/* ------------------------------------------------------------------ */
/* The 2D water scene: where the 3D world is too heavy                 */
/* ------------------------------------------------------------------ */

/** The lighter 2D water, which the world hands over to on slow devices. */
const SCENE = "/?renderer=scene";

test.describe("the 2D water scene", () => {
  test.use({ baseURL: SITE, viewport: { width: 1440, height: 900 } });

  test("renders, sticks under the content, and never requests footage", async ({ page }) => {
    const errors = watchErrors(page);
    const requests: string[] = [];
    page.on("request", (request) => requests.push(new URL(request.url()).pathname));
    await page.goto(SCENE);
    await waitForLive(page, "scene");
    await expect(page.locator(".stage")).toHaveAttribute("data-painted", "");
    await expect(page.locator(".stage canvas")).toBeVisible();
    await expect(page.locator(".stage video")).toHaveCount(0);
    // No footage, so no footage note.
    await expect(page.locator(".stage__note")).toHaveCount(0);

    await scrollToProgress(page, 0.5);
    await settle(page, 0.5);
    const top = await page.locator(".stage").evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBe(0);
    await expect(page.getByRole("heading", { name: descent.steps[1].title })).toBeInViewport();
    expect(requests.filter((r) => r.startsWith("/video/") || r.startsWith("/images/guided-descent"))).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("gives way to the reef's own water after the descent", async ({ page }) => {
    await page.goto(SCENE);
    await waitForLive(page, "scene");
    await page.locator("#experiences").evaluate((el) => el.scrollIntoView({ behavior: "instant" }));
    // The 2D water only covers the surface and the descent. From the reef on,
    // each zone paints its own water over the stage, and the flat reef shows.
    const reef = await page.locator("#experiences").evaluate((el) => {
      const before = getComputedStyle(el, "::before");
      return { opacity: before.opacity, image: before.backgroundImage };
    });
    expect(reef.opacity).toBe("1");
    expect(reef.image).toContain("gradient");
    await expect(page.locator(".reef").first()).toBeVisible();
  });

  test("hands off to the reef without a visible seam", async ({ page }) => {
    await page.goto(SCENE);
    await waitForLive(page, "scene");
    await scrollToProgress(page, 1);
    await settle(page, 1);
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.5));
    await page.waitForTimeout(400);
    const seam = await page.locator("#experiences").evaluate((el) => el.getBoundingClientRect().top);
    const shot = (await page.screenshot()).toString("base64");
    const [above, below] = await page.evaluate(
      async ({ shot, y }) => {
        const img = new Image();
        img.src = `data:image/png;base64,${shot}`;
        await img.decode();
        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        const sample = (row: number) => Array.from(ctx.getImageData(200, row, 1, 1).data.slice(0, 3));
        return [sample(Math.round(y) - 3), sample(Math.round(y) + 3)];
      },
      { shot, y: seam },
    );
    for (let i = 0; i < 3; i++) expect(Math.abs(above[i] - below[i])).toBeLessThanOrEqual(6);
  });

  for (const { width, height, motion } of [
    { width: 1440, height: 900, motion: "no-preference" },
    { width: 375, height: 812, motion: "no-preference" },
    { width: 1440, height: 900, motion: "reduce" },
    { width: 375, height: 812, motion: "reduce" },
  ] as const) {
    test(`text over the water keeps its contrast at ${width}px, motion ${motion}`, async ({ browser }) => {
      const context = await browser.newContext({ baseURL: SITE, viewport: { width, height }, reducedMotion: motion });
      const page = await context.newPage();
      // Reduced motion keeps the stage still, even when the 2D scene is asked for.
      await page.goto(SCENE);
      if (motion === "reduce") await expect(page.locator(".stage")).toHaveAttribute("data-tier", "still");
      else await waitForLive(page, "scene");
      await page.waitForTimeout(800);
      // Large headline: 3:1. Everything else: 4.5:1.
      const hero = await worstContrastBehind(page, [".hero__title", ".hero__lede", ".hero__kicker", ".hero__facts"]);
      for (const { selector, ratio } of hero) {
        expect(ratio, selector).toBeGreaterThanOrEqual(selector === ".hero__title" ? 3 : 4.5);
      }
      for (const n of [1, 2, 3]) {
        await page.locator(`.descent__step:nth-child(${n})`).evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
        await page.waitForTimeout(700);
        const steps = await worstContrastBehind(page, [`.descent__step:nth-child(${n}) .descent__card p:not(.descent__label)`]);
        for (const { selector, ratio } of steps) expect(ratio, selector).toBeGreaterThanOrEqual(4.5);
      }
      await context.close();
    });
  }

  test("falls back to the still surface when WebGL is unavailable", async ({ page }) => {
    const errors = watchErrors(page);
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        if (type === "webgl" || type === "webgl2") return null;
        return (original as (...args: unknown[]) => RenderingContext | null).call(this, type, ...rest);
      } as typeof original;
    });
    await page.goto("/");
    await expect(page.locator(".stage")).toHaveAttribute("data-tier", "static");
    await expect(page.locator(".surface-art")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("uses one still frame with reduced motion, and the steps read in normal flow", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: SITE, reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto("/");
    const stage = page.locator(".stage");
    // One frame of the world, drawn once: nothing moves, and the stage is not pinned.
    await expect(stage).toHaveAttribute("data-tier", "still");
    await expect(stage).toHaveAttribute("data-painted", "");
    await expect(stage).not.toHaveAttribute("data-live", "");
    expect(await stage.evaluate((el) => getComputedStyle(el).position)).toBe("relative");
    for (const step of descent.steps) {
      await expect(page.getByRole("heading", { name: step.title })).toBeVisible();
    }
    await context.close();
  });

  test("reads in normal flow without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: SITE, javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator(".stage")).toHaveAttribute("data-tier", "pending");
    await expect(page.locator(".surface-art")).toBeVisible();
    for (const step of descent.steps) {
      const heading = page.getByRole("heading", { name: step.title });
      await heading.scrollIntoViewIfNeeded();
      await expect(heading).toBeVisible();
    }
    await expect(page.locator(".descent__actions").getByRole("link", { name: /Book Discover Scuba/ })).toBeVisible();
    await context.close();
  });

  test("names each step for assistive technology, in order", async ({ page }) => {
    await page.goto("/");
    const steps = page.locator(".descent__steps > li");
    await expect(steps).toHaveCount(descent.steps.length);
    for (const [i, step] of descent.steps.entries()) {
      await expect(steps.nth(i)).toContainText(`Step ${i + 1} of ${descent.steps.length}:`);
      await expect(steps.nth(i)).toContainText(step.title);
    }
    // The decorative layers stay out of the accessibility tree.
    await expect(page.locator(".stage__art")).toHaveAttribute("aria-hidden", "true");
    await expect(page.locator(".stage__diver")).toHaveAttribute("aria-hidden", "true");
    await expect(page.locator(".stage canvas")).toHaveAttribute("aria-hidden", "true");
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
    await page.goto(SCENE);
    await waitForLive(page, "scene");
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => (window as unknown as { cls: number }).cls)).toBeLessThan(0.02);
  });

  test("stops drawing when the scene is off screen", async ({ page }) => {
    await page.goto(SCENE);
    await waitForLive(page, "scene");
    // Jump straight there: a smooth scroll would still be passing the stage.
    await page.locator("#faq").evaluate((el) => el.scrollIntoView({ behavior: "instant" }));
    await page.waitForTimeout(600);
    const frames = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          const canvas = document.querySelector<HTMLCanvasElement>(".stage canvas")!;
          const gl = canvas.getContext("webgl")!;
          let draws = 0;
          const original = gl.drawArrays.bind(gl);
          gl.drawArrays = (...args) => {
            draws++;
            return original(...args);
          };
          setTimeout(() => resolve(draws), 600);
        }),
    );
    expect(frames).toBe(0);
  });

  for (const viewport of [
    { width: 375, height: 812 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ]) {
    test(`screenshots the descent at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(SCENE);
      await waitForLive(page, "scene");
      for (const p of [0, 0.25, 0.5, 0.75, 1]) {
        await scrollToProgress(page, p);
        await settle(page, p);
        await page.waitForTimeout(300);
        await page.screenshot({ path: `test-results/screenshots/descent-${viewport.width}-${Math.round(p * 100)}.png` });
      }
    });
  }
});

/* ------------------------------------------------------------------ */
/* With footage (synthetic fixtures)                                   */
/* ------------------------------------------------------------------ */

test.describe("with footage", () => {
  test.use({ baseURL: MEDIA, viewport: { width: 1440, height: 900 } });

  test("loads metadata, then scrubs to 0, 25, 50, 75, and 100%", async ({ page }) => {
    const errors = watchErrors(page);
    await serveMedia(page);
    await page.goto("/");
    await waitForLive(page, "video");
    await expect.poll(async () => (await videoState(page)).readyState).toBeGreaterThanOrEqual(1);
    expect((await videoState(page)).duration).toBeCloseTo(DURATION, 0);
    expect((await videoState(page)).src).toMatch(/guided-descent\.mp4$/);
    await expect(page.locator(".stage__note")).toHaveText(descent.footageNote);
    // Real footage replaces the illustrated diver.
    await expect(page.locator(".stage__diver")).toBeHidden();
    for (const p of [0, 0.25, 0.5, 0.75, 1]) {
      await scrollToProgress(page, p);
      await settle(page, p);
      await expectVideoAt(page, p);
    }
    expect(errors).toEqual([]);
  });

  test("scrubs backwards when scrolling up", async ({ page }) => {
    await serveMedia(page);
    await page.goto("/");
    await waitForLive(page, "video");
    await scrollToProgress(page, 0.9);
    await settle(page, 0.9);
    await expectVideoAt(page, 0.9);
    await scrollToProgress(page, 0.2);
    await settle(page, 0.2);
    await expectVideoAt(page, 0.2);
  });

  test("rapid changes of direction never queue more than one seek", async ({ page }) => {
    const errors = watchErrors(page);
    await serveMedia(page);
    await page.goto("/");
    await waitForLive(page, "video");
    await expect.poll(async () => (await videoState(page)).readyState).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < 40; i++) {
      await scrollToProgress(page, i % 2 === 0 ? 0.1 + (i % 7) * 0.05 : 0.95 - (i % 5) * 0.08);
      await page.waitForTimeout(16);
    }
    await scrollToProgress(page, 0.6);
    await settle(page, 0.6);
    await expectVideoAt(page, 0.6);
    const state = await videoState(page);
    expect(state.maxInFlight).toBeLessThanOrEqual(1);
    expect(state.maxQueued).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });

  test("stays in sync after a resize", async ({ page }) => {
    await serveMedia(page);
    await page.goto("/");
    await waitForLive(page, "video");
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.setViewportSize({ width: 900, height: 1000 });
    await page.waitForTimeout(300);
    await scrollToProgress(page, 0.5);
    await settle(page, 0.5);
    await expectVideoAt(page, 0.5);
  });

  test("keeps working after back and forward navigation", async ({ page }) => {
    const errors = watchErrors(page);
    await serveMedia(page);
    await page.goto("/");
    await waitForLive(page, "video");
    await scrollToProgress(page, 0.4);
    await settle(page, 0.4);
    await page.goto("/robots.txt");
    await page.goBack();
    await page.goForward();
    await page.goBack();
    await waitForLive(page, "video");
    await scrollToProgress(page, 0.75);
    await settle(page, 0.75);
    await expectVideoAt(page, 0.75);
    expect(errors).toEqual([]);
  });

  test("falls back to WebM when the MP4 fails", async ({ page }) => {
    await serveMedia(page, ["/video/guided-descent.mp4"]);
    await page.goto("/");
    await waitForLive(page, "video");
    await expect.poll(async () => (await videoState(page)).src).toMatch(/guided-descent\.webm$/);
    await scrollToProgress(page, 0.5);
    await settle(page, 0.5);
    await expectVideoAt(page, 0.5);
  });

  test("uses the MP4 when the WebM fails", async ({ page }) => {
    await serveMedia(page, ["/video/guided-descent.webm"]);
    await page.goto("/");
    await waitForLive(page, "video");
    await expect.poll(async () => (await videoState(page)).src).toMatch(/guided-descent\.mp4$/);
  });

  test("switches to the 3D world when both video sources fail", async ({ page }) => {
    await serveMedia(page, ["/video/guided-descent.mp4", "/video/guided-descent.webm"]);
    await page.goto("/");
    await waitForLive(page, "world");
    await expect(page.locator(".stage video")).toHaveCount(0);
    await scrollToProgress(page, 0.8);
    await settle(page, 0.8);
    await expect(page.getByRole("heading", { name: descent.close.title })).toBeAttached();
  });

  test("does not load footage with reduced motion, and shows the poster", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: MEDIA, reducedMotion: "reduce" });
    const page = await context.newPage();
    const requests = await serveMedia(page);
    await page.goto("/");
    await expect(page.locator(".stage")).toHaveAttribute("data-tier", "static");
    const poster = page.locator(".stage__poster img");
    await expect.poll(() => poster.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    await page.waitForTimeout(500);
    expect(requests.filter((r) => r.startsWith("/video/"))).toEqual([]);
    await context.close();
  });

  test("keeps content and booking usable on a slow connection", async ({ page }) => {
    const client = await page.context().newCDPSession(page);
    await client.send("Network.enable");
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 400,
      downloadThroughput: (400 * 1024) / 8,
      uploadThroughput: (400 * 1024) / 8,
    });
    await serveMedia(page);
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Explore dives" })).toBeVisible();
    await scrollToProgress(page, 0.95);
    await expect(page.locator(".descent__actions").getByRole("link", { name: /Book Discover Scuba/ })).toBeInViewport();
  });

  test("does not grow memory when scrolled through repeatedly", async ({ page }) => {
    // A soak test: slow on software-rendered CI machines.
    test.setTimeout(90_000);
    await serveMedia(page);
    await page.goto("/");
    await waitForLive(page, "video");
    const client = await page.context().newCDPSession(page);
    const heap = async () => {
      await client.send("HeapProfiler.collectGarbage");
      return (await client.send("Runtime.getHeapUsage")).usedSize;
    };
    await scrollToProgress(page, 1);
    await settle(page, 1);
    await scrollToProgress(page, 0);
    await settle(page, 0);
    const before = await heap();
    for (let round = 0; round < 8; round++) {
      for (const p of [0.2, 0.5, 0.8, 1, 0.6, 0.3, 0]) await scrollToProgress(page, p);
      await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    }
    await page.waitForTimeout(500);
    const after = await heap();
    expect(after - before).toBeLessThan(2 * 1024 * 1024);
  });
});

test.describe("with footage on a phone", () => {
  test.use({ baseURL: MEDIA, viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });

  test("uses the mobile cut", async ({ page }) => {
    await serveMedia(page);
    await page.goto("/");
    await waitForLive(page, "video");
    await expect.poll(async () => (await videoState(page)).src).toMatch(/guided-descent-mobile\.mp4$/);
  });

  test("the static tier shows the phone poster", async ({ page }) => {
    await serveMedia(page);
    await page.goto("/?renderer=static");
    await expect(page.locator(".stage")).toHaveAttribute("data-tier", "static");
    await expect(page.locator(".stage video")).toHaveCount(0);
    const poster = page.locator(".stage__poster img");
    await expect.poll(() => poster.evaluate((img: HTMLImageElement) => img.currentSrc)).toMatch(/guided-descent-mobile\.webp$/);
  });
});

test.describe("frame-sequence fallback", () => {
  test.use({ baseURL: MEDIA, viewport: { width: 1440, height: 900 } });

  test("draws the first frame, follows scroll, and loads nearby frames first", async ({ page }) => {
    const requests = await serveMedia(page);
    await page.goto("/?renderer=frames");
    await waitForLive(page, "frames");
    const canvas = page.locator(".stage canvas");
    await expect(canvas).toHaveAttribute("data-frame", "0");
    expect(requests.find((r) => r.includes("/frames/frame-"))).toBe("/video/frames/frame-0001.webp");
    await scrollToProgress(page, 0.75);
    await settle(page, 0.75);
    await expect
      .poll(async () => Number(await canvas.getAttribute("data-frame")), { timeout: 5000 })
      .toBe(frameIndexAt(0.75, 48));
    const ratio = await canvas.evaluate((c: HTMLCanvasElement) => c.width / c.getBoundingClientRect().width);
    expect(ratio).toBeLessThanOrEqual(1.5);
  });
});
