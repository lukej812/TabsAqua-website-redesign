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
| Where certification courses take place | Ask Tabitha prompts in "Get certified" (Deeper), "Where we meet", and the FAQ | Course buyers can't see where they will train. | `courseDetails.location` |
| Course schedules and upcoming dates | Ask Tabitha prompt in "Get certified" | Planning ahead for a course. | `courseDetails.schedule` |
| What each course price includes (materials, gear, certification fees) | Ask Tabitha prompt in "Get certified" | Comparing $600 / $400 / $500 against other shops. | `courseDetails.inclusions` |
| Tabitha's training and certifications, and the certifying agency | Ask Tabitha prompt in "Meet Tabitha" (the safety stop). No agency is named anywhere. | Trust signals for nervous beginners. Naming the agency on course cards. | `about.credentials`. Add the agency to course summaries only once confirmed. |
| Guided tours: what happens, how long, minimum age, what's included (gear?) | Four "Ask Tabitha" links in the guided tours entry on the reef | Certified divers deciding whether to book. | `experiences` entry for `guided-tours`: `steps`, `duration`, `minimumAge`, `included` |
| Group size limits | Ask Tabitha prompts in "Bring your people" and the FAQ. The group planner asks for a headcount but sets no maximum. | Planning birthdays, bachelorettes, and reunions. | `groups.sizeLimits`, and the `group-size` FAQ entry |
| Cancellation and weather refund policy | Ask Tabitha prompt in the FAQ under "What if the weather turns?" | Booking confidence. Experiences are weather dependent. | The `weather` FAQ entry |
| How Groupon customers redeem | The site only says "Call or email to schedule your experience." | Smoother voucher redemption. | `groupon.text` and the `groupon` FAQ entry |
| Does snorkeling need any experience or swimming ability? | The snorkeling badge says only "From age 8". Only Discover Scuba says "No experience needed". | Telling non-swimmers whether snorkeling suits them. | `experiences` entry for `snorkeling`: `tag` and `summary` |
| What to bring and wear | Not on the site | A useful FAQ for first-timers. | Add an entry to `faq` |
| Business address (if any) | Not on the site. The Phil Foster Park meeting point is a public park and must never be used as the business address. | LocalBusiness structured data for search. | Add an address field and JSON-LD only after she confirms one. |
| Final domain, and where Wix booking will live | `business.siteUrl` and `business.bookingBase` both assume `www.tabsaquaquestdiving.com` | Launch. If this site takes over the www domain, Book buttons would point back at this site. | `business.siteUrl`, `business.bookingBase`, and `WIX_BOOKING_ORIGIN` in `next.config.ts`. See README. |
| Logo files | The name set in the headline serif, after a small diver-down flag. The favicon is the flag. | Brand consistency. | Replace `Wordmark` in `components/sections/header.tsx` and `app/icon.svg`. |
| Descent footage, optional (see `docs/video-production.md`) | The hero and descent run the live water scene. Footage would replace it. | Real footage of her site. Who films it, where, and the permission of anyone shown. | No code change: add the files to `public/` and rebuild. Paths are in `descent.assets`. |
| Group size, as a selling point | "Small groups" appears nowhere, because group size is unconfirmed. | A "small groups" line in the descent or the safety stop. | `descent.steps` or `essentials` |
| What the briefing covers | The descent says only that experiences start with a briefing on shore. | A more specific, reassuring first step ("gear, hand signals, and..."). | `descent.steps` (the `briefing` step) |
| Real photos | No photo slots show in production; each section stands without its photo. | Trust, above all Tabitha's portrait. See `docs/asset-manifest.md`. | `photos` |
| A contact form that sends | The group planner opens the visitor's own email app with a drafted message. The site has no server, so nothing is sent from it, and it never says otherwise. | Visitors without an email app on their device copy the message or call instead. | Needs a decision on a form service (or Wix) and its credentials, kept server-side. Out of scope for v1. |

## Deliberately left off the site

| Topic | Why |
|---|---|
| Night snorkeling and night scuba | The park restricts night diving to permit holders. Do not mention night activities unless Tabitha confirms she holds a permit. |
| Jacksonville | The phone number has a Jacksonville area code, but no service area is confirmed. Make no Jacksonville claims. |
| Reviews, ratings, review counts, years in business | Not verified. The only testimonial is Mandi K.'s, used verbatim. |
| Wildlife guarantees | "Snorkeling with marine life" is the service name. The copy never promises what you will see. |
| The "Test Tour" listing and "Service 11" | Wix test entries. Never show them. Every "Book a dive" button jumps to the booking section on this page instead of her `/book-online` page for this reason. |
| Depths in feet or meters | The depth gauge and zone names ("Surface", "The reef", "Deeper", "Safety stop") are atmosphere. No number on the page may read as a dive depth, except the verified "about three feet of water" for shallow practice. |
