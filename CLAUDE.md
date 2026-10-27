# Tabs AquaQuest Diving: marketing site (v1)

Project memory for Claude Code. Read this before every task.

## What this is

A public marketing site for Tabs AquaQuest Diving, a small instructor-led scuba and
snorkeling business run by Tabitha. It replaces the current Wix homepage. Booking stays
on Wix for now: every Book button links out to her existing booking pages.

Out of scope for v1: accounts, payments, a database, an admin area, waivers or medical
forms. Do not add Supabase, Stripe, or auth. Structure the code so they can be added later.

## Stack

- Next.js (latest stable, App Router), TypeScript, Tailwind CSS
- Statically rendered. No server actions, no API routes, no environment secrets
- Fonts through `next/font`
- Deploy target: Vercel
- Animation: CSS, plus one hand-written WebGL fragment shader for the water behind the
  hero and descent (`lib/ocean/`). No animation libraries: GSAP was removed in Oct 2026
  when the descent stopped needing it. No Three.js. Scroll stays native: never hijack
  or smooth-scroll the page
- Client components: `components/page-script.tsx`, `components/immersive/OceanStage.tsx`
  and `DepthGauge.tsx`, and `components/forms/GroupPlanner.tsx`. Everything else stays
  a Server Component
- Generated art (the reef) is built at build time from a seed, served as prerendered
  SVG from `app/art/`. Same input, same picture, every build

## Rule zero: do not invent business facts

Only the facts in "Verified content" below may appear on the site. No made-up reviews,
ratings, credentials, certifying agency names, years in business, schedules, wildlife
guarantees, or inclusions. If a fact is missing, show a "Ask Tabitha" contact prompt in
the UI and add the gap to `docs/content-needed.md`.

All business content lives in one typed file, `content/site.ts`, so the owner's answers
can be dropped in without touching components.

## Verified content (checked against her live site and listings, Oct 2026)

Contact
- Phone: 904.482.2453
- Email: info@tabsaquaquestdiving.com
- Show both as selectable text with a copy button, and also as tel:/mailto: links

