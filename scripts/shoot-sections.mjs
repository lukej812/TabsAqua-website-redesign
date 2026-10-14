/**
 * Screenshots each section for design review:
 *   node scripts/shoot-sections.mjs <url> <outDir> [width ...]
 * Scrolls through first so reveals have played. REDUCED=1 for reduced motion,
 * NOJS=1 for JavaScript off, ONLY=id,id to limit sections. Uses installed Chrome.
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const [url = "http://localhost:3200", out = "test-results/sections", ...widths] = process.argv.slice(2);
const SECTIONS = ["top", "guided-descent", "first-dive", "experiences", "courses", "about", "groups", "where", "faq", "contact", "footer"];
const only = process.env.ONLY?.split(",");
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel: "chrome" });
for (const width of (widths.length ? widths : ["375", "1280"]).map(Number)) {
  const context = await browser.newContext({
    viewport: { width, height: width < 768 ? 812 : 800 },
    deviceScaleFactor: 1.5,
    reducedMotion: process.env.REDUCED ? "reduce" : "no-preference",
    javaScriptEnabled: !process.env.NOJS,
    isMobile: width < 768,
    hasTouch: width < 768,
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => console.error("pageerror:", e.message));
  page.on("console", (m) => m.type() === "error" && console.error("console:", m.text()));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  // Scroll through once so every reveal has played.
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight / 2) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 100));
    }
  });
  const suffix = `${width}${process.env.REDUCED ? "-reduced" : ""}${process.env.NOJS ? "-nojs" : ""}`;
  for (const id of SECTIONS.filter((s) => !only || only.includes(s))) {
    const target = id === "footer" ? page.locator("footer.site-footer") : page.locator(`#${id}`);
    if (!(await target.count())) continue;
    await target.scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
    const file = path.join(out, `${id}-${suffix}.png`);
    if (id === "guided-descent" || id === "top") await page.screenshot({ path: file });
    else await target.screenshot({ path: file });
    console.log(file);
  }
  await context.close();
}
await browser.close();
