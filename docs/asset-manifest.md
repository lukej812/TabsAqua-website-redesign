# Asset manifest

No photos or logo files have been supplied yet. The site uses illustrations and
clearly labeled photo slots. The design follows a photo-led reference, so real photos
will lift it more than anything else. No AI-generated or stock photos may stand in for
Tabitha, her customers, or her dive sites.

## Photo slots

Each slot shows "Photo coming soon" with a short caption until it gets a real photo.

To add one: save the file as `public/photos/<slot id>.jpg`, then set its `src` in
the `photos` block of `content/site.ts`, for example
`src: "/photos/tabitha-portrait.jpg"`. Rewrite the `alt` text to describe what is
actually in the photo. No component changes needed.

| Slot id | Where it appears | Shape | Minimum size | What the real photo should show | Status |
|---|---|---|---|---|---|
| `hero` | The whole hero panel, behind the headline | Wide, cropped to fill; about 16:9 on desktop and tall on phones | 2400 × 1500 | Calm water with open sky in the top half, where the headline sits. A light wash keeps the text readable, but a busy top half will fight it. | Optional. The illustrated sea shows until it has a `src`. |
| `discover-scuba` | Experiences, the panel beside Discover Scuba | Fills a half-width panel; tall on desktop, wide on phones. Keep the subject centered. | 1600 × 1600 | A first-timer in shallow water during practice, ideally with Tabitha nearby. Calm and reassuring, not extreme. | Placeholder |
| `snorkeling` | Experiences, the panel beside Snorkeling | Same as above | 1600 × 1600 | Snorkelers on one of her guided tours, at the surface. | Placeholder |
| `tabitha-portrait` | Meet Tabitha, the panel beside her intro | Same as above | 1600 × 1600 | Tabitha herself, face clearly visible, at the water or in gear. The most important photo on the site. | Placeholder |
| `group` | Bring your people, full width behind the heading | Wide, about 2:1 | 2400 × 1200 | A real group from a birthday, bachelorette, or family outing, with their permission. Leave calm space at the top for the white heading. | Placeholder |
| `underwater-video` | Free underwater videos (hidden until `videosIncluded` is true) | Fills a half-width panel | 1600 × 1600 | A still from a real customer video, with their permission. | Placeholder, hidden |

Every person shown needs to have agreed to appear on the site.

## Guided descent footage

Scroll-scrubbed footage for the section under the hero. Full brief, budgets, and
encoding commands: `docs/video-production.md`. Until these exist, the section shows the
illustrated water column (`DescentScene`).

| File | Required | Budget | What it should show | Status |
|---|---|---|---|---|
| `public/video/guided-descent.mp4` | Yes | 8 MB | 10 to 18 s, surface to reef, slow steady camera, no text, no audio | Missing |
| `public/video/guided-descent.webm` | Yes | 8 MB | Same clip, VP9 | Missing |
| `public/images/guided-descent-poster.webp` | Yes | 250 KB | First frame, 1920 wide | Missing |
| `public/images/guided-descent-mobile.webp` | Yes | 150 KB | First frame, 4:5 crop, 1080 wide | Missing |
| `public/video/guided-descent-mobile.mp4` | Optional | 3 MB | Same clip, 960 wide, for phones | Missing |

`npm run video:prepare -- master.mov` makes all five from one master.

## Illustrations (final, no replacement needed)

| Illustration | Where | File |
|---|---|---|
| Layered sea with a diver-down buoy | Hero, until a hero photo is supplied | `components/illustrations.tsx` (`HeroSea`) |
| Line-art scuba tank with fact bubbles | The blue panel under the hero | `components/illustrations.tsx` (`TankArt`) |
| Dotted waterlines, ring badges, scalloped seal | Blue panel, experience panels, Meet Tabitha, course timeline | `components/illustrations.tsx` |
| Line-art bridge, park shore, and meeting pin | Where we meet | `components/illustrations.tsx` (`BridgeLineArt`) |
| Illustrated water column, surface to reef | The guided descent, until footage arrives | `components/immersive/DescentScene.tsx` |

## Brand files

| Asset | Current stand-in | What's needed |
|---|---|---|
| Logo | "Tabs AquaQuest" set in the headline serif, centered in the header (`components/sections/header.tsx`) | Her logo as SVG, plus a version that works on the blue |
| Favicon | Diver-down flag on the ocean blue (`app/icon.svg`) | Optional: a square crop of her logo |
| Share image | Generated at build time from the headline (`app/opengraph-image.tsx`) | Optional: a real photo version, 1200 × 630 |
