# The descent: footage production and engineering notes

The hero and the first-dive steps scroll over one **ocean stage**: a full-screen
layer that stays put (CSS `position: sticky`) while the content moves over it. As
you scroll, the camera sinks: the waterline rises out of frame, the water darkens,
the light rays thin out, and the diver drifts down and away. At the end of the
descent the stage hands off, color for color, to the reef section below.

**Status:** built and tested. **No footage exists yet**, so the stage shows the
**live water scene**: a WebGL shader (`lib/ocean/shader.ts`) that draws the sky,
sun, waterline, light rays, and drifting particles from math, with no image files.
Real footage is an optional upgrade: add the files below and rebuild, and the
stage scrubs the footage instead.

## Contents

1. [What to film](#1-what-to-film)
2. [Files and size budget](#2-files-and-size-budget)
3. [Preparing the files](#3-preparing-the-files)
4. [Encoding tests and the decision](#4-encoding-tests-and-the-decision)
5. [Video or image sequence](#5-video-or-image-sequence)
6. [How it works](#6-how-it-works)
7. [Phones, reduced motion, and fallbacks](#7-phones-reduced-motion-and-fallbacks)
8. [Performance findings](#8-performance-findings)
9. [Accessibility](#9-accessibility)
10. [Testing](#10-testing)
11. [Where this differs from the brief](#11-where-this-differs-from-the-brief)
12. [Open decisions](#12-open-decisions)

---

## 1. What to film

Only needed if Tabitha wants real footage in place of the live water scene. One
continuous shot, or a few with soft dissolves, 10 to 18 seconds long. Slow, steady
camera movement throughout. No cuts, shake, flashes, or heavy color grading. No text
in the footage: all words on screen are HTML laid over it.

The footage plays across the hero and the descent, from the top of the page to the
start of the reef section. Scroll position maps straight to footage time.

| Scroll | On screen | Text over it |
|---|---|---|
| Start (the hero) | Half in, half out of the water at the surface, in sunlight. Calm sky above, bright aqua below. This first frame is also the poster. Keep the lower left calm: the headline sits there. | The hero headline, buttons, and quick facts |
| About 25% | The camera sinks below the waterline. Clear turquoise water, light rays. | "New to scuba? Here is how your first dive goes." |
| 25 to 80% | A slow, calm descent through open water. If a diver is in frame, keep them to the right: the text column is on the left. | The three first-dive steps |
| 80 to 100% | Deeper, bluer water, the reef starting to show below. End on a stable frame in deep blue, close to `#0a3656`, so it meets the reef section without a seam. | "About 90 minutes, start to finish." and the Discover Scuba button |

Requirements for the master:

- 16:9 landscape, at least 1920 × 1080, 25 or 30 fps
- Ends on a stable frame (the last frame holds while the last text is read)
- Real Tabs AquaQuest footage wherever possible, with the permission of anyone shown
- Nothing that suggests a sighting is guaranteed. The site adds "Marine life and
  conditions vary from dive to dive." whenever footage plays
- Audio is removed during preparation

Never use stock or AI-generated footage presented as Tabitha, her customers, or her
dive site. With real footage in place the illustrated diver is hidden, so the
footage never competes with a drawing.

## 2. Files and size budget

Only for the footage version: without these files the live water scene runs.
All paths are under `public/`. The site checks which exist **at build time**
(`components/immersive/Dive.tsx`), so add them and redeploy.

| File | Required | Budget | Notes |
|---|---|---|---|
| `video/guided-descent.mp4` | Yes | 8 MB max, aim for 4 to 6 MB | H.264, 1920 wide. Primary source. |
| `video/guided-descent.webm` | Yes | 8 MB max | VP9. Fallback source. |
| `images/guided-descent-poster.webp` | Yes | 250 KB max | First frame, 1920 wide. Shown before and instead of the video. |
| `images/guided-descent-mobile.webp` | Yes | 150 KB max | First frame, 4:5 crop, 1080 wide. Phone poster. |
| `video/guided-descent-mobile.mp4` | Optional | 3 MB max | 960 wide. Without it, phones keep the live water scene. |
| `video/frames/` + `manifest.json` | Optional | 6 MB max | Only with `NEXT_PUBLIC_USE_FRAME_SEQUENCE=true`. See section 5. |

**Final media sizes:** not yet recorded, because no footage exists. After preparing
real files, run `npm run video:prepare` (it prints the sizes) and record them here:

| File | Size | Seek avg / p95 (`npm run video:bench`) |
|---|---|---|
| guided-descent.mp4 | | |
| guided-descent.webm | | |
| guided-descent-mobile.mp4 | | |
| guided-descent-poster.webp | | |
| guided-descent-mobile.webp | | |

For reference, a 6-second synthetic 1080p clip prepared with the script came out at
MP4 4.0 MB, WebM 5.3 MB, mobile MP4 0.66 MB, posters 44 KB and 32 KB, and 24 frames
at 0.55 MB. Real underwater footage is softer and usually compresses better.

## 3. Preparing the files

One command does everything, using the `ffmpeg-static` dev dependency (no system
install needed):

```bash
npm run video:prepare -- <your-master-clip.mov>
npm run video:prepare -- <your-master-clip.mov> --frames 90   # also an image sequence
```

To write somewhere other than `public/` for a dry run, set `OUT`:
`OUT=/tmp/descent npm run video:prepare -- master.mov`.

The individual commands (`scripts/prepare-video.sh` has them with comments). Replace
`ffmpeg` with `npx ffmpeg-static` or the path it prints if ffmpeg isn't installed.

**MP4 / H.264, the primary source.** Keyframe every 8 frames, no B-frames, audio
removed, metadata at the front:

```bash
ffmpeg -i master.mov -an -vf "scale=1920:-2:flags=lanczos,fps=30" \
  -c:v libx264 -preset slow -crf 23 -maxrate 4M -bufsize 8M \
  -profile:v high -level 4.1 -pix_fmt yuv420p \
  -g 8 -keyint_min 8 -sc_threshold 0 -bf 0 -movflags +faststart \
  public/video/guided-descent.mp4
```

**WebM / VP9, the fallback:**

```bash
ffmpeg -i master.mov -an -vf "scale=1920:-2:flags=lanczos,fps=30" \
  -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 -deadline good -cpu-used 2 \
  -g 8 -keyint_min 8 \
  public/video/guided-descent.webm
```

**Mobile MP4, 960 wide (optional):**

```bash
ffmpeg -i master.mov -an -vf "scale=960:-2:flags=lanczos,fps=30" \
  -c:v libx264 -preset slow -crf 25 -maxrate 1.6M -bufsize 3.2M \
  -profile:v main -level 3.1 -pix_fmt yuv420p \
  -g 8 -keyint_min 8 -sc_threshold 0 -bf 0 -movflags +faststart \
  public/video/guided-descent-mobile.mp4
```

**Posters from the first frame:**

```bash
ffmpeg -i master.mov -frames:v 1 -vf "scale=1920:-2" -c:v libwebp -quality 72 \
  public/images/guided-descent-poster.webp
ffmpeg -i master.mov -frames:v 1 -vf "crop=ih*4/5:ih,scale=1080:-2" -c:v libwebp -quality 70 \
  public/images/guided-descent-mobile.webp
```

**Removing audio from any file** (the commands above already do this with `-an`):

```bash
ffmpeg -i input.mp4 -an -c:v copy output.mp4
```

**Image sequence (only for the frame-sequence fallback):**

```bash
ffmpeg -i master.mov -vf "fps=6,scale=1280:-2" -c:v libwebp -quality 62 \
  public/video/frames/frame-%04d.webp
```

Then write `public/video/frames/manifest.json`:
`{ "count": 90, "width": 1280, "height": 720, "pattern": "/video/frames/frame-%04d.webp" }`.
The script does this for you.

## 4. Encoding tests and the decision

**Method.** No footage exists yet, so the strategies were compared on a synthetic
1080p clip: a 14-second continuous fractal zoom. It has far more fine detail than
underwater footage, so it is a worst case for file size. Every H.264 variant was
capped at the same bitrate (4 Mbps), so the comparison is fair on size. Each was
scored for picture quality against the master (SSIM, 1.0 is identical) and for seek
time in Google Chrome on this Mac (`scripts/seek-bench.mjs`): the time from setting
`currentTime` to the `seeked` event, over 120 small sequential steps like scrolling
and 40 random jumps, with the file fully loaded so only decoding is measured.

| Variant | Keyframe interval | Size | SSIM | Sequential seek avg / p95 | Random seek avg / p95 |
|---|---|---|---|---|---|
| H.264, default | 250 frames | 7.37 MB | 0.923 | 158 / 317 ms | 180 / 328 ms |
| **Strategy A, H.264** | **8 frames (0.27 s)** | **7.39 MB** | **0.916** | **16 / 21 ms** | **16 / 21 ms** |
| Strategy A, H.264 | 15 frames (0.5 s) | 7.40 MB | 0.921 | 21 / 30 ms | 21 / 29 ms |
| Strategy B, H.264 all-intra | every frame | 7.42 MB | 0.853 | 11 / 11 ms | 11 / 11 ms |
| VP9 | 15 frames | 12.5 MB | 0.893 | 27 / 48 ms | 26 / 37 ms |
| VP9 | 8 frames | 18.1 MB | 0.897 | 24 / 46 ms | 22 / 34 ms |
| VP9 all-intra | every frame | 117 MB | 0.932 | not run | not run |

**Decision: Strategy A, H.264 with a keyframe every 8 frames, as the primary source.**

- The default keyframe spacing is 10× slower to seek and visibly laggy.
- An 8-frame interval seeks in about one display frame (16 ms) with almost no
  quality cost (0.916 vs 0.923) at the same size.
- All-intra (Strategy B) seeks a little faster, but at the same size it loses a lot
  of quality (0.853). Matching quality would need roughly double the size, which
  breaks the budget. Not shipped.
- VP9 came out larger and slower to seek than H.264 on this content, and VP9 is
  software-decoded on many devices. H.264 is hardware-decoded almost everywhere,
  including iPhones. So MP4 is the first `<source>` and WebM the fallback.

**Re-run these with the real footage** before launch: real clips compress very
differently, and a phone decodes more slowly than this Mac.

```bash
npm run video:bench -- public/video/guided-descent.mp4 public/video/guided-descent.webm public/video/guided-descent-mobile.mp4
```

Headless Chrome rarely fires `requestVideoFrameCallback`, so the benchmark times
`seeked`. On real devices the coordinator waits for the frame to be presented
(section 6).

## 5. Video or image sequence

**Video was selected** (for when footage exists). With 8-frame keyframes, Chrome seeks in about 16 ms on
average, so scrubbing stays smooth without an image sequence. Video also costs far
less transfer and memory: one 4 to 7 MB file versus hundreds of images, each decoded
into memory.

The image-sequence renderer is built and tested but **off**, behind
`NEXT_PUBLIC_USE_FRAME_SEQUENCE=true`. Turn it on only if real-device testing shows
video seeking is visibly unreliable on an important browser (iPhone Safari is the
usual suspect). Before turning it on:

1. Build frames: `npm run video:prepare -- master.mov --frames 90`.
2. Measure: total size of `public/video/frames` (budget 6 MB), and memory in the
   browser's task manager while scrolling the descent.
3. Set the flag in Vercel's environment variables and redeploy.

How it behaves: one canvas, resolution capped at 1.5×. The first frame loads at
once, frames nearest the current position load next (4 at a time), and the rest
wait for idle time. It always draws the nearest decoded frame, so fast scrolling
never shows a blank. Phones load at most 60 frames spread evenly across the clip,
desktops at most 180. Leaving the page releases every image.

## 6. How it works

| File | Role |
|---|---|
| `content/site.ts` (`descent`, `hero`) | The step copy, the hero copy, footage paths, and the footage note |
| `components/immersive/Dive.tsx` | Server component. Checks which footage files exist at build time, and wraps the hero and descent around the stage. |
| `components/immersive/OceanStage.tsx` | Client component. Picks the tier, owns the one scroll controller, and moves the diver. |
| `components/art/SurfaceArt.tsx` | The over-under view drawn in CSS and SVG: shown first, and kept for the static tier |
| `components/art/Diver.tsx` | The diver silhouette |
| `lib/ocean/shader.ts`, `lib/ocean/renderer.ts` | The live water scene: one fragment shader, plain WebGL 1, no library |
| `hooks/useVideoScrub.ts` | Waits for `loadedmetadata`, routes seeks through the coordinator, detects failed sources |
| `hooks/useFrameSequence.ts` | The optional image-sequence renderer |
| `lib/video/seek-coordinator.ts` | One active seek, one latest queued seek, nothing else |
| `lib/motion/descent.ts` | Pure functions: scroll to progress and depth, footage time, frame, diver pose, smoothing |
| `lib/motion/preferences.ts` | Reduced motion, data saver, slow connection, low-end device, tier choice |
| `app/globals.css` (the "dive" block) | The stage, the static surface, the steps, the diver's bubbles |

**One scroll value.** A single `requestAnimationFrame` loop reads how far the page
has scrolled past the top of the dive, smooths it like a weighted camera (about
0.14 s to catch up, `follow` in `lib/motion/descent.ts`), and derives everything from
it: the shader's depth, the footage time, the frame, the diver's position, and the
hand-off color at the end. Nothing else listens to scroll, so nothing drifts out of
sync. The loop runs only while the stage is on screen and the tab is visible; for
footage it also stops once the camera has settled.

**No GSAP.** The earlier version loaded GSAP and ScrollTrigger (about 44 KB gzipped)
only to measure progress. The stage now needs one scroll reading and one smoothing
function, so they were removed.

**No pinning, no scroll hijacking.** The content is ordinary page content in normal
flow. The stage behind it is `position: sticky` inside the dive wrapper, so it stays
on screen exactly as long as the hero and descent do, then scrolls away with the
last of them. Scrolling is always the browser's own.

**The hand-off.** Over the last screen of the descent, the shader blends the bottom
of the frame into `#0a3656` (`END_COLOR` in `Dive.tsx`, `--deep` in the CSS), and the
stage's text scrim fades out, so the stage ends on exactly the color the reef section
starts with. A test samples the pixels on both sides of the seam.

**Seeking (footage only).** Setting `currentTime` starts an asynchronous seek. The
coordinator allows one seek in flight and remembers only the newest requested time
behind it. Requests in between are dropped. When a seek finishes, it waits for the
frame to reach the screen (`requestVideoFrameCallback`, or one animation frame where
that doesn't exist) before starting the queued one. Timeouts cover events that never
arrive. Tests show at most 1 in flight and 1 queued.

**Loading.**

1. The server renders the hero, the steps, and the illustrated surface as plain
   HTML and CSS. That is the first paint, with no JavaScript needed.
2. After hydration the client picks a tier. For the live water scene it compiles the
   shader and fades the canvas in over the illustration once the first frame is
   drawn. The two show the same composition, so the cross-fade is soft.
3. Footage (when present) loads in idle time after hydration, and fades in over the
   poster once its first frame is decoded.

## 7. Phones, reduced motion, and fallbacks

The client picks a tier once it is running (`chooseTier` in
`lib/motion/preferences.ts`):

| Situation | What the visitor gets |
|---|---|
| No footage (today) | **scene:** the live water scene, driven by scroll |
| Desktop with the video files | **video:** scroll scrubs the footage |
| Phone with the mobile cut | **video**, using `guided-descent-mobile.mp4` |
| Phone without the mobile cut | **scene** |
| `NEXT_PUBLIC_USE_FRAME_SEQUENCE=true` with frames | **frames:** a canvas image sequence |
| Both video sources fail, or the frames fail | **scene** |
| Reduced motion, data saver, a 2G connection, or a very low-memory device | **static:** the illustrated surface (or the poster) at the top, the steps in normal flow, nothing downloaded |
| WebGL missing, or its context is lost | **static** |
| No JavaScript | **static**, rendered by the server |

Phones draw the water at half resolution and 30 frames a second, and the diver
fades out as the hero leaves (the text is full width there). With reduced motion the
steps also lose their screen-tall spacing and read as a compact list.

## 8. Performance findings

Measured on the production build:

- **The site's own JavaScript** (stage, shader, scroll controller, planner, gauge,
  page script) is one chunk of 17.6 KB gzipped. Everything else is the Next.js and
  React runtime.
- **Live water:** rendered at about two thirds of screen resolution on desktops and
  half on phones, capped at 1.1 megapixels, with one draw call per frame. It stops
  drawing as soon as the stage leaves the screen (tested).
- **Downloads:** no image or video files for the stage at all without footage. With
  footage, nothing in the static tier, and the video only after hydration.
- **Layout shift while it starts:** under 0.02 (tested).
- **Seeks during rapid alternating scrolling:** never more than 1 in flight and 1
  queued (tested).
- **Memory:** heap growth under 2 MB after scrolling through 8 times (tested).
- **Not yet measured:** frame rate on a mid-range phone, and real footage sizes and
  seek times (see the QA checklist).

## 9. Accessibility

- The hero has the page's one `h1`. The descent is a section with its own `h2` and an
  ordered list of steps, each read as "Step 1 of 3: On shore" with a real heading.
- The canvas, video, illustration, diver, and scrims are hidden from assistive
  technology. All meaning is in the HTML.
- White text over the moving water passes WCAG AA, measured from the rendered pixels
  (axe cannot see into a canvas): at 1440 and 375 px wide, live and static, the
  headline is at least 3:1 and every other line at least 4.5:1. Soft pools of deeper
  water behind the text, and a solid patch behind the small location line, make this
  hold wherever the light rays fall.
- Keyboard: nothing in the descent is hidden or pinned, so focus order is reading order.
- The depth gauge on wide screens names zones ("Surface", "The reef"), never depths in
  feet, and is hidden from assistive technology.

## 10. Testing

Automated, in `tests/descent.spec.ts` (run with `npm test`). Port 3100 serves the site
as it ships; port 3101 is a build that treats the footage as present, with synthetic
test-pattern fixtures from `tests/fixtures/guided-descent` served at the real paths:

- the scroll mapping, smoothing, footage time, frames, and the diver on phones
- the seek coordinator: one active and one queued seek, direction changes, frame
  presentation, timeouts, cleanup
- the live water scene: renders, sticks, lets the page continue, never requests
  footage, stops drawing off screen, hands off to the reef without a seam
- contrast of the hero and step text over the water at 1440 and 375 px, live and static
- WebGL unavailable, reduced motion, and no JavaScript
- layout shift while it starts
- footage: metadata, scrubbing forward and back, rapid direction changes, resize,
  back and forward navigation, MP4 or WebM failing, both failing, reduced motion with
  the poster, a slow connection, memory after repeated scrolling
- phones with the mobile cut, the phone poster, and the frame-sequence renderer
- screenshots at 0, 25, 50, 75, and 100% at 375×812, 768×1024, and 1440×900 in
  `test-results/screenshots/`

### Manual QA checklist (before launch)

- [ ] iPhone Safari and Android Chrome on a mid-range phone: the live water is smooth,
      scrolling never stutters, the page scrolls past the descent normally
- [ ] Desktop Safari, Chrome, Firefox, Edge: forward, back, fast flicks, trackpad and wheel
- [ ] Reduced motion on (macOS and iOS settings): the still surface, compact steps
- [ ] Throttle to Slow 4G: the illustrated surface and the text come first
- [ ] 200% browser zoom: nothing clipped
- [ ] VoiceOver and NVDA: headings and steps read in order, nothing decorative announced
- [ ] Lighthouse on mobile: record LCP, TBT, and CLS
- [ ] With real footage: iPhone shows footage (not a black box), it scrubs both ways,
      every step is readable over it, and the final sizes and seek times go in section 2

## 11. Where this differs from the brief

- **The stage spans the hero and the descent,** so the first screen is already the
  start of the dive, instead of a separate pinned section under the hero.
- **No GSAP and no pinned section.** The content scrolls normally over a sticky
  stage. Nothing is hidden waiting for a scroll position.
- **Steps instead of chapters.** The four marketing chapters became the three real
  steps of a first scuba experience (briefing on shore, practice in about three feet of
  water, a guided dive of roughly 30 minutes), all from her own listings, plus a close
  with the time, ages, and booking button.
- **A live water scene instead of an illustration** while no footage exists.
- **MP4 first, WebM second.** Based on the measurements in section 4.
- **The gauge shows zone names, not depths in feet,** so nothing reads as a measured
  dive depth.

## 12. Open decisions

- **Footage:** whether to film at all. The live water scene is a finished design on
  its own; footage would add real place and people (see section 1).
- **Phones:** if footage is made, whether to make the 960 px mobile cut. Without it,
  phones keep the live water scene.
- **Frame sequence:** stays off unless real-device testing shows video seeking is not
  good enough.
- **Audio:** none. Add only if Tabitha asks, and never autoplay it.
