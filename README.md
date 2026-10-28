# Tabs AquaQuest Diving

Marketing site for Tabs AquaQuest Diving, Tabitha's instructor-led snorkeling and scuba
business. The homepage reads as one dive: you start at the surface, sink through the
water while learning how a first dive goes, explore the reef where the experiences
are, go deeper for certification, make a safety stop with Tabitha, and come back up to
the shore to book. Booking stays on Wix: every Book button links out to her existing
booking calendar.

Built with Next.js (App Router), TypeScript, and Tailwind CSS. Fully static: no API
routes, no server actions, no environment variables. Behind the dive is a real-time
3D underwater world in three.js, built from code and a fixed seed and loaded after
the page has painted, with a small hand-written 2D WebGL water scene for devices the
world is too heavy for. No image, model, or video files are needed. The design system
is in [docs/design-system.md](docs/design-system.md).

## Run it

Needs Node 20.9 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

If a CSS change doesn't show up in dev, stop the server, delete the `.next` folder,
and start again. (Tests build into `.next-test`, so they don't clash with dev.)

## Build

```bash
npm run build
npm start
```

The root layout sets `ensureStatic = "navigation"`, so the build fails if anything
would make the page render per request. Keep it that way.

## Test

```bash
npm run lint
npm test
```

`npm test` runs Playwright against two production builds (`scripts/test-servers.mjs`):
port 3100 as the site ships, and port 3101 with the descent footage treated as present
(tests serve synthetic fixtures there). It covers:

- no horizontal scroll at 375, 768, and 1280 px, with full-page screenshots in
  `test-results/screenshots/`
- axe accessibility checks (WCAG 2.2 AA plus best practices) with every FAQ open
- 44px minimum touch targets, including form fields and the chooser
- the 3D world (`tests/world.spec.ts`): the camera path and its framing, loading
  after first paint, text contrast over the world measured from rendered pixels at ten
  points of the journey on desktop and phone, drawing only while visible, one still
  frame under reduced motion, hand-overs to the 2D water, and screenshots of each scene
- text contrast over the 2D water and the still frame, measured from rendered pixels
- a content guard that fails on night activities, agency names, Jacksonville, review
  counts, depths in feet or meters, "Test Tour", em dashes, or an address in the
  structured data
- every booking link is one of the six real Wix booking pages; every in-page link has
  a target
- reduced motion, JavaScript disabled, WebGL unavailable, the booking chooser (with and
  without script), the group planner's validation and its honest "nothing is sent"
  message, the header, copy buttons, the phone menu and booking bar, and the 404 page
- the ocean stage: scroll mapping, the seam into the reef, stopping when off screen,
  layout shift, and every footage case (scrubbing, failures, phones, memory)

The test browser renders WebGL in software, about a frame a second for the world, so
the world tests wait for the camera rather than timing it. They prove correctness and
fallbacks, not frame rate: check that on real devices (see the QA checklist in
`docs/video-production.md`).

Tests use your installed Google Chrome. To use another Chromium build instead, point
`PW_CHROMIUM_PATH` at it:

```bash
PW_CHROMIUM_PATH=/path/to/chromium npm test
```

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
- **The hero and the first-dive steps:** `hero`, `heroFacts`, and `descent`.
- **The booking chooser:** `bookCopy.paths` (each answer and the services it suggests).
- **Safety facts:** `essentials`.
- **Section headings and intros:** the "Page copy" block.
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

## The ocean stage and optional footage

Behind every section from the hero to the ascent is the ocean stage. Today it runs the
3D world: a camera travels through it as you scroll, keyed to the sections
(`lib/world/path.ts`). Where WebGL 2 is missing or the world runs too slowly, the 2D
water covers the surface and descent instead; with reduced motion the stage is one
still frame. To check each version, add `?renderer=world`, `scene`, `still`, `static`,
`video`, or `frames` to the address, and `?quality=high`, `medium`, or `low` (reduced
motion always wins).

Real footage can replace the world for the surface and descent:

```bash
npm run video:prepare -- <your-master-clip.mov>
npm run video:bench -- public/video/guided-descent.mp4 public/video/guided-descent.webm
```

The first command writes the videos and posters into `public/`; the second measures
seek times. Rebuild and deploy, and the stage switches to the footage on its own.
What to film, budgets, and the QA checklist are in
[docs/video-production.md](docs/video-production.md).

## The group planner

"Plan a group outing" (in Bring your people) composes an email to Tabitha in the
visitor's own mail app, with the occasion, headcount, date, and interests filled in.
The site has no server, so nothing is sent from it, and the form says so. A form that
sends directly would need a form service and credentials kept server-side; see
`docs/content-needed.md`.

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

Until then, any address this site doesn't have shows the 404 page, which links back
to the booking section and Tabitha's phone.

## How the page is put together

| Path | What it is |
|---|---|
| `content/site.ts` | Every business fact and all page copy |
| `app/page.tsx` | The page, top to bottom, as one dive |
| `app/globals.css` | Design tokens, the tone system, and every section's styles |
| `components/sections/` | One file per section |
| `components/immersive/` | The ocean stage (`OceanStage`, client), its server wrapper (`Dive`), and the depth gauge |
| `lib/world/` | The 3D world (three.js, loaded lazily): terrain, reef, water, creatures, the shared light model, and the camera path |
| `components/art/` | The surface, diver, reef, fish, and bridge illustrations |
| `components/forms/GroupPlanner.tsx` | The group planner (client) |
| `components/ui.tsx` | Book button, Ask Tabitha prompt, contact lines, photo frames |
| `components/page-script.tsx` | Client: copy buttons, menu, header state, reveals, booking bar, pausing offscreen animation |
| `lib/ocean/` | The 2D water shader and its WebGL renderer |
| `lib/art/` | The seeded reef generator; `app/art/` serves its layers as prerendered SVG |
| `lib/motion/`, `lib/video/`, `hooks/` | Scroll mapping, motion preferences, and footage scrubbing |
| `scripts/` | Video preparation, seek benchmark, and the test servers |
| `app/opengraph-image.tsx`, `app/sitemap.ts`, `app/robots.ts`, `app/icon.svg`, `app/not-found.tsx` | Share image, sitemap, robots, favicon, 404 |
| `docs/` | The design system, open content questions, the asset manifest, and the stage and footage notes |

The page works without JavaScript. Every section renders on the server, the hero's
water is drawn in CSS until the world takes over, and the booking chooser is plain
radio buttons. Script adds the 3D world (or the 2D water), reveals, copy buttons, and
the planner. Under `prefers-reduced-motion`, everything that moves stops: the stage is
one still frame and the descent reads as a compact list.

Every section sets `data-tone="light"` or `data-tone="dark"`, which picks the text,
rule, focus ring, and button colors for that section. If you change a color in
`:root`, rerun `npm test`: the contrast checks will tell you if anything slipped.

### Out of scope for v1

Accounts, payments, a database, an admin area, and waivers or medical forms. Booking
stays on Wix. The code keeps business data in one file and has no server code, so
those can be added later without untangling the page.