Services, prices, and booking links (base: https://www.tabsaquaquestdiving.com)

| Service | Price | Booking path |
|---|---|---|
| Discover Scuba (no experience needed) | $99.99 | /booking-calendar/discover-scuba-no-experience-needed-1 |
| Snorkeling with marine life | $79.99 | /booking-calendar/snorkeling-with-marine-life-1 |
| Professional Guided Tours (certified divers) | $99 | /booking-calendar/professional-guided-tours |
| Open Water Diver | $600 | /booking-calendar/open-water-diver |
| Advanced Diver | $400 | /booking-calendar/advanced-diver |
| Rescue Diver | $500 | /booking-calendar/rescue-diver |

Experience details (from her own public listings)
- Snorkel and scuba experiences run about 90 minutes including the briefing
- Beginner scuba: on-shore briefing, shallow-water practice in about three feet of
  water, then a guided dive of roughly 30 minutes
- Snorkeling: safety briefing on shore, shallow-water practice, then a guided tour
- Minimum age: 8 for snorkeling, 10 for scuba
- Equipment is provided for snorkel and scuba experiences
- Weather dependent. A waiver is required. Reservation required
- Guided Tours require a diving certification
- Meeting point for snorkel and scuba experiences: Phil Foster Park at Blue Heron
  Bridge, 900 Blue Heron Blvd, Riviera Beach, FL 33404. This is a public park and a
  meeting point, not a business address. Never put it in LocalBusiness structured data
  as the business location

Testimonial (the only one; use verbatim, attribute to "Mandi K.")
> I'll admit it, I was terrified about breathing underwater for the first time. But
> Tabitha broke it all down and made it so simple to understand. I felt safe the whole
> time, and honestly, I can't wait to go back out again.

Groups: her site promotes birthdays, bachelorette trips, family reunions, and friend
groups, with no experience needed for some options.

Certification structure: describe courses generically as online learning, then
confined-water practice, then open-water dives. Do not name an agency.

## Not verified: keep off the site, list in docs/content-needed.md

- Whether underwater videos are included with direct bookings. Her marketplace listings
  include them, at different prices than the site. Build the "free videos" section
  behind a `videosIncluded` flag in `content/site.ts`, default false
- Night snorkeling and night scuba. The park restricts night diving to permit holders.
  Do not mention night activities at all
- Where certification courses take place, their schedules, and what each price includes
- Certifying agency and Tabitha's credentials
- Group size limits, cancellation and weather refund policy
- Whether Jacksonville is a service area. The phone number has a Jacksonville area code
  but make no Jacksonville claims
- Real photos, logo files, and how Groupon customers redeem

Never show: the "Test Tour" listing, or anything called "Service 11".

## Design: a cinematic dive (Oct 2026)

In Oct 2026 the owner asked for a premium, scroll-driven site that feels like
descending into Florida's underwater world. It replaced the "Aquans" framed-panel
design (still in git history, commit 64b1e89). One long page, full-bleed sections,
read as one dive from the surface and back:

```
HEADER   Links left, flag + "Tabs AquaQuest" centered in the serif, Contact and
         "Book a dive" right. Clear over the sky at the top, solid ink once scrolled
SURFACE  Hero over the ocean stage: an over-under view (sky and sun above the
         waterline, sunlit water below), a diver silhouette. Location pill, H1 "Take
         your first breath underwater, or your next great dive.", lede, Explore dives,
         New to scuba? Start here, quick facts (prices, time, gear)
DESCENT  "New to scuba? Here is how your first dive goes." Three real steps (briefing
         on shore, about three feet of water, a guided dive of roughly 30 minutes),
         then the 90-minute close and Book Discover Scuba. The stage behind darkens
         as you scroll. See docs/video-production.md before changing it
REEF     "Three ways into the water": the three experiences as editorial spreads
         (pitch, price, Book on the left; steps and specs on the right) over a
         generated reef floor and a passing school of fish
DEEPER   Get certified: Open Water, Advanced, Rescue hanging off a descent line from a
         dive-flag buoy, then online learning > confined water > open water (01 02 03)
SAFETY   Safety stop: Meet Tabitha, "Good to know before you go" essentials, and the
STOP     Mandi K. testimonial, big centered serif
ASCENT   Bring your people: occasions, Discover Scuba note, Ask about group sizes, and
         the group planner (drafts an email; never claims to send)
SHORE    The surface seen from below, then Where we meet (address, Maps, copy, bridge
         line art) and the FAQ on warm sand-white
SURFACE  Ready when you are: a "Where are you starting from?" chooser (radio buttons
         and CSS, works without JS), every service and price, phone and email, Groupon
FOOTER   Ink, wordmark, links
```

- Palette: deep ocean blues that darken down the page (`--deep` #0a3656 at the reef,
  `--abyss` #051d33 for courses) and lighten on the ascent; one restrained accent,
  aqua (#a6e6e3), on dark water only; sand-white `--shore` (#f4f1ea) and pale sky for
  the shore and booking; navy text (#173a5c) and ocean-blue buttons (#1f5b8a) on
  light. Diver-down flag red appears only in the flag, the buoy, and the meeting pin.
  Tokens live on `:root` in `app/globals.css`
- Type: Newsreader for headlines (weight 400, tight tracking, italic for accents),
  Instrument Sans for everything else. Not Inter or Space Grotesk
- Signature: silhouettes against light (the diver, the reef, fish), a short line
  before each sentence-case section label, and depth as the organizing idea. Section
  labels name the zone: Surface, Your first dive, The reef, Deeper, Safety stop,
  Ascent, Back on shore, Back at the surface
- Every section sets `data-tone` (light or dark), which sets text, rules, focus rings,
  and button colors. Primary buttons are white on dark water, ocean blue on light
- The ocean stage: tiers video > frames > scene (live WebGL) > static (CSS/SVG).
  Footage is optional; without it the live water scene runs. The stage is sticky
  behind the hero and descent and hands off to the reef color for color
- Motion: the live water, the diver's descent and bubbles, fish crossing, rising
  bubbles at the safety stop, the reef drifting in depth (CSS scroll-driven where
  supported), gentle reveals. Paused offscreen, all off under
  `prefers-reduced-motion`, where the stage is the still illustration and the steps
  read as a compact list
- Depth is atmosphere: the gauge and labels never show feet or meters
- Sticky header. On phones, a sticky bottom "Book a dive" bar that steps aside while
  the hero buttons or the booking section are on screen
- "Have a Groupon?" tells voucher holders to call or email to schedule
- Photos: none supplied. Sections are designed to stand without them; real photos
  slot in via `photos` in `content/site.ts` (see `docs/asset-manifest.md`). No
  "photo coming soon" boxes in production. No AI-generated or stock photos presented
  as Tabitha, her customers, or her dive sites. Illustrated wildlife stays generic
  and Florida-appropriate (sea fans, sponges, seagrass, reef fish), never a promise of
  what you'll see

Avoid: purple gradients, glowing blobs, glassmorphism beyond the header and booking
bar, all-caps labels, two-tone headings anywhere but "Three ways into the water",
"Dive into adventure" filler, custom cursors, scroll-jacking, long empty stretches of
animation, and text over busy imagery without a measured contrast check.

## Copy voice

Warm, specific, reassuring to nervous beginners. Tabitha is the person visitors are
trusting. Sentence case, active voice, short sentences, no em dashes.

## Quality bar

- Semantic HTML, one h1, skip link, visible focus, 44px touch targets, WCAG 2.2 AA
  contrast on every section. Text over the live water is checked from rendered pixels
  in `tests/descent.spec.ts`, since axe cannot see into a canvas
- `prefers-reduced-motion`: no floating, flowing, or turning animations. All content
  still visible
- Every section readable with JavaScript disabled. Reveals only hide content that
  starts below the screen, only when script runs and motion is allowed, and printing
  shows everything
- Works at 375, 768, and 1280 px with no horizontal scroll
- Metadata: real title and description, Open Graph tags, sitemap, robots. No
  LocalBusiness address until the owner confirms one
- `next.config` redirects placeholder: note in the README that /book-online and
  /booking-calendar/* must keep resolving on whatever domain serves Wix booking

## Docs to keep current

- `docs/video-production.md`: the ocean stage, the optional footage brief, encoding,
  measurements, QA
- `docs/content-needed.md`: every unresolved fact and what it blocks
- `docs/asset-manifest.md`: every placeholder image and the real photo it needs
- `README.md`: run, build, deploy, and how to edit `content/site.ts`
