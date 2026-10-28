import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { bookCopy, bookingUrl, contact, services, type ServiceId } from "../content/site";

const WIDTHS = [375, 768, 1280] as const;

/** Shows everything the reveal script is holding back, for full-page captures and audits. */
async function revealAll(page: Page) {
  // No fade: audits must never catch text halfway in.
  await page.addStyleTag({ content: "[data-reveal] { transition: none !important; }" });
  await page.evaluate(() =>
    document.querySelectorAll("[data-reveal]").forEach((el) => el.setAttribute("data-reveal", "shown")),
  );
}

for (const width of WIDTHS) {
  test.describe(`at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("has no horizontal scroll and saves full-page screenshots", async ({ page }) => {
      await page.goto("/");
      await revealAll(page);
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
      // Layout captures use the static drawing: asking the software renderer for a
      // 6000px-tall 3D world takes minutes. tests/world.spec.ts captures the world shot by shot.
      await page.goto("/?renderer=static");
      await revealAll(page);
      // Saved in parts: software-rendered browsers repeat tiles past 8192px in one capture.
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0, part = 1; y < height; y += 6000, part++) {
        await page.screenshot({
          path: `test-results/screenshots/home-${width}-part${part}.png`,
          fullPage: true,
          clip: { x: 0, y, width, height: Math.min(6000, height - y) },
        });
      }
    });

    test("passes axe WCAG 2.2 AA checks", async ({ page }) => {
      await page.goto("/");
      await revealAll(page);
      // Open every FAQ answer so axe checks them too.
      await page.evaluate(() => document.querySelectorAll("details.faq__item").forEach((d) => ((d as HTMLDetailsElement).open = true)));
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
        .analyze();
      const summary = results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
      expect(summary).toEqual([]);
    });

    test("interactive targets are at least 44px tall", async ({ page }) => {
      await page.goto("/");
      const small = await page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLElement>("a, button, summary, select, input:not([type=radio]):not([type=checkbox]), label.check, label.chooser__opt"))
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
  // Every booking-calendar link on the page is one of the six real services.
  const hrefs = await page.locator('a[href*="/booking-calendar/"]').evaluateAll((links) =>
    links.map((a) => (a as HTMLAnchorElement).href),
  );
  const allowed = new Set((Object.keys(services) as ServiceId[]).map(bookingUrl));
  expect(hrefs.length).toBeGreaterThan(6);
  expect(hrefs.filter((href) => !allowed.has(href))).toEqual([]);
});

test("serves every reef layer as a prerendered SVG", async ({ request }) => {
  for (const file of ["far", "mid", "near", "accents"]) {
    const response = await request.get(`/art/reef-${file}.svg`);
    expect(response.status(), file).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/svg+xml");
    expect(await response.text()).toMatch(/^<svg [^>]*viewBox="0 0 1600 420"/);
  }
});

test("every in-page link has a target", async ({ page }) => {
  await page.goto("/");
  const missing = await page.locator('a[href^="#"]').evaluateAll((links) =>
    links
      .map((a) => a.getAttribute("href")!)
      .filter((href) => href !== "#" && !document.getElementById(href.slice(1))),
  );
  expect(missing).toEqual([]);
});

test("shows nothing outside the verified content", async ({ page }) => {
  await page.goto("/");
  const html = await page.content();
  const text = await page.locator("body").innerText();
  const banned = [
    /\bnight/i,
    /jacksonville/i,
    /\b(PADI|SSI|NAUI|SDI|TDI|RAID|CMAS)\b/,
    /test tour/i,
    /service 11/i,
    /\b\d+\s*(reviews?|ratings?|stars?)\b/i,
    /years? (in business|of experience)/i,
    /dive into adventure/i,
    /\b\d+\s*(m|ft|feet|meters?)\b(?! of water)/i,
    /—/,
  ];
  for (const pattern of banned) {
    expect(text, `page text matches ${pattern}`).not.toMatch(pattern);
  }
  // The meeting point must never become the business address in structured data.
  const schemas = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((scripts) => scripts.map((s) => JSON.parse(s.textContent ?? "{}")));
  const business = schemas.find((s) => s["@type"] === "LocalBusiness");
  expect(business).toBeTruthy();
  expect(business).not.toHaveProperty("address");
  expect(business).not.toHaveProperty("geo");
  expect(JSON.stringify(business)).not.toContain("900 Blue Heron");
  expect(html).not.toContain("PostalAddress");
  // Videos stay hidden until Tabitha confirms them.
  await expect(page.locator("#videos")).toHaveCount(0);
});

test("the depth names are atmosphere, never real depths", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/");
  const gauge = page.locator(".gauge");
  await expect(gauge).toHaveAttribute("aria-hidden", "true");
  await expect(gauge.locator(".gauge__needle")).toBeVisible();
  await expect(page.locator(".gauge__label")).toHaveText("Surface");
  await page.locator("#certification").scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 200));
  await expect(page.locator(".gauge__label")).toHaveText("Deeper");
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("stops every looping animation and keeps the stage still", async ({ page }) => {
    await page.goto("/");
    for (const selector of [".school", ".school__fish", ".rising span", ".bubbles span", ".surface-edge__crest"]) {
      const animation = await page
        .locator(selector)
        .first()
        .evaluate((el) => getComputedStyle(el).animationName);
      expect(animation, selector).toBe("none");
    }
    // One still frame of the world, not pinned, and no footage.
    const stage = page.locator(".stage");
    await expect(stage).toHaveAttribute("data-tier", "still");
    await expect(stage).not.toHaveAttribute("data-live", "");
    await expect(page.locator(".stage video")).toHaveCount(0);
    // Nothing is held back for a reveal.
    await expect(page.locator('[data-reveal="pending"]')).toHaveCount(0);
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("every section is readable and script-only controls stay hidden", async ({ page }) => {
    await page.goto("/");
    for (const id of [
      "top",
      "first-dive",
      "experiences",
      "certification",
      "tabitha",
      "groups",
      "where-we-meet",
      "faq",
      "book",
      "contact",
    ]) {
      const section = page.locator(`#${id}`);
      await expect(section).toBeVisible();
      expect(await section.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
    }
    await expect(page.locator("[data-copy]").first()).toBeHidden();
    await expect(page.locator(".planner")).toBeHidden();
    await expect(page.getByRole("link", { name: `Call ${contact.phone.display}` }).first()).toBeVisible();
    // The surface is drawn in CSS, and the header is the solid bar.
    await expect(page.locator(".surface-art")).toBeVisible();
    expect(await page.locator(".site-header").evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe(
      "rgba(0, 0, 0, 0)",
    );
  });

  test("the booking chooser still works", async ({ page }) => {
    await page.goto("/");
    const answers = page.locator(".chooser__answer");
    await expect(answers.filter({ hasText: bookCopy.paths[0].title })).toBeVisible();
    await page.getByRole("radio", { name: bookCopy.paths[2].label }).check();
    await expect(answers.filter({ hasText: bookCopy.paths[2].title })).toBeVisible();
    await expect(answers.filter({ hasText: bookCopy.paths[0].title })).toBeHidden();
  });
});

