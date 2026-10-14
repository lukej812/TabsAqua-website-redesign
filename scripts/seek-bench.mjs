/**
 * Measures how fast Chrome can seek in each video file.
 *
 *   node scripts/seek-bench.mjs public/video/guided-descent.mp4 public/video/guided-descent.webm
 *
 * For each file: size, time to first frame, and the time from setting
 * currentTime to the "seeked" event for 120 small sequential steps (like
 * scrolling) and 40 random jumps. Files are loaded fully into memory first, so
 * this measures decoding, not the network. Uses the installed Google Chrome.
 */
import { chromium } from "@playwright/test";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";

const files = process.argv.slice(2);
if (!files.length) {
  console.error("Usage: node scripts/seek-bench.mjs <video> [<video> ...]");
  process.exit(1);
}

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.route("http://bench.local/**", async (route) => {
  const index = Number(new URL(route.request().url()).searchParams.get("i"));
  if (Number.isNaN(index) || !files[index]) {
    return route.fulfill({ contentType: "text/html", body: "<video muted playsinline style='width:960px'></video>" });
  }
  const file = files[index];
  return route.fulfill({
    contentType: file.endsWith(".webm") ? "video/webm" : "video/mp4",
    body: readFileSync(path.resolve(file)),
  });
});
await page.goto("http://bench.local/");

for (const [i, file] of files.entries()) {
  const result = await page.evaluate(async (i) => {
    const video = document.querySelector("video");
    const blob = await (await fetch(`/media?i=${i}`)).blob();
    const t0 = performance.now();
    video.src = URL.createObjectURL(blob);
    const loaded = await Promise.race([
      new Promise((resolve) => video.addEventListener("loadeddata", () => resolve(true), { once: true })),
      new Promise((resolve) => setTimeout(() => resolve(false), 10000)),
    ]);
    if (!loaded) return { error: "could not decode" };
    const firstFrameMs = Math.round(performance.now() - t0);
    const seek = (time) =>
      new Promise((resolve) => {
        const start = performance.now();
        video.addEventListener("seeked", () => resolve(performance.now() - start), { once: true });
        video.currentTime = time;
      });
    const sequential = [];
    for (let step = 1; step <= 120; step++) sequential.push(await seek((step / 120) * (video.duration - 0.05)));
    const random = [];
    let x = 7;
    for (let n = 0; n < 40; n++) {
      x = (x * 9301 + 49297) % 233280;
      random.push(await seek((x / 233280) * (video.duration - 0.05)));
    }
    const stat = (values) => {
      const sorted = [...values].sort((a, b) => a - b);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      return { avgMs: +avg.toFixed(1), p95Ms: +sorted[Math.floor(sorted.length * 0.95)].toFixed(1) };
    };
    URL.revokeObjectURL(video.src);
    return { firstFrameMs, sequential: stat(sequential), random: stat(random) };
  }, i);
  const mb = +(statSync(path.resolve(file)).size / 1e6).toFixed(2);
  console.log(JSON.stringify({ file, mb, ...result }));
}

await browser.close();
