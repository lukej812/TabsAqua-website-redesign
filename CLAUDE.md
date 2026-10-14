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
- Animation: CSS, plus GSAP + ScrollTrigger for the guided descent only (the owner
  asked for it in Oct 2026). GSAP is lazy-loaded in idle time and must never enter the
  initial bundle. Client components: `components/page-script.tsx` and the
  `components/immersive/` guided descent. Everything else stays a Server Component

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

## Design: framed panels (after the "Aquans" reference)

Reference: https://dribbble.com/shots/21183479-Water-Brand-Ecommerce-Website. In Oct 2026
the owner asked for the site to look like this shot. It replaced the earlier "Guided
Descent" design (sand-to-navy background and side depth gauge), which is gone.

One long page of rounded panels inside a thin white frame.

```
HEADER   Links left, "Tabs AquaQuest" centered in the serif, Contact and Explore dives right
HERO     Pale sky panel. Huge centered serif H1: "Take your first breath underwater, or
         your next great dive." Primary button: Explore dives. Text link: New to scuba?
         Start here. Illustrated sea below (or a real photo once supplied)
DESCENT  "The guided descent": a 420vh section with a sticky stage. Scroll scrubs the
         footage surface to reef; four chapters (Surface, First breath, The reef, Your
         adventure) and a depth gauge follow one progress value. See
         docs/video-production.md before changing it
BLUE     Line-art scuba tank (the reference's bottle) with floating fact bubbles, dotted
         waterlines under each heading, scalloped "See all dives" seal
WHITE    "Three ways into the water": price row with thin dividers (the awards row)
         Experiences: ice text panel beside a photo panel, each with a ring badge.
           Guided tours as one wide blue panel. Price, time, ages, included, Book button
BLUE     Get certified: Open Water, then Advanced, then Rescue, with the
           online learning > confined water > open water timeline
         Free underwater videos (only when videosIncluded is true)
ICE      Meet Tabitha beside her portrait. Mandi K. testimonial, big centered serif
PHOTO    Bring your people: heading over the group photo, occasions row below
SPLIT    Where we meet: line-art bridge (blue) beside the address (ice)
WHITE    FAQ
BLUE     Ready when you are: phone, email, "Have a Groupon?" ticket
FOOTER   Name left, links right
```

- Palette: white, pale sky, ice (#e9f1f8), one ocean blue (#1f5b8a), navy text
  (#173a5c), and a soft mist blue only for the second half of the "Three ways into the
  water" heading. Diver-down flag red appears only in the buoy and Tabitha's badge.
  Primary buttons are blue on light panels and white on blue panels. Tokens live on
  `:root` in `app/globals.css`
- Type: Newsreader for headlines (weight 400, tight tracking, centered as in the
  reference), Instrument Sans for everything else. Not Inter or Space Grotesk
- Signature: white line art on the ocean blue, with dotted waterlines, ring badges, and
  the scalloped seal
- Every panel sets `data-tone` (light or dark), which sets text, rules, focus rings, and
  button colors, so contrast holds on every panel
- Motion: floating bubbles, flowing waterlines, slowly turning badges, and the guided
  descent. Paused offscreen, all off under `prefers-reduced-motion`. The descent falls
  back to an editorial layout (still image, chapters in normal flow) for reduced
  motion, no JavaScript, GSAP failure, data saver, slow connections, and short windows
- Sticky header. On mobile, a sticky bottom Book action
- "Have a Groupon?" tells voucher holders to call or email to schedule
- Photos: none supplied yet. Use illustrations and clearly labeled photo slots listed in
  `docs/asset-manifest.md`. No AI-generated or stock photos presented as Tabitha, her
  customers, or her dive sites

Avoid: purple gradients, glowing blobs, all-caps labels outside the price row, ring
badges, and attributions, numbered 01/02/03 markers except on the real course timeline,
two-tone headings anywhere but "Three ways into the water", "Dive into adventure" filler.

## Copy voice

Warm, specific, reassuring to nervous beginners. Tabitha is the person visitors are
trusting. Sentence case, active voice, short sentences, no em dashes.

## Quality bar

- Semantic HTML, one h1, skip link, visible focus, 44px touch targets, WCAG 2.2 AA
  contrast on every panel
- `prefers-reduced-motion`: no floating, flowing, or turning animations. All content
  still visible
- Every section readable with JavaScript disabled. Nothing waits on a scroll trigger at
  opacity 0
- Works at 375, 768, and 1280 px with no horizontal scroll
- Metadata: real title and description, Open Graph tags, sitemap, robots. No
  LocalBusiness address until the owner confirms one
- `next.config` redirects placeholder: note in the README that /book-online and
  /booking-calendar/* must keep resolving on whatever domain serves Wix booking

## Docs to keep current

- `docs/video-production.md`: guided descent footage brief, encoding, measurements, QA
- `docs/content-needed.md`: every unresolved fact and what it blocks
- `docs/asset-manifest.md`: every placeholder image and the real photo it needs
- `README.md`: run, build, deploy, and how to edit `content/site.ts`
