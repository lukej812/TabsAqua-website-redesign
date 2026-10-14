/**
 * The site as a visitor meets it: layout, accessibility, the content guard,
 * and the "every button works" contract (see the table in README.md).
 *
 * Port 3100 is the site as it ships. Port 3101 treats the guided descent
 * footage as present and posts the group form to a test endpoint, which these
 * tests mock. Tests tagged @webkit also run in WebKit at 375 x 812.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import {
  bookingUrl,
  business,
  contact,
  courses,
  experiences,
  faq,
  groupForm,
  groupon,
  hero,
  meetingPoint,
  nav,
  services,
  testimonial,
  type ServiceId,
} from "../content/site";

const MEDIA = "http://localhost:3101";
const FORM_ENDPOINT = "https://formspree.io/f/test-endpoint";
const WIDTHS = [375, 768, 1280, 1440] as const;

/** Scrolls through the page once so every scroll reveal has played. */
async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight / 2) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });
}

/** Collects page errors and console errors. */
function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !/Failed to load resource/.test(message.text())) errors.push(message.text());
  });
  return errors;
}

/* ------------------------------------------------------------------ */
/* Layout and accessibility at every width                             */
/* ------------------------------------------------------------------ */

for (const width of WIDTHS) {
  test.describe(`at ${width}px`, () => {
    test.use({ viewport: { width, height: width < 768 ? 812 : 900 } });
    const tag = width === 375 ? " @webkit" : "";

    test(`has no horizontal scroll and saves a full-page screenshot${tag}`, async ({ page }, info) => {
      const errors = watchErrors(page);
      await page.goto("/");
      await scrollThrough(page);
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
      await page.screenshot({
        path: `test-results/screenshots/home-${width}-${info.project.name}.png`,
        fullPage: true,
      });
      expect(errors).toEqual([]);
    });

    if (width !== 1440) {
      test("passes axe WCAG 2.2 AA checks", async ({ page }) => {
        await page.goto("/");
        await scrollThrough(page);
        // Open every FAQ answer and the Groupon ticket so axe checks them too.
        await page.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
        await page.waitForTimeout(600);
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
          Array.from(document.querySelectorAll<HTMLElement>("a, button, summary, input, select, textarea"))
            .filter((el) => {
              const style = getComputedStyle(el);
              if (style.display === "none" || style.visibility === "hidden") return false;
              if (el.closest(".sr-only, .form__trap") || el.classList.contains("skip-link")) return false;
              const rect = el.getBoundingClientRect();
              return rect.width > 0 && rect.height < 44;
            })
            .map((el) => `${el.tagName} "${el.textContent?.trim().slice(0, 40)}"`),
        );
        expect(small).toEqual([]);
      });
    }
  });
}

test("on a phone, the headline, lead, and both buttons fit the first screen @webkit", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const header = await page.locator(".header-bar").boundingBox();
  const bar = await page.locator(".book-bar").boundingBox();
  for (const selector of [".hero__title", ".hero__lead-line", ".hero__actions .btn", ".hero__actions .text-link"]) {
    const box = await page.locator(selector).boundingBox();
    expect(box, selector).not.toBeNull();
    expect(box!.y, selector).toBeGreaterThanOrEqual(header!.y + header!.height);
    expect(box!.y + box!.height, selector).toBeLessThanOrEqual(bar!.y);
  }
});

/* ------------------------------------------------------------------ */
/* Content guard: rule zero                                            */
/* ------------------------------------------------------------------ */

