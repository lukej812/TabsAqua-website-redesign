# Tabs AquaQuest Diving

Marketing site for Tabs AquaQuest Diving, Tabitha's instructor-led snorkeling and scuba
business. One long page of rounded frames floating on deep water, styled after the
[Dive Academy shot](https://dribbble.com/shots/22680505-Scuba-Diving-Dive-Academy-Website-Landing-Page-Inspiration):
dim blue-teal water lit from the surface, thin Raleway headlines with italic accents,
frosted-glass objects, and uppercase micro-labels. Motion and build quality follow
[Luke's portfolio](https://github.com/lukej812/portfolio) (techniques only, no shared
code or content). Booking stays on Wix: every Book button links to her booking calendar.

Built with Next.js (App Router), TypeScript, and Tailwind CSS. Fully static: no API
routes, no server actions. One optional environment variable for the contact form, and
Vercel Web Analytics on deployed builds.

## Run it

Needs Node 20.9 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

If a CSS change doesn't show up in dev, stop the server, delete the `.next` folder,
and start again. (Tests build into `.next-test`, so they never clash with dev.)

## Build

```bash
npm run build
npm start
```

The root layout sets `ensureStatic = "navigation"`, so the build fails if anything
would make the page render per request. Keep it that way.

## Test

```bash
npx playwright install webkit
npm test
```

Runs Playwright against two production builds (`scripts/test-servers.mjs`): port 3100
as the site ships, and port 3101 with the guided descent footage treated as present
and the group form pointed at a test endpoint (tests serve synthetic fixtures and mock
the endpoint). Builds go to `.next-test*`, so a dev server keeps working.

Two browser projects:

- **chrome** (your installed Google Chrome) runs everything.
- **webkit** (iPhone 13 mini, 375 x 812) runs the tests tagged `@webkit`: layout,
  first screen, menu, carousel, form, book bar, links, and no-JS. Most visitors are on
  iPhones.

Coverage:

- full-page screenshots at 375, 768, 1280, and 1440 px in `test-results/screenshots/`,
  with no horizontal scroll and no console errors
- axe (WCAG 2.2 AA plus best practices) with every FAQ answer and the Groupon ticket open
- 44px minimum touch targets, and the phone hero fitting the first screen
- a content guard that fails on night activities, agency names, Jacksonville, review
  counts, students, ratings, stars, "enroll", avatar stacks, "Test Tour", em dashes, or
  a LocalBusiness address
- the "every button works" contract below, one test per interactive piece
- reduced motion, JavaScript disabled, GSAP staying out of the initial bundle,
  security headers, share images, and the 404 page
- the guided descent: scrubbing, seek limits, every fallback, memory, layout shift, and
  screenshots of each chapter

Tests use your installed Google Chrome. To use Playwright's own browser instead, run
`npx playwright install chromium` and remove the `channel` line in
`playwright.config.ts`.

For design review, `./scripts/serve-test.sh` builds and serves the site on port 3200,
then `node scripts/shoot-sections.mjs http://localhost:3200 <out-dir> 375 1280` saves a
screenshot of every section (add `REDUCED=1` or `NOJS=1`), and `scripts/shoot.mjs`
captures the first screen (`FULL=1` for the whole page).

## Every button works

Every interactive element, and where it goes. `tests/site.spec.ts` enforces it: no
`href="#"` or `javascript:` links, every button declares its handler (`data-action`) or
submits a form, every control has an accessible name, every in-page link has a target
the fixed header doesn't cover, and each piece below has its own test.

| Element | Where | What it does |
|---|---|---|
| Emblem and name | Header | Back to the top (`#top`) |
| Experiences, Courses, About, Groups, FAQ, Contact | Header, mobile menu, footer | Jump to `#experiences`, `#courses`, `#about`, `#groups`, `#faq`, `#contact`; the header underlines the section you're in |
| Book a dive | Header pill, mobile book bar | Jumps to `#experiences` |
| Menu / Close menu | Header, phones and tablets | Opens the full-screen menu: focus trapped, scroll locked, Escape closes, focus returns to the button. Without JavaScript it's a link to the footer navigation |
| Call, Email, Get directions | Hero rail (wide screens) | `tel:`, `mailto:`, Google Maps in a new tab |
| Explore dives | Hero | `#experiences` (magnetic on mouse) |
| New to scuba? Start here | Hero, guided descent | The Discover Scuba card (`#discover-scuba`) |
| Meet at Blue Heron Bridge card | Hero | `#where` (shown until guided descent footage exists) |
| Play the guided descent video | Hero media card (only with footage) | Opens the footage in a modal lightbox; Escape or Close video closes it |
| Quote chip | Hero | Mandi K.'s testimonial (`#testimonial`) |
| Previous / Next experience, arrow keys, swipe | Hero carousel | Moves one card; disabled at the ends; announces "2 of 3" |
| Card arrows | Hero carousel | That experience's full card (`#discover-scuba`, `#snorkeling`, `#guided-tours`) |
| Scroll cue | Hero (wide screens) | `#guided-descent` |
| Explore dives | Guided descent, last chapter | `#experiences` |
| Book now | Each experience and course card | That service's Wix page: `bookingBase` + `bookingPath`, same tab. Sends a "Book click" analytics event |
| Ask Tabitha (inline) | Unconfirmed details | `#contact` |
| Call / Email Tabitha | Ask Tabitha boxes, menu, footer, Groupon ticket | `tel:` and `mailto:` |
| See Discover Scuba | Groups | `#discover-scuba` |
| Send inquiry | Group form | Posts to `NEXT_PUBLIC_FORM_ENDPOINT`, or opens a pre-filled email ("Group inquiry: occasion") if it's unset or fails. Inline errors, no past dates |
| Get directions | Where we meet | Google Maps in a new tab ("opens in a new tab" for screen readers) |
| Copy (address, phone, email) | Where we meet, Ready when you are | Copies to the clipboard, says "Copied", and announces it |
| Show map | Where we meet | Loads the Google Maps embed; nothing loads from Google before |
| FAQ questions | FAQ | Open and close the answer |
| Call / Email | Ready when you are | `tel:` and `mailto:` |
| Have a Groupon? | Ready when you are | Opens the redemption instructions |
| Back to top | Footer | `#top` |
| Back to the surface | 404 page | Home |

## Performance

Measured with Lighthouse on a production build (mobile, simulated slow 4G):

<!-- lighthouse:start -->
Lighthouse 12, mobile, simulated slow 4G, on `next start` locally. Five alternating
runs each; medians shown. "Before" is the Aquans framed-panel design (commit
`b5367c9`), "after" is this design.

| | Before | After |
| --- | --- | --- |
| Performance | 89 (89 to 89) | 93 (92 to 95) |
| Accessibility | 100 | 100 |
| Best Practices | 100 | 100 |
| SEO | 100 | 100 |
| First Contentful Paint | 1.1 s | 1.2 s |
| Largest Contentful Paint | 3.8 s | 3.1 s |
| Total Blocking Time | 46 ms | 60 ms |
| Cumulative Layout Shift | 0 | 0 |
| Speed Index | 1.1 s | 1.4 s |

The largest paint is the hero headline. The hero canvas costs about 13 ms of script
per second on desktop (about 0.4 ms per drawn frame at 30fps, around 1% of the main
thread) and about 5 ms per second on a phone with the CPU slowed 4x. It draws nothing
until the browser is idle, so it never delays the headline. The only other frame loop
is GSAP ScrollTrigger's own empty keep-alive callback.
<!-- lighthouse:end -->

Guardrails, from the portfolio's profiling. Keep them when adding features.

- **Glass blur only where it earns it.** `.glass` is fill and border only. `.glass-blur`
  goes on things over the moving hero or fixed (header pill, hero objects, book bar,
  lightbox backdrop). About six blurred elements on screen at most.
- **Animate only `transform` and `opacity`.** No animated filters, no layout reads in
  scroll handlers (the header and carousel use IntersectionObservers).
- **Hero canvas:** pixel ratio capped (1 on phones, 1.25 on desktop), 30fps (24 on
  phones), fewer particles on small screens, starts in `requestIdleCallback`, pauses
  offscreen and in hidden tabs, one still frame for reduced motion.
- **GSAP loads in idle time** and never enters the initial bundle (a test checks).
- **Infinite animations are rare** and pause offscreen (`data-anim`).
- **Fonts:** only Raleway (the headline face) is preloaded.

## Deploy to Vercel

1. Import the GitHub repository in Vercel (**Add New > Project**) and keep the
   detected Next.js settings. No environment variables are required.
2. Deploy. Vercel builds with `npm run build`.
3. Make sure the production deployment is public: **Settings > Deployment Protection**,
   set Vercel Authentication to off for production (or "Only Preview Deployments").
   Check with `curl -sI <production-url>`: it must return 200, not a 302 to
   `vercel.com/sso-api`.
4. Before pointing a domain at it, read the booking links section below.

## Contact form (Formspree)

The group inquiry form works without any setup: it opens the visitor's email app with
everything filled in, addressed to info@tabsaquaquestdiving.com. To have inquiries
arrive directly instead:

1. Create a free form at https://formspree.io that sends to
   info@tabsaquaquestdiving.com. Copy its endpoint, for example
   `https://formspree.io/f/abcdwxyz`.
2. In Vercel, open the project's **Settings > Environment Variables** and add
   `NEXT_PUBLIC_FORM_ENDPOINT` with that URL, for Production (and Preview if wanted).
3. Redeploy. The fine print under the button changes to "Sends to Tabitha's inbox."

If the endpoint ever fails, the form falls back to the pre-filled email. Bots that
fill the hidden `_gotcha` field are ignored.

## Analytics (Vercel Web Analytics)

Cookieless page views, so no consent banner is needed. Every Book button also sends a
"Book click" event with the `service` (for example `snorkeling`) and the `section` it
was clicked in (`experiences` or `courses`), so Tabitha can see which services people
try to book. The script loads only in builds on Vercel (`VERCEL=1`), so local builds
and tests load nothing.

1. In Vercel, open the project's **Analytics** tab and click **Enable**.
2. Redeploy. Page views appear within a few minutes of real visits.
3. Book clicks appear under **Events**. Vercel only records custom events on the
   **Pro** and **Enterprise** plans; on Hobby, page views work but the Book click
   events are dropped until the project moves to Pro.

## Editing content

All business content lives in `content/site.ts`. Components read from it, so text,
prices, and answers from Tabitha can change without touching layout code.

- **Prices and booking links:** `serviceList`. Book URLs are built from
  `business.bookingBase` plus each `bookingPath`.
- **Experience details:** `experiences` (summary, steps, time, ages, what's included).
- **Courses:** `courses`, `courseStages`, and `courseDetails`.
- **Section headings and copy:** the "Page copy" block. In headings, `*asterisks*`
  mark the words set in italic, for example `"Get *certified.*"`.
- **The count-up facts:** `facts`. Verified numbers only.
- **FAQ:** `faq`. Questions appear in the order listed.
- **Social links:** `social`. Empty until Tabitha confirms her accounts; the hero rail
  shows an icon for each entry.

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

### Photos

No photos exist yet. Each slot switches on by itself when a file appears at
`public/photos/<slot id>.jpg` (or `.webp`, `.avif`, `.png`) and the site is rebuilt.
Slots, sizes, and what each photo should show are in
[docs/asset-manifest.md](docs/asset-manifest.md). Rewrite the slot's `alt` text in
`content/site.ts` to describe the real photo.

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
videos and posters into `public/`; the second measures seek times. Rebuild and deploy,
and the section switches to the footage on its own. The hero's media card then shows
a muted preview with a play button that opens the clip in a lightbox. Everything
about it, from what to film to the QA checklist, is in
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

Until then, the vercel.app address is the review link, and the site's canonical URL
and Book buttons stay on www.tabsaquaquestdiving.com.

## How the page is put together

| Path | What it is |
|---|---|
| `content/site.ts` | Every business fact and all page copy |
| `app/page.tsx` | The page, top to bottom |
| `app/layout.tsx` | Fonts, metadata, and the boot script that marks the page as scripted |
| `app/globals.css` | Design tokens (palette, type scale, glass, frames) and all component styles |
| `components/sections/` | One file per section, plus the header, group form, and map facade |
| `components/hero/` | Client: the canvas scene, cursor glow, carousel, and video card |
| `components/motion/` | Client: GSAP scroll scenes, and pointer effects with the count-up |
| `components/page-script.tsx` | Client: reveals, copy buttons, pausing offscreen animations |
| `components/ui.tsx` | Book button, Ask Tabitha prompts, contact lines, photo slots |
| `components/emblem.tsx`, `illustrations.tsx`, `icons.tsx` | Line art and icons |
| `components/immersive/` | The guided descent (client), with `hooks/`, `lib/motion/`, `lib/video/`, and `styles/guided-descent.css` |
| `lib/photos.ts`, `lib/public-files.ts` | Build-time checks for photos and footage in `public/` |
| `lib/share-image.tsx`, `assets/fonts/` | The Open Graph and Twitter card (Raleway, OFL) |
| `scripts/` | Video preparation, seek benchmark, test servers, and screenshot helpers |
| `app/opengraph-image.tsx`, `twitter-image.tsx`, `apple-icon.tsx`, `icon.svg`, `sitemap.ts`, `robots.ts`, `not-found.tsx` | Share images, icons, search files, and the 404 page |
| `docs/` | Open content questions, the photo manifest, and the footage brief |

The page works without JavaScript. Every section renders on the server. Content below
the fold fades up as it enters the screen, but only after a boot script marks the page
as scripted, never under reduced motion, and with a 3-second failsafe.

### Out of scope for v1

Accounts, payments, a database, an admin area, and waivers or medical forms. Booking
stays on Wix. The code keeps business data in one file and has no server code, so
those can be added later without untangling the page.
