# Tabs AquaQuest Diving

Marketing site for Tabs AquaQuest Diving, Tabitha's instructor-led snorkeling and scuba
business. One long page of rounded panels inside a white frame, styled after the
[Aquans water-brand shot](https://dribbble.com/shots/21183479-Water-Brand-Ecommerce-Website):
centered serif headlines, one ocean blue, and white line art. Booking stays on Wix:
every Book button links out to her existing booking calendar.

Built with Next.js (App Router), TypeScript, and Tailwind CSS. Fully static: no API
routes, no server actions, no environment variables.

## Run it

Needs Node 20.9 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

If a CSS change doesn't show up in dev, stop the server, delete the `.next` folder,
and start again. (Tests build into `.next-test`, so they no longer clash with dev.)

## Build

```bash
npm run build
npm start
```

The root layout sets `ensureStatic = "navigation"`, so the build fails if anything
would make the page render per request. Keep it that way.

## Test

```bash
npm test
```

Runs Playwright against two production builds (`scripts/test-servers.mjs`): port
3100 as the site ships, and port 3101 with the guided descent media treated as present
(tests serve synthetic fixtures there). Builds go to `.next-test*`, so a dev server
keeps working. It covers:

- full-page screenshots at 375, 768, and 1280 px, saved to `test-results/screenshots/`
- no horizontal scroll at those widths
- axe accessibility checks (WCAG 2.2 AA plus best practices) with every FAQ open
- 44px minimum touch targets
- a content guard that fails on night activities, agency names, Jacksonville, review
  counts, "Test Tour", em dashes, or LocalBusiness data
- reduced motion, JavaScript disabled, the panel layout, copy buttons, and the mobile menu
- the guided descent: scrubbing, seek limits, every fallback, memory, layout shift, and
  screenshots of each chapter at 375, 768, and 1440 px

Tests use your installed Google Chrome. To use Playwright's own browser instead, run
`npx playwright install chromium` and remove the `channel` line in
`playwright.config.ts`.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, choose **Add New > Project**, import the repository, and keep the
   detected Next.js settings. No environment variables are needed.
3. Deploy. Vercel builds with `npm run build`.
4. Before pointing a domain at it, read the booking links section below.

## Editing content

All business content lives in `content/site.ts`. Components read from it, so text,
prices, and answers from Tabitha can change without touching layout code.

- **Prices and booking links:** `serviceList`. Book URLs are built from
  `business.bookingBase` plus each `bookingPath`.
- **Experience details:** `experiences` (summary, steps, time, ages, what's included).
- **Courses:** `courses` and `courseStages`.
- **Section headings and intros:** the "Page copy" block at the bottom.
- **FAQ:** `faq`. Questions appear in the order listed.
- **Photos:** `photos`. See `docs/asset-manifest.md`.

### Unconfirmed facts

Never guess. When something isn't confirmed, use `ask("topic")` instead of a value:

```ts
duration: ask("how long a guided tour runs"),
```

The page then shows an "Ask Tabitha" prompt with her phone and email in that spot.
When she answers, replace the `ask(...)` with the real value:

```ts
duration: "About 2 hours",
```

Track open questions in `docs/content-needed.md`.

### Underwater videos

The "Free underwater videos" section is built but hidden. Once Tabitha confirms that
direct bookings include videos, set `business.videosIncluded` to `true`.

## The guided descent (scroll-scrubbed video)

The section under the hero scrubs underwater footage as you scroll. No footage
exists yet, so it shows an illustrated water column. To add footage:

```bash
npm run video:prepare -- <your-master-clip.mov>
npm run video:bench -- public/video/guided-descent.mp4 public/video/guided-descent.webm
```

Replace `<your-master-clip.mov>` with the path to the real footage (relative paths
work from whatever folder you run the command in). The first command writes the
videos and posters into `public/`; the second measures seek times. Rebuild and deploy, and the section switches to the footage on its own.
Everything about it, from what to film to the QA checklist, is in
[docs/video-production.md](docs/video-production.md).

## Booking links and the domain

Book buttons point at `https://www.tabsaquaquestdiving.com/booking-calendar/...`, where
her Wix booking pages live today. Her existing links also use `/book-online`.

**`/book-online` and `/booking-calendar/*` must keep resolving on whatever domain
serves Wix booking.** If this site takes over `www.tabsaquaquestdiving.com`:

1. Move Wix booking to its own host first, for example `book.tabsaquaquestdiving.com`.
2. Set `business.bookingBase` in `content/site.ts` to that host.
3. Set `WIX_BOOKING_ORIGIN` in `next.config.ts` to the same host. That turns on
   redirects so old `/book-online` and `/booking-calendar/*` links on this domain
   forward to Wix instead of breaking.
4. Confirm `business.siteUrl` matches the final domain. It drives the canonical URL,
   sitemap, robots.txt, and share tags.

## How the page is put together

| Path | What it is |
|---|---|
| `content/site.ts` | Every business fact and all page copy |
| `app/page.tsx` | The page, top to bottom, as a stack of panels |
| `app/globals.css` | Design tokens (palette, type, frame, panels) and all component styles |
| `components/sections/` | One file per section |
| `components/ui.tsx` | Book button, Ask Tabitha prompt, contact lines, photo slots |
| `components/illustrations.tsx` | The hero sea, line-art tank and bridge, dotted waterlines, ring badges, and the scalloped seal |
| `components/page-script.tsx` | Client: copy buttons, menu closing, pausing offscreen animations |
| `components/immersive/` | The guided descent (client), with `hooks/`, `lib/motion/`, `lib/video/`, and `styles/guided-descent.css` |
| `scripts/` | Video preparation, seek benchmark, and the test servers |
| `app/opengraph-image.tsx`, `app/sitemap.ts`, `app/robots.ts`, `app/icon.svg` | Share image, sitemap, robots, favicon |
| `docs/` | Open content questions and the photo manifest |

The page works without JavaScript. Every section renders on the server and nothing
waits on a scroll trigger to be readable. `components/page-script.tsx` wires up the
copy buttons, closes the mobile menu, and pauses animations that are offscreen. The
guided descent loads GSAP in idle time and only then switches to its scroll-driven
layout; without it, its four chapters read as a normal section. Under `prefers-reduced-motion`, the floating
bubbles, flowing waterlines, and turning badges all stop.

Every panel sets `data-tone="light"` or `data-tone="dark"`, which picks the text,
rule, focus ring, and button colors for that panel. If you change a color in `:root`,
recheck contrast on the panels that use it.

### Out of scope for v1

Accounts, payments, a database, an admin area, and waivers or medical forms. Booking
stays on Wix. The code keeps business data in one file and has no server code, so
those can be added later without untangling the page.
