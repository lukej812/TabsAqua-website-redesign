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
| Where certification courses take place | "Ask Tabitha" on each course card ("Where"), in "Where we meet", and in the FAQ | Course buyers can't see where they will train. | `courseDetails.location` |
| Course schedules and upcoming dates | "Ask Tabitha" on each course card ("When") | Planning ahead for a course. | `courseDetails.schedule` |
| What each course price includes (materials, gear, certification fees) | "Ask Tabitha" on each course card ("Included") | Comparing $600 / $400 / $500 against other shops. | `courseDetails.inclusions` |
| Tabitha's training and certifications, and the certifying agency | Ask Tabitha prompt in "Meet Tabitha". No agency is named anywhere. | Trust signals for nervous beginners. Naming the agency on course cards. | `about.credentials`. Add the agency to course summaries only once confirmed. |
| Guided tours: what happens, how long, minimum age, what's included (gear?) | Four "Ask Tabitha" links in the guided tours card | Certified divers deciding whether to book. | `experiences` entry for `guided-tours`: `steps`, `duration`, `minimumAge`, `included` |
| Group size limits | Ask Tabitha prompts in "Bring your people" and the FAQ | Planning birthdays, bachelorettes, and reunions. | `groups.sizeLimits`, and the `group-size` FAQ entry |
| Cancellation and weather refund policy | Ask Tabitha prompt in the FAQ under "What if the weather turns?" | Booking confidence. Experiences are weather dependent. | The `weather` FAQ entry |
| How Groupon customers redeem | The site only says "Call or email to schedule your experience." | Smoother voucher redemption. | `groupon.text` and the `groupon` FAQ entry |
| Does snorkeling need any experience or swimming ability? | The snorkeling card's tag says only "From age 8". Only Discover Scuba says "No experience needed". | Telling non-swimmers whether snorkeling suits them. | `experiences` entry for `snorkeling`: `tag` and `summary` |
| What to bring and wear | Not on the site | A useful FAQ for first-timers. | Add an entry to `faq` |
| Business address (if any) | Not on the site. The Phil Foster Park meeting point is a public park and must never be used as the business address. | LocalBusiness structured data for search. | Add an address field and JSON-LD only after she confirms one. |
| Final domain, and where Wix booking will live | `business.siteUrl` and `business.bookingBase` both assume `www.tabsaquaquestdiving.com` | Launch. If this site takes over the www domain, Book buttons would point back at this site. | `business.siteUrl`, `business.bookingBase`, and `WIX_BOOKING_ORIGIN` in `next.config.ts`. See README. |
| Logo files | A placeholder line-art emblem (a diver among sea grass) beside the name in Raleway, in the header, footer, 404 page, and share image. The favicon is a diver-down flag. | Brand consistency. | Replace `components/emblem.tsx` (and the inline copy in `lib/share-image.tsx`); optionally `app/icon.svg`. See `docs/asset-manifest.md`. |
| Guided descent footage (see `docs/video-production.md`) | The section under the hero shows an illustrated water column instead of footage, and the hero's media card shows the line-art bridge instead of a video preview. Missing: `public/video/guided-descent.mp4`, `public/video/guided-descent.webm`, `public/images/guided-descent-poster.webp`, `public/images/guided-descent-mobile.webp`. Optional: `public/video/guided-descent-mobile.mp4`. | The scroll-scrubbed footage. Who films it, where, and the permission of anyone shown. | No code change: add the files to `public/` and rebuild. Paths are in `guidedDescent.assets`. |
| Group size, for the guided descent copy | The brief's chapter 2 said "small groups"; it was removed. | A "small groups" selling point. | `guidedDescent.chapters` (first-breath `text`) |
| Real photos | A labeled portrait slot in "Meet Tabitha". Slots for the hero, the Discover Scuba and Snorkeling cards, and the group section stay hidden until a file lands in `public/photos/`. | See `docs/asset-manifest.md`. | No code: drop the file in `public/photos/`, then update `alt` in `photos` |
| Hero footage or photo (optional) | The hero shows a drawn underwater scene. | A real view of her water in the first screen. | No code: `public/video/hero.mp4` (plus optional `.webm` and poster) or `public/photos/hero.jpg`. See `docs/asset-manifest.md`. |
| Social media links | No social icons anywhere. The hero rail shows only Call, Email, and Directions. | Visitors following her accounts. | Add confirmed URLs to `social`; the rail shows an icon for each. |
| Formspree endpoint for the group form | The form opens a pre-filled email to info@tabsaquaquestdiving.com ("Opens your email app"). | Inquiries arriving straight in her inbox, without the visitor's email app. | Not in `content/site.ts`: set `NEXT_PUBLIC_FORM_ENDPOINT` in Vercel and redeploy. See README, "Contact form". |

## Deliberately left off the site

| Topic | Why |
|---|---|
| Night snorkeling and night scuba | The park restricts night diving to permit holders. Do not mention night activities unless Tabitha confirms she holds a permit. |
| Jacksonville | The phone number has a Jacksonville area code, but no service area is confirmed. Make no Jacksonville claims. |
| Reviews, ratings, review counts, years in business | Not verified. The only testimonial is Mandi K.'s, used verbatim. |
| Wildlife guarantees | "Snorkeling with marine life" is the service name. The copy never promises what you will see. |
| The "Test Tour" listing and "Service 11" | Wix test entries. Never show them. The mobile Book button jumps to the Experiences section instead of her `/book-online` page for this reason. |
