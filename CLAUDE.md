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
- Statically rendered (`ensureStatic = "navigation"`). No server actions, no API routes,
  no environment secrets. One optional public variable, `NEXT_PUBLIC_FORM_ENDPOINT`
  (a Formspree-compatible URL for the group form); without it the form opens a
  pre-filled email
- Fonts through `next/font`: Raleway (display) and Instrument Sans (body)
- Deploy target: Vercel, with Vercel Web Analytics (cookieless, loaded only in Vercel
  builds) and a "Book click" event on every booking link
- Animation: CSS, plus GSAP + ScrollTrigger for scroll-linked moments only: the guided
  descent, the hero drift, the statement's word lighting, the course beam, and ray
  parallax. GSAP is lazy-loaded in idle time and must never enter the initial bundle.
  No Framer Motion or other animation libraries
- Client components: `components/page-script.tsx` (reveals, copy buttons, pointer
  effects, count-up), `components/motion/`, `components/hero/` (canvas, glow,
  carousel, video card), the header, the group form, the map facade, and
  `components/immersive/`. Everything else stays a Server Component

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
- Guided tour details (what happens, length, ages, what's included)
- Social media accounts. Ship no social icons until a URL is confirmed in
  `content/site.ts` (`social`)

Never show: the "Test Tour" listing, or anything called "Service 11".

## Design: deep sea (after the Dive Academy reference)

Reference: https://dribbble.com/shots/22680505-Scuba-Diving-Dive-Academy-Website-Landing-Page-Inspiration.
In Oct 2026 the owner asked for this look, with motion and build quality matching his
portfolio (https://github.com/lukej812/portfolio, techniques only). It replaced the
"Aquans" framed-panel design, which is in git history.

One long page of rounded frames floating on deep navy. Dark only.

```
HEADER   Fixed. Emblem and "Tabs AquaQuest" left; Experiences, Courses, About, Groups,
         FAQ, Contact as uppercase micro-labels with a sliding active indicator; a glass
         "Book a dive" pill. Transparent over the hero, a glass pill after 24px. Thin
         scroll-progress line. Phones: full-screen menu
HERO     The reference frame (100svh). Canvas underwater scene (caustics, god rays,
         particles, bubble trails). H1 bottom left: "Take your first breath
         *underwater.*" Lead "Or your next great dive." Explore dives + "New to scuba?
         Start here". Left rail (call, email, directions). Glass objects right: media
         card (bridge, or footage with a lightbox), the "I felt safe the whole time"
         quote chip, and a scroll-snap carousel of the three experiences
MARQUEE  Every service, a slow CSS loop
DESCENT  "The guided descent". See docs/video-production.md before changing it
FACTS    Count-up stats, verified numbers only
EXPER.   Three large glass cards with tilt, spotlight, and a shimmer; Book buttons
STATEMENT "The first breath feels strange. The second feels like *flying.*"
COURSES  Open Water, Advanced, Rescue joined by a beam that fills on scroll; stages
ABOUT    Portrait slot, intro, credentials Ask; Mandi K.'s testimonial, line by line
GROUPS   Occasion chips, group size Ask, inquiry form (endpoint or mailto)
WHERE    Address, directions, click-to-load Google map behind the line-art bridge
FAQ      Native details as glass rows
CONTACT  "Ready when *you are.*" Phone and email with copy buttons; Groupon ticket
FOOTER   Emblem, links, phone, email, back to top, booking note
```

- Palette (tokens on `:root` in `app/globals.css`): abyss #0b1a2a (page), deep #10263b
  (sections), ocean #1c4566, shallow #2f6f8f (light), foam #eaf4f8 (text) at 100%,
  78% (body), and 68% (labels), sea-glass #7fd6d0 (the single accent: focus rings,
  active nav, highlights). Flag red #e2363f only for the diver-down flag and favicon.
  Glass is white at 7 to 12% with a white/16% hairline
- Type: Raleway 200 and 300 for display, with italic on one to three emphasized words
  (`*asterisks*` in `content/site.ts`), tight tracking, never bold. Instrument Sans
  for body (16 to 18px), and for micro-labels at 12px, uppercase, 0.18em tracking
- Shape: frames 28 to 32px radius, cards 20 to 24px, pills fully round, 1px hairlines
- Glass rule: `.glass` is fill and border only. `backdrop-filter` (with `-webkit-`)
  only on things over the moving hero or fixed: the header pill, the hero's glass
  objects, the book bar, and modal backdrops. Never more than about six on screen
- Emblem: a placeholder line-art diver among sea grass (`components/emblem.tsx`) until
  her logo arrives. The favicon stays the diver-down flag
- Photos: none supplied yet. Slots switch on when a file lands in `public/photos/`
  (see `docs/asset-manifest.md`). No AI or stock photos presented as Tabitha, her
  customers, or her dive sites
- Motion (the portfolio's vocabulary): one easing, `cubic-bezier(0.16, 1, 0.3, 1)`,
  0.6 to 0.9s reveals and 0.2 to 0.3s hovers. Hero entrance is CSS on first paint,
  under 600ms. Below the fold, a fade plus 24px rise, staggered, from one shared
  IntersectionObserver. Magnetic primary buttons, card tilt up to 6 degrees with a
  spotlight, a cursor glow in the hero, nudging arrows: fine pointers only. Animate
  only transform and opacity. Pause loops offscreen and in hidden tabs
- Reduced motion: no loops, parallax, tilt, or magnetic pull; the canvas draws one
  still frame; all text fully visible; scroll effects rest at their end state. The
  descent falls back to its editorial layout

Avoid: student counts, avatar stacks, star ratings, "Enroll now" (say "Book a dive"),
social icons without verified URLs, night dives, agency names, Jacksonville, purple
gradients, glowing blobs, numbered markers except on the real course steps, and
"Dive into adventure" filler.

## Copy voice

Warm, specific, reassuring to nervous beginners. Tabitha is the person visitors are
trusting. Sentence case, active voice, short sentences, no em dashes.

## Quality bar

- Semantic HTML, one h1, skip link, visible sea-glass focus, 44px touch targets, WCAG
  2.2 AA contrast on every surface, including text over the moving hero
- `prefers-reduced-motion`: no loops, parallax, tilt, or magnetic pull. All content
  visible, scroll effects at rest
- Every section readable with JavaScript disabled. Content below the fold may start
  hidden for its reveal only under these rules: it hides only after the boot script
  adds `js` to `<html>` (so no-JS visitors see everything), the observer fires about
  15% before an element enters the viewport, a failsafe shows everything after 3
  seconds if the observer never starts, and reduced motion hides nothing
- Works at 375, 768, 1280, and 1440 px with no horizontal scroll, in Chrome and in
  WebKit (most visitors are on iPhones)
- Every interactive element is in the README's "Every button works" table and has a
  Playwright test
- Metadata: real title and description, Open Graph tags, sitemap, robots. No
  LocalBusiness address until the owner confirms one
- `next.config` redirects placeholder: note in the README that /book-online and
  /booking-calendar/* must keep resolving on whatever domain serves Wix booking

## Docs to keep current

- `docs/video-production.md`: guided descent footage brief, encoding, measurements, QA
- `docs/content-needed.md`: every unresolved fact and what it blocks
- `docs/asset-manifest.md`: every placeholder image and the real photo it needs
- `README.md`: run, build, deploy, and how to edit `content/site.ts`
