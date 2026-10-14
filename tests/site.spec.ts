import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { bookingUrl, services, type ServiceId } from "../content/site";

const WIDTHS = [375, 768, 1280] as const;

for (const width of WIDTHS) {
  test.describe(`at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("has no horizontal scroll and saves a full-page screenshot", async ({ page }) => {
      await page.goto("/");
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
      await page.screenshot({ path: `test-results/screenshots/home-${width}.png`, fullPage: true });
    });

    test("passes axe WCAG 2.2 AA checks", async ({ page }) => {
      await page.goto("/");
      // Open every FAQ answer so axe checks them too.
      await page.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
        .analyze();
      const summary = results.violations.map(
        (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
      );
      expect(summary).toEqual([]);
    });

    test("interactive targets are at least 44px tall", async ({ page }) => {
      await page.goto("/");
      const small = await page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLElement>("a, button, summary"))
          .filter((el) => {
            const style = getComputedStyle(el);
            if (style.display === "none" || style.visibility === "hidden") return false;
            if (el.closest(".sr-only") || el.classList.contains("skip-link")) return false;
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height < 44;
          })
          .map((el) => `${el.tagName} "${el.textContent?.trim().slice(0, 40)}"`),
      );
      expect(small).toEqual([]);
    });
  });
}

test("has one h1 and every booking link points at the Wix calendar", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveCount(1);
  for (const id of Object.keys(services) as ServiceId[]) {
    await expect(page.locator(`a[href="${bookingUrl(id)}"]`).first()).toBeAttached();
  }
});

test("shows nothing outside the verified content", async ({ page }) => {
  await page.goto("/");
  const html = await page.content();
  const text = await page.locator("body").innerText();
  const banned = [
    /night/i,
    /jacksonville/i,
    /\b(PADI|SSI|NAUI|SDI|TDI|RAID|CMAS)\b/,
    /test tour/i,
    /service 11/i,
    /\b\d+\s*(reviews?|ratings?|stars?)\b/i,
    /years? (in business|of experience)/i,
    /dive into adventure/i,
    /—/,
  ];
  for (const pattern of banned) {
    expect(text, `page text matches ${pattern}`).not.toMatch(pattern);
  }
  // The meeting point must never become the business address in structured data.
  expect(html).not.toContain("LocalBusiness");
  // Videos stay hidden until Tabitha confirms them.
  await expect(page.locator("#videos")).toHaveCount(0);
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("stops the floating bubbles, waterlines, and turning badges", async ({ page }) => {
    await page.goto("/");
    for (const selector of [".float", ".wave path", ".ring-badge__spin", ".scallop svg"]) {
      const animation = await page
        .locator(selector)
        .first()
        .evaluate((el) => getComputedStyle(el).animationName);
      expect(animation, selector).toBe("none");
    }
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("every section is readable and copy buttons stay hidden", async ({ page }) => {
    await page.goto("/");
    for (const id of [
      "top",
      "first-dive",
      "start-here",
      "experiences",
      "certification",
      "tabitha",
      "groups",
      "where-we-meet",
      "faq",
      "contact",
    ]) {
      const section = page.locator(`#${id}`);
      await expect(section).toBeVisible();
      expect(await section.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
    }
    await expect(page.locator("[data-copy]").first()).toBeHidden();
    await expect(page.getByRole("link", { name: "Call 904.482.2453" }).first()).toBeVisible();
  });
});

test.describe("layout", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("puts every section in a rounded panel inside the white frame", async ({ page }) => {
    await page.goto("/");
    const radii = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>("main .panel")).map(
        (el) => parseFloat(getComputedStyle(el).borderTopLeftRadius),
      ),
    );
    expect(radii.length).toBeGreaterThan(8);
    expect(radii.every((r) => r > 0)).toBe(true);
  });

  test("animations play while visible", async ({ page }) => {
    await page.goto("/");
    const animation = await page
      .locator(".first-dive .float")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName);
    expect(animation).toBe("float");
  });
});

test.describe("copy buttons", () => {
  test.use({ viewport: { width: 1280, height: 800 }, permissions: ["clipboard-read", "clipboard-write"] });

  test("copy the phone number and announce it", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Copy phone number" }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("904.482.2453");
    await expect(page.getByRole("status")).toHaveText("Phone number copied.");
  });
});

test.describe("mobile menu", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("opens, jumps to a section, and closes", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Menu", { exact: true }).click();
    await page.locator(".menu__panel").getByRole("link", { name: "FAQ" }).click();
    await expect(page.locator("details.menu")).not.toHaveAttribute("open", "");
    await expect(page).toHaveURL(/#faq$/);
  });
});