test("has one h1 and every service's booking link", async ({ page }) => {
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
    /\bstudents?\b/i,
    /\bratings?\b/i,
    /\bstars?\b/i,
    /enroll/i,
    /years? (in business|of experience)/i,
    /dive into adventure/i,
    /—/,
  ];
  for (const pattern of banned) {
    expect(text, `page text matches ${pattern}`).not.toMatch(pattern);
  }
  // No avatar stacks or faces standing in for customers.
  expect(await page.locator('[class*="avatar" i], img[alt*="student" i], img[alt*="customer" i]').count()).toBe(0);
  // The meeting point must never become the business address in structured data.
  expect(html).not.toContain("LocalBusiness");
  // Videos stay hidden until Tabitha confirms them.
  await expect(page.locator("#videos")).toHaveCount(0);
  // The quote chip is a verbatim excerpt of the only testimonial.
  expect(testimonial.quote).toContain(hero.quoteChip);
  await expect(page.locator("#testimonial blockquote")).toHaveText(testimonial.quote);
});

test("structured data is an Organization with services and no address", async ({ page }) => {
  await page.goto("/");
  const raw = await page.locator('script[type="application/ld+json"]').textContent();
  const data = JSON.parse(raw ?? "{}");
  expect(data["@type"]).toBe("Organization");
  expect(data.name).toBe(business.name);
  expect(data.email).toBe(contact.email.display);
  expect(raw).not.toMatch(/address|PostalAddress|geo/i);
  const offers = data.hasOfferCatalog.itemListElement as { url: string; price: string }[];
  for (const id of Object.keys(services) as ServiceId[]) {
    const offer = offers.find((o) => o.url === bookingUrl(id));
    expect(offer, id).toBeTruthy();
    expect(`$${offer!.price}`).toBe(services[id].price);
  }
});

/* ------------------------------------------------------------------ */
/* The "every button works" contract                                   */
/* ------------------------------------------------------------------ */

test.describe("every button works", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("no dead links, no buttons without a handler, and every control has a name @webkit", async ({ page }) => {
    await page.goto("/");
    const problems = await page.evaluate(() => {
      const out: string[] = [];
      for (const a of document.querySelectorAll<HTMLAnchorElement>("a")) {
        const href = a.getAttribute("href") ?? "";
        if (!href || href === "#" || href.toLowerCase().startsWith("javascript:")) out.push(`dead link: ${a.outerHTML.slice(0, 80)}`);
      }
      // Every button declares what it does: a data-action wired in script, or form submit.
      for (const b of document.querySelectorAll<HTMLButtonElement>("button")) {
        if (!b.dataset.action && !b.dataset.copy && b.type !== "submit") out.push(`button without a handler: ${b.outerHTML.slice(0, 80)}`);
      }
      // Every link and button has an accessible name (text, sr-only text, or aria-label).
      for (const el of document.querySelectorAll<HTMLElement>("a, button, summary")) {
        const name = (el.getAttribute("aria-label") ?? el.textContent ?? "").trim();
        if (!name) out.push(`no accessible name: ${el.outerHTML.slice(0, 80)}`);
      }
      return out;
    });
    expect(problems).toEqual([]);
  });

  test("every Book button goes to that service's booking page, in the same tab", async ({ page }) => {
    await page.goto("/");
    const valid = new Set((Object.keys(services) as ServiceId[]).map(bookingUrl));
    const bookLinks = page.locator(`a[href^="${business.bookingBase}"]`);
    expect(await bookLinks.count()).toBeGreaterThanOrEqual(6);
    for (const link of await bookLinks.all()) {
      const href = (await link.getAttribute("href"))!;
      expect(valid.has(href), href).toBe(true);
      expect(await link.getAttribute("target")).toBeNull();
    }
    // Each card's Book button is its own service's URL: bookingBase + bookingPath.
    for (const { serviceId } of [...experiences, ...courses]) {
      const expected = `${business.bookingBase}${services[serviceId].bookingPath}`;
      await expect(page.locator(`#${serviceId} a[data-book]`)).toHaveAttribute("href", expected);
    }
  });

  test("every in-page link points at a section that exists", async ({ page }) => {
    await page.goto("/");
    const missing = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'))
        .map((a) => a.getAttribute("href")!.slice(1))
        .filter((id) => !document.getElementById(id)),
    );
    expect(missing).toEqual([]);
  });

  test("the fixed header never covers a section it links to", async ({ page }) => {
    await page.goto("/");
    for (const item of nav) {
      await page.locator(".site-nav").getByRole("link", { name: item.label }).click();
      await expect(page).toHaveURL(new RegExp(`#${item.id}$`));
      // Wait for the smooth scroll to settle.
      await expect
        .poll(async () => page.evaluate(() => window.scrollY), { timeout: 4000 })
        .toBeGreaterThan(0);
      let previous = -1;
      await expect
        .poll(async () => {
          const y = await page.evaluate(() => window.scrollY);
          const settled = y === previous;
          previous = y;
          return settled;
        })
        .toBe(true);
      const headerBottom = await page.locator(".header-bar").evaluate((el) => el.getBoundingClientRect().bottom);
      const top = await page.locator(`#${item.id}`).evaluate((el) => el.getBoundingClientRect().top);
      expect(top, item.id).toBeGreaterThanOrEqual(headerBottom - 1);
    }
  });

  test("Maps links open in a new tab, safely, and say so", async ({ page }) => {
    await page.goto("/");
    const maps = page.locator(`a[href="${meetingPoint.mapsUrl}"]`);
    expect(await maps.count()).toBeGreaterThanOrEqual(2);
    for (const link of await maps.all()) {
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
      await expect(link).toContainText("(opens in a new tab)");
    }
  });

  test("phone and email links use tel: and mailto:", async ({ page }) => {
    await page.goto("/");
    expect(await page.locator(`a[href="${contact.phone.href}"]`).count()).toBeGreaterThan(2);
    expect(await page.locator(`a[href="${contact.email.href}"]`).count()).toBeGreaterThan(2);
  });
});

