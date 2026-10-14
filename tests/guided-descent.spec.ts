/**
 * The guided descent: logic, fallbacks, and the scroll-scrubbed video.
 *
 * Port 3100 is the site as it ships today (no media). Port 3101 is a build
 * that treats the media as present; these tests serve synthetic fixtures from
 * tests/fixtures/guided-descent at the media paths (an ffmpeg test pattern,
 * not footage).
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page, type Route } from "@playwright/test";
import { guidedDescent } from "../content/site";
import {
  chapterIndexAt,
  chapterState,
  frameIndexAt,
  videoTimeAt,
} from "../lib/motion/descent";
import { SeekCoordinator, type SeekableMedia } from "../lib/video/seek-coordinator";

const SITE = "http://localhost:3100";
const MEDIA = "http://localhost:3101";
const FIXTURES = path.resolve("tests/fixtures/guided-descent");
const ranges = guidedDescent.chapters.map((c) => c.range);
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

/** Scrolls so the descent sits at `progress` (0 to 1), measured the same way ScrollTrigger does. */
async function scrollToProgress(page: Page, progress: number) {
  await page.evaluate((p) => {
    const section = document.querySelector<HTMLElement>("#guided-descent")!;
    const stage = section.querySelector<HTMLElement>(".gd__stage")!;
    const stickyTop = parseFloat(getComputedStyle(stage).top) || 0;
    const top = section.getBoundingClientRect().top + window.scrollY;
    const start = top - stickyTop;
    const end = top + section.offsetHeight - stickyTop - stage.offsetHeight;
    window.scrollTo({ top: start + (end - start) * p, behavior: "instant" });
  }, progress);
}

/** Waits for ScrollTrigger's scrub to settle on `progress`. */
async function settle(page: Page, progress: number) {
  const gauge = page.getByRole("progressbar", { name: "Guided descent progress" });
  await expect
    .poll(async () => Number(await gauge.getAttribute("aria-valuenow")), { timeout: 5000 })
    .toBeGreaterThanOrEqual(Math.round(progress * 100) - 1);
  await expect
    .poll(async () => Number(await gauge.getAttribute("aria-valuenow")), { timeout: 5000 })
    .toBeLessThanOrEqual(Math.round(progress * 100) + 1);
}

/**
 * Waits until the scroll-driven layout is live. It switches on only while the
 * section is still below the screen, so wait before scrolling to it.
 */
async function waitForImmersive(page: Page) {
  await expect(page.locator("#guided-descent")).toHaveAttribute("data-mode", "immersive");
}

async function videoState(page: Page) {
  return page.locator("#guided-descent video").evaluate((v: HTMLVideoElement) => ({
    time: v.currentTime,
    duration: v.duration,
    readyState: v.readyState,
    src: v.currentSrc,
    maxInFlight: Number(v.dataset.maxInFlight ?? 0),
    maxQueued: Number(v.dataset.maxQueued ?? 0),
    started: Number(v.dataset.seeksStarted ?? 0),
    superseded: Number(v.dataset.seeksSuperseded ?? 0),
  }));
}

/** Waits until the video shows the frame for `progress`. */
async function expectVideoAt(page: Page, progress: number) {
  await expect
    .poll(async () => (await videoState(page)).time, { timeout: 5000 })
    .toBeCloseTo(videoTimeAt(progress, DURATION), 0);
  const { time } = await videoState(page);
  expect(Math.abs(time - videoTimeAt(progress, DURATION))).toBeLessThan(0.25);
}

/* ------------------------------------------------------------------ */
/* Logic (runs in Node, no browser)                                    */
/* ------------------------------------------------------------------ */