test.describe("booking chooser", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("points each kind of visitor at the right booking pages", async ({ page }) => {
    await page.goto("/");
    const chooser = page.locator(".chooser");
    for (const path of bookCopy.paths) {
      // A click on the visible pill lands on its radio button, which sits on top of it.
      await chooser.getByText(path.label, { exact: true }).click({ position: { x: 12, y: 12 }, force: true });
      await expect(chooser.getByRole("radio", { name: path.label })).toBeChecked();
      const answer = chooser.locator(`[data-for="${path.id}"]`);
      await expect(answer).toBeVisible();
      for (const id of path.services) {
        await expect(answer.locator(`a[href="${bookingUrl(id)}"]`)).toBeVisible();
      }
    }
    // Keyboard: arrow keys move between answers, as with any radio group.
    await chooser.locator("#start-group").focus();
    await page.keyboard.press("ArrowLeft");
    await expect(chooser.locator('[data-for="certified"]')).toBeVisible();
  });
});

test.describe("group planner", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("explains what is missing, then opens an email without claiming it was sent", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { opened: string[] }).opened = [];
      window.open = ((url: string) => {
        (window as unknown as { opened: string[] }).opened.push(url);
        return null;
      }) as typeof window.open;
    });
    await page.goto("/");
    const planner = page.locator(".planner");
    await planner.scrollIntoViewIfNeeded();
    await planner.getByRole("button", { name: "Write the email" }).click();

    // Nothing opens, every problem is named, and focus goes to the first one.
    await expect(planner.locator(".field__error")).toHaveCount(3);
    await expect(planner.getByLabel("Occasion")).toBeFocused();
    await expect(planner.getByLabel("Occasion")).toHaveAttribute("aria-invalid", "true");
    expect(await page.evaluate(() => (window as unknown as { opened: string[] }).opened)).toEqual([]);

    await planner.getByLabel("Occasion").selectOption("Birthdays");
    await planner.getByLabel("About how many people?").fill("6");
    await planner.getByLabel("Snorkeling").check();
    await planner.getByLabel("Your name").fill("Sam");
    await planner.getByRole("button", { name: "Write the email" }).click();

    await expect(planner.locator(".field__error")).toHaveCount(0);
    const [url] = await page.evaluate(() => (window as unknown as { opened: string[] }).opened);
    expect(url.startsWith(`${contact.email.href}?subject=`)).toBe(true);
    const body = decodeURIComponent(new URL(url).searchParams.get("body") ?? "");
    expect(body).toContain("Occasion: Birthdays");
    expect(body).toContain("Group size: about 6");
    expect(body).toContain("Interested in: Snorkeling");
    expect(body).toContain("Sam");
    const status = planner.getByRole("status");
    await expect(status).toContainText("Nothing is sent until you press send");
    await expect(status).not.toContainText(/sent!|success|thank you/i);
    await expect(status.getByRole("button", { name: "Copy message" })).toBeVisible();
  });

  test("rejects a date in the past", async ({ page }) => {
    await page.goto("/");
    const planner = page.locator(".planner");
    await planner.getByLabel("Occasion").selectOption("Friend groups");
    await planner.getByLabel("About how many people?").fill("4");
    await planner.getByLabel("Preferred date (optional)").fill("2020-01-01");
    await planner.getByLabel("Your name").fill("Sam");
    await planner.getByRole("button", { name: "Write the email" }).click();
    await expect(planner.getByText("Pick today or a date in the future")).toBeVisible();
    await expect(planner.getByLabel("Preferred date (optional)")).toBeFocused();
  });
});