/* ------------------------------------------------------------------ */
/* Each interactive piece                                              */
/* ------------------------------------------------------------------ */

test.describe("hero carousel", () => {
  test("arrows move it, stop at the ends, and announce the position @webkit", async ({ page }) => {
    await page.goto("/");
    const prev = page.getByRole("button", { name: "Previous experience" });
    const next = page.getByRole("button", { name: "Next experience" });
    const status = page.locator("[data-carousel-status]");
    await next.scrollIntoViewIfNeeded();
    await expect(prev).toBeDisabled();
    await next.click();
    await expect(status).toHaveText("2 of 3");
    // From the keyboard, focus moves to the arrow that still works at the end.
    // (Safari doesn't focus buttons on click, so the handoff is for keyboard users.)
    await next.focus();
    await page.keyboard.press("Enter");
    await expect(status).toHaveText("3 of 3");
    await expect(next).toBeDisabled();
    await expect(prev).toBeFocused();
    await prev.click();
    await expect(status).toHaveText("2 of 3");
  });

  test("arrow keys work while it has focus @webkit", async ({ page }) => {
    await page.goto("/");
    const track = page.locator("#hero-carousel-track");
    const status = page.locator("[data-carousel-status]");
    await track.focus();
    await page.keyboard.press("ArrowRight");
    await expect(status).toHaveText("2 of 3");
    await page.keyboard.press("End");
    await expect(status).toHaveText("3 of 3");
    await page.keyboard.press("ArrowLeft");
    await expect(status).toHaveText("2 of 3");
    await expect(page.locator(".hero__bottom")).toHaveAttribute("aria-roledescription", "carousel");
  });

  test("each card's arrow jumps to that experience's full card", async ({ page }) => {
    await page.goto("/");
    for (const card of hero.cards) {
      await expect(page.locator(`.mini-card a[href="#${card.serviceId}"]`)).toHaveCount(1);
    }
    await page.locator('.mini-card a[href="#discover-scuba"]').click();
    await expect(page.locator("#discover-scuba")).toBeInViewport();
  });
});