test.describe("progress mapping", () => {
  test("maps 0, 25, 50, 75, and 100% to chapters and video time", () => {
    const points = [0, 0.25, 0.5, 0.75, 1];
    expect(points.map((p) => chapterIndexAt(p, ranges))).toEqual([0, 1, 2, 3, 3]);
    const times = points.map((p) => videoTimeAt(p, DURATION, 30));
    expect(times[0]).toBe(0);
    expect(times[2]).toBeCloseTo((DURATION - 1 / 30) / 2, 5);
    // Never reaches the very end, so the video never fires "ended".
    expect(times[4]).toBeCloseTo(DURATION - 1 / 30, 5);
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  test("shows at most one chapter at a time, and always one away from the boundaries", () => {
    for (let i = 0; i <= 1000; i++) {
      const p = i / 1000;
      const visible = ranges.map((_, c) => chapterState(p, c, ranges).opacity).filter((o) => o > 0);
      expect(visible.length, `progress ${p}`).toBeLessThanOrEqual(1);
      const nearBoundary = ranges.some(([start]) => start > 0 && Math.abs(p - start) < 0.002);
      if (!nearBoundary) expect(visible.length, `progress ${p}`).toBe(1);
    }
  });

  test("holds each chapter fully visible for most of its range", () => {
    ranges.forEach(([start, end], c) => {
      const mid = (start + end) / 2;
      expect(chapterState(mid, c, ranges)).toEqual({ opacity: 1, offset: 0 });
    });
    expect(chapterState(0, 0, ranges).opacity).toBe(1);
    expect(chapterState(1, 3, ranges).opacity).toBe(1);
  });

  test("maps progress to frames for the image sequence", () => {
    expect([0, 0.5, 1].map((p) => frameIndexAt(p, 48))).toEqual([0, 24, 47]);
    expect(frameIndexAt(0.5, 0)).toBe(0);
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
    // Intermediate requests were dropped; it jumps straight to the latest.
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
/* As the site ships today: no media files                             */
/* ------------------------------------------------------------------ */

test.describe("without media files", () => {
  test.use({ baseURL: SITE, viewport: { width: 1440, height: 900 } });

  test("shows the illustrated stage, never requests video, and hides the dev warning", async ({ page }) => {
    const errors = watchErrors(page);
    const requests: string[] = [];
    page.on("request", (request) => requests.push(new URL(request.url()).pathname));
    await page.goto("/");
    await waitForImmersive(page);
    await expect(page.locator("#guided-descent")).toHaveAttribute("data-tier", "still");
    await expect(page.locator("#guided-descent video")).toHaveCount(0);
    await expect(page.locator(".gd-scene")).toBeVisible();
    await expect(page.locator(".gd__dev-warning")).toHaveCount(0);
    // No footage, so no footage note.
    await expect(page.locator(".gd__note")).toHaveCount(0);
    await scrollToProgress(page, 0.6);
    await settle(page, 0.6);
    await expect(page.getByRole("heading", { name: guidedDescent.chapters[2].title })).toBeVisible();
    expect(requests.filter((r) => r.startsWith("/video/") || r.startsWith("/images/guided-descent"))).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("pins the stage while scrolling and lets the page continue afterwards", async ({ page }) => {
    await page.goto("/");
    await waitForImmersive(page);
    await scrollToProgress(page, 0.5);
    const stage = page.locator("#guided-descent .gd__stage");
    const pinnedTop = await stage.evaluate((el) => el.getBoundingClientRect().top);
    await page.mouse.wheel(0, 400);
    await expect.poll(() => stage.evaluate((el) => el.getBoundingClientRect().top)).toBeCloseTo(pinnedTop, 0);
    await scrollToProgress(page, 1);
    await page.mouse.wheel(0, 1200);
    await expect(page.locator("#first-dive")).toBeInViewport();
  });

  test("uses the editorial layout with reduced motion", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: SITE, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");
    const section = page.locator("#guided-descent");
    await expect(section).toHaveAttribute("data-mode", "editorial");
    expect(await section.locator(".gd__stage").evaluate((el) => getComputedStyle(el).position)).not.toBe("sticky");
    await expect(section.locator(".gd__bubble").first()).toBeHidden();
    for (const chapter of guidedDescent.chapters) {
      const heading = page.getByRole("heading", { name: chapter.title });
      await heading.scrollIntoViewIfNeeded();
      await expect(heading).toBeVisible();
    }
    await expect(section.getByRole("link", { name: guidedDescent.cta.label })).toBeVisible();
    await context.close();
  });

  test("reads in normal flow without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: SITE, javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");
    const section = page.locator("#guided-descent");
    const height = await section.evaluate((el) => (el as HTMLElement).offsetHeight);
    expect(height).toBeLessThan(3000);
    for (const chapter of guidedDescent.chapters) {
      await expect(page.getByRole("heading", { name: chapter.title })).toBeVisible();
    }
    await context.close();
  });

  test("falls back to the editorial layout when GSAP fails to load", async ({ page }) => {
    // Block only the ScrollTrigger library chunk. "scrollerProxy" is part of its API
    // and appears nowhere else in the site's code.
    await page.route("**/_next/static/chunks/**", async (route) => {
      const response = await route.fetch();
      const body = await response.text();
      if (body.includes("scrollerProxy")) return route.abort();
      return route.fulfill({ response, body });
    });
    await page.goto("/");
    await expect(page.locator("#guided-descent")).toHaveAttribute("data-mode", "editorial");
    const stage = page.locator("#guided-descent .gd__stage");
    expect(await stage.evaluate((el) => getComputedStyle(el).position)).not.toBe("sticky");
    for (const chapter of guidedDescent.chapters) {
      const heading = page.getByRole("heading", { name: chapter.title });
      await heading.scrollIntoViewIfNeeded();
      await expect(heading).toBeVisible();
    }
    await expect(page.locator("#guided-descent").getByRole("link", { name: guidedDescent.cta.label })).toBeVisible();
  });

  test("stays editorial if the visitor reaches the section before GSAP is ready", async ({ page }) => {
    // Delay the ScrollTrigger chunk so the visitor gets there first.
    await page.route("**/_next/static/chunks/**", async (route) => {
      const response = await route.fetch();
      const body = await response.text();
      if (body.includes("scrollerProxy")) await new Promise((resolve) => setTimeout(resolve, 1500));
      return route.fulfill({ response, body });
    });
    await page.goto("/");
    await page.locator("#guided-descent").scrollIntoViewIfNeeded();
    const top = await page.locator("#guided-descent").evaluate((el) => el.getBoundingClientRect().top);
    await expect(page.locator("#guided-descent")).toHaveAttribute("data-mode", "editorial", { timeout: 8000 });
    // Nothing jumped under the visitor.
    expect(await page.locator("#guided-descent").evaluate((el) => el.getBoundingClientRect().top)).toBeCloseTo(top, 0);
  });

  test("keyboard focus on the hidden final chapter scrolls it into view without moving focus", async ({ page }) => {
    await page.goto("/");
    await waitForImmersive(page);
    await scrollToProgress(page, 0.05);
    await settle(page, 0.05);
    const cta = page.locator("#guided-descent").getByRole("link", { name: guidedDescent.cta.label });
    await cta.focus();
    await expect(cta).toBeFocused();
    await expect.poll(() => cta.evaluate((el) => Number(getComputedStyle(el.closest("li")!).opacity))).toBe(1);
    await expect(cta).toBeInViewport();
    await expect(cta).toBeFocused();
  });

  test("the final call to action goes to the experiences", async ({ page }) => {
    await page.goto("/");
    await waitForImmersive(page);
    await scrollToProgress(page, 0.95);
    await settle(page, 0.95);
    await page.locator("#guided-descent").getByRole("link", { name: guidedDescent.cta.label }).click();
    await expect(page).toHaveURL(/#experiences$/);
    await expect(page.locator("#experiences")).toBeInViewport();
  });

  test("names the current chapter for assistive technology without a live region", async ({ page }) => {
    await page.goto("/");
    await waitForImmersive(page);
    const gauge = page.getByRole("progressbar", { name: "Guided descent progress" });
    await scrollToProgress(page, 0.35);
    await settle(page, 0.35);
    await expect(gauge).toHaveAttribute("aria-valuetext", "Chapter 2 of 4: First breath");
    expect(await gauge.getAttribute("aria-live")).toBeNull();
  });

  test("does not shift the layout while it initializes", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      (window as unknown as { __cls: number }).__cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
          if (!entry.hadRecentInput) (window as unknown as { __cls: number }).__cls += entry.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await waitForImmersive(page);
    await scrollToProgress(page, 0.3);
    await settle(page, 0.3);
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    expect(cls).toBeLessThan(0.01);
  });

  for (const viewport of [
    { width: 375, height: 812 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ]) {
    test(`screenshots each chapter at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await waitForImmersive(page);
      for (const [i, chapter] of guidedDescent.chapters.entries()) {
        const mid = (chapter.range[0] + chapter.range[1]) / 2;
        await scrollToProgress(page, mid);
        await settle(page, mid);
        const title = page.getByRole("heading", { name: chapter.title });
        await expect(title).toBeInViewport();
        await page.screenshot({
          path: `test-results/screenshots/descent-${viewport.width}x${viewport.height}-${i + 1}-${chapter.id}.png`,
        });
      }
    });
  }
});

/* ------------------------------------------------------------------ */
/* With media present (synthetic fixtures)                             */
/* ------------------------------------------------------------------ */

test.describe("with video", () => {
  test.use({ baseURL: MEDIA, viewport: { width: 1440, height: 900 } });

  test("loads metadata, then scrubs to 0, 25, 50, 75, and 100%", async ({ page }) => {
    const errors = watchErrors(page);
    await serveMedia(page);
    await page.goto("/");
    await waitForImmersive(page);
    await expect(page.locator("#guided-descent")).toHaveAttribute("data-tier", "video");
    await expect.poll(async () => (await videoState(page)).readyState).toBeGreaterThanOrEqual(1);
    expect((await videoState(page)).duration).toBeCloseTo(DURATION, 0);
    expect((await videoState(page)).src).toMatch(/guided-descent\.mp4$/);
    await expect(page.locator(".gd__note")).toHaveText(guidedDescent.footageNote);

    for (const p of [0, 0.25, 0.5, 0.75, 1]) {
      await scrollToProgress(page, p);
      await settle(page, p);
      await expectVideoAt(page, p);
      const chapter = guidedDescent.chapters[chapterIndexAt(p, ranges)];
      await expect(page.getByRole("heading", { name: chapter.title })).toBeVisible();
    }
    expect(errors).toEqual([]);
  });

  test("scrubs backwards when scrolling up", async ({ page }) => {
    await serveMedia(page);
    await page.goto("/");
    await waitForImmersive(page);
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
    await waitForImmersive(page);
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

  test("stays in sync after a resize and an orientation change", async ({ page }) => {
    await serveMedia(page);
    await page.goto("/");
    await waitForImmersive(page);
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    await scrollToProgress(page, 0.5);
    await settle(page, 0.5);
    await expectVideoAt(page, 0.5);
  });

  test("keeps working after back and forward navigation", async ({ page }) => {
    const errors = watchErrors(page);
    await serveMedia(page);
    await page.goto("/");
    await waitForImmersive(page);
    await scrollToProgress(page, 0.4);
    await settle(page, 0.4);
    // Leave for another page on the site, then come back, twice.
    await page.goto("/robots.txt");
    await page.goBack();
    await page.goForward();
    await page.goBack();
    await expect(page.locator("#guided-descent")).toBeAttached();
    // Restored pages keep their state; reloaded ones start again from the top.
    const mode = await page.locator("#guided-descent").getAttribute("data-mode");
    if (mode !== "immersive") {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.reload();
      await waitForImmersive(page);
    }
    await scrollToProgress(page, 0.75);
    await settle(page, 0.75);
    await expectVideoAt(page, 0.75);
    expect(errors).toEqual([]);
  });

  test("falls back to WebM when the MP4 fails", async ({ page }) => {
    await serveMedia(page, ["/video/guided-descent.mp4"]);
    await page.goto("/");
    await waitForImmersive(page);
    await expect.poll(async () => (await videoState(page)).src).toMatch(/guided-descent\.webm$/);
    await scrollToProgress(page, 0.5);
    await settle(page, 0.5);
    await expectVideoAt(page, 0.5);
  });

  test("uses the MP4 when the WebM fails", async ({ page }) => {
    await serveMedia(page, ["/video/guided-descent.webm"]);
    await page.goto("/");
    await waitForImmersive(page);
    await expect.poll(async () => (await videoState(page)).src).toMatch(/guided-descent\.mp4$/);
  });

  test("shows the poster and keeps scrolling when both video sources fail", async ({ page }) => {
    await serveMedia(page, ["/video/guided-descent.mp4", "/video/guided-descent.webm"]);
    await page.goto("/");
    await waitForImmersive(page);
    await expect(page.locator("#guided-descent")).toHaveAttribute("data-tier", "still");
    await expect(page.locator("#guided-descent video")).toHaveCount(0);
    const poster = page.locator(".gd__poster img");
    await expect.poll(() => poster.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    await scrollToProgress(page, 0.8);
    await settle(page, 0.8);
    await expect(page.getByRole("heading", { name: guidedDescent.chapters[3].title })).toBeVisible();
  });

  test("does not load the video with reduced motion", async ({ browser }) => {
    const context = await browser.newContext({ baseURL: MEDIA, reducedMotion: "reduce" });
    const page = await context.newPage();
    const requests = await serveMedia(page);
    await page.goto("/");
    await expect(page.locator("#guided-descent")).toHaveAttribute("data-mode", "editorial");
    await page.locator("#guided-descent").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    expect(requests.filter((r) => r.startsWith("/video/"))).toEqual([]);
    await context.close();
  });

  test("keeps content usable on a slow connection", async ({ page }) => {
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
    await waitForImmersive(page);
    // Before the footage arrives, the chapters and booking link already work.
    await scrollToProgress(page, 0.95);
    await settle(page, 0.95);
    await expect(page.locator("#guided-descent").getByRole("link", { name: guidedDescent.cta.label })).toBeVisible();
  });

  test("does not grow memory when scrolled through repeatedly", async ({ page }) => {
    await serveMedia(page);
    await page.goto("/");
    await waitForImmersive(page);
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

  test("screenshots each chapter with footage at 1440x900", async ({ page }) => {
    await serveMedia(page);
    await page.goto("/");
    await waitForImmersive(page);
    for (const [i, chapter] of guidedDescent.chapters.entries()) {
      const mid = (chapter.range[0] + chapter.range[1]) / 2;
      await scrollToProgress(page, mid);
      await settle(page, mid);
      await expectVideoAt(page, mid);
      await page.screenshot({ path: `test-results/screenshots/descent-video-1440-${i + 1}-${chapter.id}.png` });
    }
  });
});

test.describe("with video on a phone", () => {
  test.use({ baseURL: MEDIA, viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });

  test("uses the mobile cut and keeps chapters clear of the book bar", async ({ page }) => {
    await serveMedia(page);
    await page.goto("/");
    await waitForImmersive(page);
    await expect.poll(async () => (await videoState(page)).src).toMatch(/guided-descent-mobile\.mp4$/);
    await scrollToProgress(page, 0.9);
    await settle(page, 0.9);
    const card = page.locator(".gd-chapter[data-active] .gd-chapter__card");
    const bar = page.locator(".book-bar");
    const cardBottom = await card.evaluate((el) => el.getBoundingClientRect().bottom);
    const barTop = await bar.evaluate((el) => el.getBoundingClientRect().top);
    expect(cardBottom).toBeLessThanOrEqual(barTop);
  });

  test("phones without a mobile cut get the still version", async ({ page }) => {
    await serveMedia(page);
    await page.goto("/?renderer=still");
    await waitForImmersive(page);
    await expect(page.locator("#guided-descent video")).toHaveCount(0);
    const poster = page.locator(".gd__poster img");
    await expect.poll(() => poster.evaluate((img: HTMLImageElement) => img.currentSrc)).toMatch(
      /guided-descent-mobile\.webp$/,
    );
  });
});

test.describe("frame-sequence fallback", () => {
  test.use({ baseURL: MEDIA, viewport: { width: 1440, height: 900 } });

  test("draws the first frame, follows scroll, and loads nearby frames first", async ({ page }) => {
    const requests = await serveMedia(page);
    await page.goto("/?renderer=frames");
    await waitForImmersive(page);
    const canvas = page.locator(".gd__canvas");
    await expect(canvas).toHaveAttribute("data-frame", "0");
    expect(requests.find((r) => r.includes("/frames/frame-"))).toBe("/video/frames/frame-0001.webp");

    await scrollToProgress(page, 0.75);
    await settle(page, 0.75);
    await expect
      .poll(async () => Number(await canvas.getAttribute("data-frame")), { timeout: 5000 })
      .toBe(frameIndexAt(0.75, 48));

    // Canvas resolution is capped at 1.5x.
    const ratio = await canvas.evaluate((c: HTMLCanvasElement) => c.width / c.getBoundingClientRect().width);
    expect(ratio).toBeLessThanOrEqual(1.5);
  });
});