test.describe("header", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("is clear over the sky, then solid once the page scrolls", async ({ page }) => {
    await page.goto("/");
    const header = page.locator(".site-header");
    await expect(header).toHaveAttribute("data-ready", "");
    await expect(header).not.toHaveAttribute("data-scrolled", "");
    await page.evaluate(() => window.scrollTo({ top: 600, behavior: "instant" }));
    await expect(header).toHaveAttribute("data-scrolled", "");
    await expect(header.getByRole("link", { name: "Book a dive" })).toHaveAttribute("href", "#book");
  });
});

test.describe("copy buttons", () => {
  test.use({ viewport: { width: 1280, height: 800 }, permissions: ["clipboard-read", "clipboard-write"] });

  test("copy the phone number and announce it", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Copy phone number" }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(contact.phone.display);
    await expect(page.locator(".sr-only[role=status]")).toHaveText("Phone number copied.");
  });
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });

  test("the menu opens, jumps to a section, and closes", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Menu", { exact: true }).click();
    await page.locator(".menu__panel").getByRole("link", { name: "FAQ" }).click();
    await expect(page.locator("details.menu")).not.toHaveAttribute("open", "");
    await expect(page).toHaveURL(/#faq$/);
  });

  test("the booking bar stays out of the way of the hero and the booking section", async ({ page }) => {
    await page.goto("/");
    const bar = page.locator(".book-bar");
    await expect(bar).toHaveAttribute("data-away", "");
    await page.locator("#certification").scrollIntoViewIfNeeded();
    await expect(bar).not.toHaveAttribute("data-away", "");
    await expect(bar.getByRole("link", { name: "Book a dive" })).toBeVisible();
    await page.locator("#book .chooser").scrollIntoViewIfNeeded();
    await expect(bar).toHaveAttribute("data-away", "");
  });
});

test("unknown addresses get a 404 page that leads back to booking", async ({ page }) => {
  const response = await page.goto("/book-online");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("We couldn’t find that page.");
  await expect(page.getByRole("link", { name: "Book a dive" })).toHaveAttribute("href", "/#book");
  await expect(page.getByRole("link", { name: contact.phone.display })).toHaveAttribute("href", contact.phone.href);
});