test.describe("copy buttons", () => {
  test.use({ viewport: { width: 1280, height: 800 }, permissions: ["clipboard-read", "clipboard-write"] });

  test("copy the phone number and email, with feedback", async ({ page }) => {
    await page.goto("/");
    const phone = page.locator('[data-copy-label="Phone number"]');
    await phone.click();
    await expect(phone).toContainText("Copied");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(contact.phone.display);
    await expect(page.getByRole("status").filter({ hasText: "copied" })).toHaveText("Phone number copied.");
    await page.getByRole("button", { name: "Copy email address" }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(contact.email.display);
    await page.getByRole("button", { name: "Copy address" }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(meetingPoint.street);
  });
});

test("FAQ rows open and close", async ({ page }) => {
  await page.goto("/");
  const item = page.locator(`#faq-${faq[0].id}`);
  await item.locator("summary").click();
  await expect(item).toHaveAttribute("open", "");
  await expect(item.getByText(faq[0].answer!)).toBeVisible();
  await item.locator("summary").click();
  await expect(item).not.toHaveAttribute("open", "");
});

test("the Groupon ticket opens to the instructions", async ({ page }) => {
  await page.goto("/");
  const ticket = page.locator(".ticket");
  await expect(ticket.getByText(groupon.text)).toBeHidden();
  await ticket.locator("summary").click();
  await expect(ticket.getByText(groupon.text)).toBeVisible();
  await expect(ticket.getByRole("link", { name: `Call ${contact.phone.display}` })).toBeVisible();
});

test("the map loads nothing from Google until asked", async ({ page }) => {
  const google: string[] = [];
  page.on("request", (r) => /google\./.test(new URL(r.url()).hostname) && google.push(r.url()));
  await page.goto("/");
  await page.locator("#where").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  expect(google).toEqual([]);
  await page.getByRole("button", { name: "Show map" }).click();
  const frame = page.locator("#where iframe");
  await expect(frame).toHaveAttribute("src", meetingPoint.embedUrl);
  await expect(frame).toHaveAttribute("title", /Phil Foster Park/);
  await expect(frame).toHaveAttribute("loading", "lazy");
});

test.describe("mobile menu", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("opens, traps focus, locks scroll, and closes on Escape @webkit", async ({ page }) => {
    await page.goto("/");
    const button = page.getByRole("button", { name: "Open menu" });
    await button.click();
    const menu = page.locator("#mobile-menu");
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("link", { name: nav[0].label })).toBeFocused();
    await expect(page.locator(".book-bar")).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("hidden");
    // Tab past the last item and focus wraps to the close button, never behind the menu.
    const stops = await menu.locator("a").count();
    for (let i = 0; i < stops; i++) await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Close menu" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");
    await expect(page.locator(".book-bar")).toBeVisible();
  });

  test("jumps to a section and closes @webkit", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.locator("#mobile-menu").getByRole("link", { name: "FAQ" }).click();
    await expect(page.locator("#mobile-menu")).toBeHidden();
    await expect(page).toHaveURL(/#faq$/);
    await expect(page.locator("#faq-title")).toBeInViewport();
  });
});

test.describe("book bar", () => {
  test("shows on phones with Book a dive and Call @webkit", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const bar = page.locator(".book-bar");
    await expect(bar).toBeVisible();
    const box = (await bar.boundingBox())!;
    expect(box.y + box.height).toBeLessThanOrEqual(812);
    await expect(bar.getByRole("link", { name: "Call" })).toHaveAttribute("href", contact.phone.href);
    await bar.getByRole("link", { name: "Book a dive" }).click();
    await expect(page).toHaveURL(/#experiences$/);
    await expect(page.locator("#experiences-title")).toBeInViewport();
  });

  test("is hidden on wide screens, where the header has the Book pill", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await expect(page.locator(".book-bar")).toBeHidden();
    await expect(page.locator(".header-book")).toBeVisible();
  });
});

