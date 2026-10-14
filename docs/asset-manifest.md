# Asset manifest

No photos, footage, or logo files have been supplied yet. The site uses drawn scenes,
line art, and clearly labeled slots instead. No AI-generated or stock photos may stand
in for Tabitha, her customers, or her dive sites. Everyone shown in a photo needs to
have agreed to appear on the site.

## Photo slots

Every slot switches on by itself: save the file at the path below and rebuild. No code
change. Then rewrite the slot's `alt` text in the `photos` block of `content/site.ts`
to describe what is actually in the photo. JPG, WebP, AVIF, or PNG all work (the site
serves AVIF or WebP at the right size through `next/image`).

| Slot id | File | Where it appears | Shape | Minimum size | What the photo should show | Until it exists |
|---|---|---|---|---|---|---|
| `hero` | `public/photos/hero.jpg` | The hero frame, behind the headline. Only the caustic light stays on top | Wide, cropped to fill: about 16:9 on desktop, tall on phones | 2400 x 1500 | Calm, dim water lit from the surface, with open space bottom left for the headline. Moody and blue, like the reference | The drawn underwater scene (canvas) |
| `discover-scuba` | `public/photos/discover-scuba.jpg` | Top of the Discover Scuba card | 16:10 | 1600 x 1000 | A first-timer in shallow water during practice, ideally with Tabitha nearby. Calm and reassuring | Card shows no photo |
| `snorkeling` | `public/photos/snorkeling.jpg` | Top of the Snorkeling card | 16:10 | 1600 x 1000 | Snorkelers on one of her guided tours | Card shows no photo |
| `tabitha-portrait` | `public/photos/tabitha-portrait.jpg` | Meet Tabitha, beside her intro | 4:5 (portrait) | 1200 x 1500 | Tabitha herself, face clearly visible, at the water or in gear. The most important photo on the site | A labeled "Photo coming soon" slot |
| `group` | `public/photos/group.jpg` | Bring your people, above the occasion chips | 16:10 | 1600 x 1000 | A real group from a birthday, bachelorette, or family outing, with their permission | Hidden |
| `underwater-video` | `public/photos/underwater-video.jpg` | Free underwater videos (hidden until `videosIncluded` is true) | 4:3 | 1600 x 1200 | A still from a real customer video, with their permission | Hidden with its section |

## Hero video (optional)

A short looping clip can replace the drawn hero scene. Muted, no text, no audio,
under 4 MB.

| File | Required | What it is |
|---|---|---|
| `public/video/hero.mp4` | Yes, to switch it on | H.264, about 1920 wide, 8 to 15 s seamless loop |
| `public/video/hero.webm` | Optional | The same clip in VP9 |
| `public/images/hero-poster.webp` | Recommended | First frame, shown before playback and under reduced motion |

## Guided descent footage

Scroll-scrubbed footage for the section under the hero. Full brief, budgets, and
encoding commands: `docs/video-production.md`. Until these exist, the section shows the
illustrated water column (`DescentScene`) and the hero's media card shows the line-art
bridge. Once they exist, the hero card shows a muted preview with a play button that
opens the clip in a lightbox.

| File | Required | Budget | What it should show | Status |
|---|---|---|---|---|
| `public/video/guided-descent.mp4` | Yes | 8 MB | 10 to 18 s, surface to reef, slow steady camera, no text, no audio | Missing |
| `public/video/guided-descent.webm` | Yes | 8 MB | Same clip, VP9 | Missing |
| `public/images/guided-descent-poster.webp` | Yes | 250 KB | First frame, 1920 wide | Missing |
| `public/images/guided-descent-mobile.webp` | Yes | 150 KB | First frame, 4:5 crop, 1080 wide | Missing |
| `public/video/guided-descent-mobile.mp4` | Optional | 3 MB | Same clip, 960 wide, for phones (also the hero card's preview) | Missing |

`npm run video:prepare -- master.mov` makes all five from one master.

## Drawn and line art (final, no replacement needed)

| Piece | Where | File |
|---|---|---|
| Underwater scene: caustics, light rays, particles, bubble trails | Hero, until a hero photo or video exists | `components/hero/HeroCanvas.tsx` |
| Line-art bridge, park shore, palm, and meeting pin | Hero media card, Where we meet (behind Show map) | `components/illustrations.tsx` (`BridgeLineArt`) |
| Illustrated water column, surface to reef | The guided descent, until footage arrives | `components/immersive/DescentScene.tsx` |

## Brand files

| Asset | Current stand-in | What's needed |
|---|---|---|
| Logo | A placeholder line-art emblem (a diver among sea grass in a circle) beside "Tabs AquaQuest" in Raleway (`components/emblem.tsx`, also drawn in `lib/share-image.tsx`) | Her logo as SVG, in a version that works in white on deep blue. **Pending** |
| Favicon | Diver-down flag on deep navy (`app/icon.svg`) | Optional: a square crop of her logo |
| Apple touch icon | Diver-down flag on deep water (`app/apple-icon.tsx`) | Optional: her logo |
| Share image | Generated at build time: the headline in Raleway on deep water (`lib/share-image.tsx`) | Optional: a version with a real photo, 1200 x 630 |
