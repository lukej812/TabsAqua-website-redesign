# Asset manifest

No photos, logo files, or footage have been supplied yet. Everything on the site is
drawn in code: a live water scene, CSS and SVG illustrations, and a reef generated
when the site is built. Nothing on the page pretends to be a photo, and no
"photo coming soon" boxes appear in production. No AI-generated or stock photos may
stand in for Tabitha, her customers, or her dive sites.

Real photos will still lift the site more than anything else, especially Tabitha's
portrait. Each slot below is wired up and waiting.

## Photo slots

Until a slot has a `src`, its section simply shows no photo (the layout is designed
to stand without one). In development (`npm run dev`) each empty slot shows a small
dashed note naming the slot, so the gaps are easy to find. Production never shows it.

To add one: save the file as `public/photos/<slot id>.jpg`, then set its `src` in
the `photos` block of `content/site.ts`, for example
`src: "/photos/tabitha-portrait.jpg"`. Rewrite the `alt` text to describe what is
actually in the photo. No component changes needed.

| Slot id | Where it appears | Shape | Minimum size | What the real photo should show | Status |
|---|---|---|---|---|---|
| `tabitha-portrait` | The safety stop, under the "Meet Tabitha" heading | 4:3, rounded corners | 1600 × 1200 | Tabitha herself, face clearly visible, at the water or in gear. The most important photo on the site. | Missing |
| `discover-scuba` | The reef, above the Discover Scuba "How it goes" steps | 4:3 | 1600 × 1200 | A first-timer in shallow water during practice, ideally with Tabitha nearby. Calm and reassuring, not extreme. | Missing |
| `snorkeling` | The reef, above the snorkeling steps | 4:3 | 1600 × 1200 | Snorkelers on one of her guided tours, at the surface. | Missing |
| `group` | The ascent, under "Bring your people" | 4:3 | 1600 × 1200 | A real group from a birthday, bachelorette, or family outing, with their permission. | Missing |
| `underwater-video` | Free underwater videos (hidden until `videosIncluded` is true) | 4:3 | 1600 × 1200 | A still from a real customer video, with their permission. | Missing, hidden |

Every person shown needs to have agreed to appear on the site. Photos sit on deep
blue sections, so slightly cool, natural color works best; avoid heavy filters.

## Descent footage (optional)

Scroll-scrubbed footage can replace the live water scene behind the hero and the
first-dive steps. Full brief, budgets, and encoding commands:
`docs/video-production.md`. Until these exist, the live water scene runs.

| File | Required for footage | Budget | What it should show | Status |
|---|---|---|---|---|
| `public/video/guided-descent.mp4` | Yes | 8 MB | 10 to 18 s, half in and half out of the water at the surface, then down to the reef. Slow steady camera, no text, no audio | Missing |
| `public/video/guided-descent.webm` | Yes | 8 MB | Same clip, VP9 | Missing |
| `public/images/guided-descent-poster.webp` | Yes | 250 KB | First frame, 1920 wide | Missing |
| `public/images/guided-descent-mobile.webp` | Yes | 150 KB | First frame, 4:5 crop, 1080 wide | Missing |
| `public/video/guided-descent-mobile.mp4` | Optional | 3 MB | Same clip, 960 wide, for phones | Missing |

`npm run video:prepare -- master.mov` makes all five from one master.

## Drawn in code (final, no replacement needed)

| Piece | Where | File |
|---|---|---|
| Live water: sky, sun, waterline, light rays, particles | Behind the hero and descent | `lib/ocean/shader.ts` |
| The same over-under view in CSS and SVG | First paint, reduced motion, no JavaScript, no WebGL | `components/art/SurfaceArt.tsx` |
| Diver silhouette, with rising bubbles | Hero and descent, and the 404 page | `components/art/Diver.tsx` |
| Reef floor: sea fans, sea rods, sponges, coral heads, seagrass | Bottom of the reef section, three layers plus foreground | `lib/art/reef.ts`, served from `app/art/` |
| Schools of fish | The reef and the ascent | `components/art/FishSchool.tsx` |
| Blue Heron Bridge from the park, with the meeting pin | Where we meet | `components/art/BridgeArt.tsx` |
| The surface seen from below, on the way back up | Top of Where we meet | `components/art/BridgeArt.tsx` (`SurfaceEdge`) |
| Share image | Link previews | `app/opengraph-image.tsx` |

The reef uses only forms found on Florida's Atlantic reefs and around Blue Heron
Bridge. Change its look by editing the seeds and sizes in `lib/art/reef-svg.ts`.

## Brand files

| Asset | Current stand-in | What's needed |
|---|---|---|
| Logo | "Tabs AquaQuest" in the headline serif, after a small diver-down flag (`Wordmark` in `components/sections/header.tsx`) | Her logo as SVG, plus a version that works on dark blue |
| Favicon | Diver-down flag on the ocean blue (`app/icon.svg`) | Optional: a square crop of her logo |
| Share image | Generated at build time: the over-under view with the headline (`app/opengraph-image.tsx`) | Optional: a real photo version, 1200 × 630 |