test.describe("group inquiry form", () => {
  async function fill(page: Page) {
    const form = page.locator("#groups form");
    await form.getByLabel(groupForm.labels.name).fill("Pat Diver");
    await form.getByLabel(groupForm.labels.email).fill("pat@example.com");
    await form.getByLabel(groupForm.labels.occasion).selectOption("Birthdays");
    await form.getByLabel(/Group size/).fill("6");
    await form.getByLabel(/Anything else/).fill("A birthday surprise.");
    return form;
  }

  test("explains what's missing, inline, and focuses the first field @webkit", async ({ page }) => {
    await page.goto("/");
    const form = page.locator("#groups form");
    await form.getByRole("button", { name: groupForm.submit }).click();
    await expect(form.getByText(groupForm.errors.name)).toBeVisible();
    await expect(form.getByText(groupForm.errors.email)).toBeVisible();
    await expect(form.getByText(groupForm.errors.occasion)).toBeVisible();
    await expect(form.getByLabel(groupForm.labels.name)).toBeFocused();
    await expect(form.getByLabel(groupForm.labels.name)).toHaveAttribute("aria-invalid", "true");
    await form.getByLabel(/Preferred date/).fill("2020-01-01");
    await expect(form.getByText(groupForm.errors.date)).toBeVisible();
    await form.getByLabel(groupForm.labels.name).fill("Pat");
    await expect(form.getByText(groupForm.errors.name)).toBeHidden();
  });

  test("without an endpoint, opens a pre-filled email @webkit", async ({ page }) => {
    await page.goto("/");
    const form = await fill(page);
    await expect(form.getByText(groupForm.viaEmail)).toBeVisible();
    await form.getByRole("button", { name: groupForm.submit }).click();
    const link = form.locator("[data-mailto]");
    await expect(link).toBeVisible();
    const href = (await link.getAttribute("href"))!;
    expect(href.startsWith(contact.email.href)).toBe(true);
    expect(decodeURIComponent(href)).toContain(`subject=${groupForm.subject}: Birthdays`);
    expect(decodeURIComponent(href)).toContain("Group size: 6");
  });

  test("with an endpoint, posts JSON with a honeypot and shows success", async ({ page }) => {
    let body: Record<string, string> | undefined;
    await page.route(FORM_ENDPOINT, async (route) => {
      body = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
    });
    await page.goto(MEDIA);
    const form = await fill(page);
    await expect(form.getByText(groupForm.viaEndpoint)).toBeVisible();
    await form.getByRole("button", { name: groupForm.submit }).click();
    await expect(form.getByText(groupForm.sent)).toBeVisible();
    expect(body).toMatchObject({ name: "Pat Diver", email: "pat@example.com", occasion: "Birthdays", size: "6", _gotcha: "" });
    await expect(form.getByLabel(groupForm.labels.name)).toHaveValue("");
  });

  test("if the endpoint fails, falls back to email", async ({ page }) => {
    await page.route(FORM_ENDPOINT, (route) => route.fulfill({ status: 500, body: "" }));
    await page.goto(MEDIA);
    const form = await fill(page);
    await form.getByRole("button", { name: groupForm.submit }).click();
    await expect(form.locator("[data-mailto]")).toBeVisible();
  });
});

test.describe("video lightbox (footage present)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("opens, traps focus, closes on Escape and with its button, and returns focus", async ({ page }) => {
    await page.route(/\/(video\/|images\/guided-descent)/, (route) => route.fulfill({ status: 204, body: "" }));
    await page.goto(MEDIA);
    const play = page.getByRole("button", { name: hero.videoCard.play });
    await play.click();
    const dialog = page.getByRole("dialog", { name: hero.videoCard.title });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: hero.videoCard.close })).toBeFocused();
    // Modal: the rest of the page is inert while it is open.
    expect(await page.evaluate(() => document.querySelector("dialog")!.matches(":modal"))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(play).toBeFocused();
    await play.click();
    await dialog.getByRole("button", { name: hero.videoCard.close }).click();
    await expect(dialog).toBeHidden();
    await expect(play).toBeFocused();
  });

  test("without footage, the card links to the meeting point and has no play button", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: hero.videoCard.play })).toHaveCount(0);
    await expect(page.locator('.media-card[href="#where"]')).toBeVisible();
  });
});

