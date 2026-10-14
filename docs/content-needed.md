# Content needed from Tabitha

Everything here is either unverified or missing. None of it appears on the site as
fact. Where a gap shows up on the page, the site shows an "Ask Tabitha" prompt with
her phone and email instead of guessing.

When she answers, update `content/site.ts` (and the "Verified content" section of
`CLAUDE.md`), then remove the row here.

## Open questions

| Gap | Where it shows on the site | What it blocks | Where to fill it in `content/site.ts` |
|---|---|---|---|
| Are underwater videos included with direct bookings? Her marketplace listings include them, at different prices than her own site. | Nowhere. The "Free underwater videos" section is built but hidden. | A selling point for first-timers. | Set `business.videosIncluded` to `true` and confirm the wording in `videos`. |
| Where certification courses take place | Ask Tabitha prompts in "Get certified", "Where we meet", and the FAQ | Course buyers can't see where they will train. | `courseDetails.location` |
| Course schedules and upcoming dates | Ask Tabitha prompt in "Get certified" | Planning ahead for a course. | `courseDetails.schedule` |
| What each course price includes (materials, gear, certification fees) | Ask Tabitha prompt in "Get certified" | Comparing $600 / $400 / $500 against other shops. | `courseDetails.inclusions` |
| Tabitha's training and certifications, and the certifying agency | Ask Tabitha prompt in "Meet Tabitha". No agency is named anywhere. | Trust signals for nervous beginners. Naming the agency on course cards. | `about.credentials`. Add the agency to course summaries only once confirmed. |
| Guided tours: what happens, how long, minimum age, what's included (gear?) | Four "Ask Tabitha" links in the guided tours panel | Certified divers deciding whether to book. | `experiences` entry for `guided-tours`: `steps`, `duration`, `minimumAge`, `included` |
| Group size limits | Ask Tabitha prompts in "Bring your people" and the FAQ | Planning birthdays, bachelorettes, and reunions. | `groups.sizeLimits`, and the `group-size` FAQ entry |
| Cancellation and weather refund policy | Ask Tabitha prompt in the FAQ under "What if the weather turns?" | Booking confidence. Experiences are weather dependent. | The `weather` FAQ entry |
| How Groupon customers redeem | The site only says "Call or email to schedule your experience." | Smoother voucher redemption. | `groupon.text` and the `groupon` FAQ entry |
| Does snorkeling need any experience or swimming ability? | The snorkeling badge says only "From age 8". Only Discover Scuba says "No experience needed". | Telling non-swimmers whether snorkeling suits them. | `experiences` entry for `snorkeling`: `tag` and `summary` |
| What to bring and wear | Not on the site | A useful FAQ for first-timers. | Add an entry to `faq` |
| Business address (if any) | Not on the site. The Phil Foster Park meeting point is a public park and must never be used as the business address. | LocalBusiness structured data for search. | Add an address field and JSON-LD only after she confirms one. |
| Final domain, and where Wix booking will live | `business.siteUrl` and `business.bookingBase` both assume `www.tabsaquaquestdiving.com` | Launch. If this site takes over the www domain, Book buttons would point back at this site. | `business.siteUrl`, `business.bookingBase`, and `WIX_BOOKING_ORIGIN` in `next.config.ts`. See README. |
| Logo files | The name set in the headline serif stands in. The favicon is a diver-down flag. | Brand consistency. | Replace `Wordmark` in `components/sections/header.tsx` and `app/icon.svg`. |
| Guided descent footage (see `docs/video-production.md`) | The section under the hero shows an illustrated water column instead of footage. Missing: `public/video/guided-descent.mp4`, `public/video/guided-descent.webm`, `public/images/guided-descent-poster.webp`, `public/images/guided-descent-mobile.webp`. Optional: `public/video/guided-descent-mobile.mp4`. | The scroll-scrubbed footage. Who films it, where, and the permission of anyone shown. | No code change: add the files to `public/` and rebuild. Paths are in `guidedDescent.assets`. |
| Group size, for the guided descent copy | The brief's chapter 2 said "small groups"; it was removed. | A "small groups" selling point. | `guidedDescent.chapters` (first-breath `text`) |
| Real photos | Four labeled photo slots (five with videos on), plus an optional hero photo. The design is photo-led, so these matter more than before. | See `docs/asset-manifest.md`. | `photos` |

## Deliberately left off the site

| Topic | Why |
|---|---|
| Night snorkeling and night scuba | The park restricts night diving to permit holders. Do not mention night activities unless Tabitha confirms she holds a permit. |
| Jacksonville | The phone number has a Jacksonville area code, but no service area is confirmed. Make no Jacksonville claims. |
| Reviews, ratings, review counts, years in business | Not verified. The only testimonial is Mandi K.'s, used verbatim. |
| Wildlife guarantees | "Snorkeling with marine life" is the service name. The copy never promises what you will see. |
| The "Test Tour" listing and "Service 11" | Wix test entries. Never show them. The mobile Book button jumps to the Experiences section instead of her `/book-online` page for this reason. |
