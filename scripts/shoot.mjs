/**
 * Quick screenshots for design review: node scripts/shoot.mjs <url> <outDir> [width x height ...]
 * Defaults to the hero at 375x812 and 1280x800. Uses the installed Chrome.
 * Set FULL=1 for full-page captures, REDUCED=1 for reduced motion, NOJS=1 to disable JavaScript.
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const [url = "http://localhost:3000", out = "test-results/shots", ...sizes] = process.argv.slice(2);
const viewports = (sizes.length ? sizes : ["375x812", "1280x800"]).map((s) => {
  const [width, height] = s.split("x").map(Number);
  return { width, height };
});
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel: "chrome" });
for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    reducedMotion: process.env.REDUCED ? "reduce" : "no-preference",
    javaScriptEnabled: !process.env.NOJS,
    isMobile: viewport.width < 768,
    hasTouch: viewport.width < 768,
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => console.error("pageerror:", e.message));
  page.on("console", (m) => m.type() === "error" && console.error("console:", m.text()));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(Number(process.env.WAIT ?? 3500));
  const tag = `${viewport.width}x${viewport.height}${process.env.REDUCED ? "-reduced" : ""}${process.env.NOJS ? "-nojs" : ""}`;
  const file = path.join(out, `${process.env.NAME ?? "page"}-${tag}.png`);
  await page.screenshot({ path: file, fullPage: Boolean(process.env.FULL) });
  console.log(file);
  await context.close();
}
await browser.close();