/* ------------------------------------------------------------------ */
/* Motion preferences, no JavaScript, and performance guardrails       */
/* ------------------------------------------------------------------ */

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce", viewport: { width: 1280, height: 800 } });

  test("stops every loop, hides nothing, and rests scroll effects at the end", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2500);
    for (const selector of [".rise-letter", ".bubble", ".marquee__track", ".shimmer > span", ".emblem__bob", ".gd__bubble"]) {
      const animation = await page.locator(selector).first().evaluate((el) => getComputedStyle(el).animationName);
      expect(animation, selector).toBe("none");
    }
    const hidden = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>("[data-reveal], [data-word]")).filter(
        (el) => getComputedStyle(el).opacity !== "1",
      ).length,
    );
    expect(hidden).toBe(0);
    expect(await page.locator("[data-beam-fill]").evaluate((el) => getComputedStyle(el).transform)).toBe("none");
    expect(await page.locator(".hero__inner").evaluate((el) => getComputedStyle(el).transform)).toBe("none");
    await expect(page.locator(".hero__canvas")).toHaveAttribute("data-ready", "");
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });

  test("every section is readable and script-only controls stay hidden @webkit", async ({ page }) => {
    await page.goto("/");
    for (const id of ["top", "guided-descent", "first-dive", "experiences", "courses", "about", "groups", "where", "faq", "contact"]) {
      const section = page.locator(`#${id}`);
      await expect(section).toBeVisible();
      expect(await section.evaluate((el) => getComputedStyle(el).opacity), id).toBe("1");
    }
    const hidden = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]")).filter((el) => getComputedStyle(el).opacity !== "1").length,
    );
    expect(hidden).toBe(0);
    await expect(page.locator("[data-copy]").first()).toBeHidden();
    await expect(page.getByRole("button", { name: "Show map" })).toBeHidden();
    await expect(page.locator(".no-js-only").filter({ hasText: "Menu" })).toBeVisible();
    await expect(page.getByRole("link", { name: `Call ${contact.phone.display}` }).first()).toBeAttached();
  });
});

test("GSAP never lands in the initial bundle", async ({ request }) => {
  // The initial bundle: every script the server HTML loads or preloads.
  const html = await (await request.get("/")).text();
  const sources = [
    ...html.matchAll(/<script[^>]+src="([^"]+)"/g),
    ...html.matchAll(/<link[^>]+href="([^"]+\.js)"[^>]*>/g),
  ].map((m) => m[1]);
  expect(sources.length).toBeGreaterThan(0);
  // Markers from GSAP's own code (its ticker, and ScrollTrigger's pinning),
  // not the import names, which the guided descent's lazy loader mentions.
  for (const src of sources) {
    const body = await (await request.get(src)).text();
    expect(body, src).not.toContain("lagSmoothing");
    expect(body, src).not.toContain("pinSpacing");
  }
});

test("sends the security headers", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["permissions-policy"]).toContain("camera=()");
});

test("has share images and metadata", async ({ page, request }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Tabs AquaQuest Diving \| Snorkeling, Discover Scuba, and dive courses with Tabitha/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`^${business.siteUrl}/?$`));
  const og = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(og).toBeTruthy();
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  const image = await request.get("/opengraph-image");
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toBe("image/png");
});

test("the 404 page leads back to the surface", async ({ page }) => {
  const response = await page.goto("/no-such-page");
  expect(response?.status()).toBe(404);
  await expect(page.locator("h1")).toHaveCount(1);
  await page.getByRole("link", { name: "Back to the surface" }).click();
  await expect(page).toHaveURL(/\/$/);
});
