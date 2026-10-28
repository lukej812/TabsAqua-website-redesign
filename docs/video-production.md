# The ocean stage: the 3D world, footage, and engineering notes

Everything from the hero to the end of the ascent scrolls over one **ocean stage**: a
full-screen layer that stays put (CSS `position: sticky`) while the content moves
over it. As you scroll, a camera travels through an underwater world: it sinks below
the waterline, follows the diver down to the sand, glides along the reef past the
three experiences, looks up at snorkelers, goes deeper to the descent line for the
courses, holds the line at the safety stop, and rises to surface again before the
shore.

**Status:** built and tested. **No footage exists yet**, so the stage shows the
**3D world** (`lib/world/`), a real-time scene in three.js built from code and a
fixed seed, with no image or model files. Where the world is too heavy, the lighter
**2D water scene** (`lib/ocean/shader.ts`) covers the surface and descent instead.
Real footage is an optional upgrade for the surface and descent: add the files below
and rebuild, and the stage scrubs the footage there instead.

## Contents

0. [The 3D world](#0-the-3d-world)
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

## 0. The 3D world

**Why real-time 3D.** The brief asked for real depth: foreground, midground, and
background, a camera moving through water, light shafts, caustics on the reef, fog,
and one consistent lighting logic. There is no footage, no photos, and no working
video-generation service in this project (Higgsfield was not reachable from the build
environment, and nothing was generated or bought). Layered 2D art can fake parallax
but not a camera that turns, rises, and looks up. So the world is real-time 3D,
procedurally built, with the content kept in plain HTML over it. It is
illustration, not photography: it never claims to be Tabitha's site or trips.

**What is in it.** All in `lib/world/`:

| File | What it builds |
|---|---|
| `look.ts` | The palette and light (sun direction and color, absorption, fog), and the quality presets |
| `glsl.ts` | The one light model every material shares: sun light losing red, then green, with depth; caustics projected along the light; distance fog toward the water's own color; rim light from the water |
| `noise.ts` | Seeded noise, the tileable caustic pattern, and a noise texture |
| `terrain.ts` | The sand floor (ripples, rubble on slopes, seagrass beds) and the seagrass blades |
| `reef.ts` | Rock mounds and their growth: sea rods, sea fans, brain and star coral heads, barrel and tube sponges |
| `water.ts` | The water around you, the surface from below (Snell's window), light shafts, drifting particles, and the over-under sky pass |
| `creatures.ts` | The diver (with a kick that follows effort), bubbles, fish schools, the descent line and buoy |
| `places.ts` | Landmarks the scene and the camera share: the descent line, the snorkelers |
| `path.ts` | The camera's journey (below) |
| `world.ts` | Puts it together: `createWorld(canvas, quality)` returns `resize`, `frame`, `dispose` |

**The camera path** (`path.ts`). Each shot belongs to an element on the page and is
exact when that element's top reaches a set height on screen; between shots the camera
glides on a smooth curve. So the camera meets its section at any screen size and any
text length. Each shot names a subject (the diver by default, or the snorkelers, or
the descent line), and the camera turns so the subject sits about 74% across on wide
screens (right of the text column) and 62% on phones. The waterline is part of each
shot: at rest in the hero, high in the frame for the sinking beat half a screen down,
out of frame through the dive, and back for the surfacing shot.

**Text over the world.** A veil of deep water behind the text column, stronger where
a shot looks up at the bright surface (`scrim` per shot), plus soft pools where text
sits outside the column. See `docs/design-system.md`. `tests/world.spec.ts` measures
it from pixels.

**Loading.** three.js and the world load with a dynamic import in idle time after the
page has painted (tested), only for the world and still tiers. The chunk is 155 KB
gzipped (610 KB raw). Until it is ready, the illustrated surface shows; the canvas
fades in over it once the first frame is drawn.

**Cost.** About 0.6 million triangles at high, 0.43 at medium, 0.31 at low, in about
40 to 75 draw calls (instancing for grass, fish, and reef growth). Drawing resolution
is capped at 1.5 device pixels and scaled by the preset (100%, 75%, 55%). Phones
start at low, small-memory or 4-core devices at medium.

**The governor.** Every 45 frames the controller averages frame time. Over 32 ms it
lowers resolution (down to 60%); under 18 ms it raises it again; over 55 ms at the
lowest resolution it hands over to the 2D water. A lost WebGL context also hands over.
`?renderer=` or `?quality=` in the URL turn the governor off, for checking.

**Not measured yet.** Frame rates on real phones and GPUs. The test browser renders
WebGL in software (about a frame a second at 1440 × 900), so it proves correctness
and fallbacks, not smoothness. See the QA checklist.

## 1. What to film

Only needed if Tabitha wants real footage in place of the world for the surface and
descent. One
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

Only for the footage version: without these files the world runs.
All paths are under `public/`. The site checks which exist **at build time**
(`components/immersive/Dive.tsx`), so add them and redeploy.

| File | Required | Budget | Notes |
|---|---|---|---|
| `video/guided-descent.mp4` | Yes | 8 MB max, aim for 4 to 6 MB | H.264, 1920 wide. Primary source. |
| `video/guided-descent.webm` | Yes | 8 MB max | VP9. Fallback source. |
| `images/guided-descent-poster.webp` | Yes | 250 KB max | First frame, 1920 wide. Shown before and instead of the video. |
| `images/guided-descent-mobile.webp` | Yes | 150 KB max | First frame, 4:5 crop, 1080 wide. Phone poster. |
| `video/guided-descent-mobile.mp4` | Optional | 3 MB max | 960 wide. Without it, phones keep the world. |
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
| `components/immersive/Dive.tsx` | Server component. Checks which footage files exist at build time, and wraps every section from the hero to the ascent around the stage. |
| `components/immersive/OceanStage.tsx` | Client component. Picks the tier, loads the world, owns the one scroll controller and the governor. |
| `lib/world/` | The 3D world and its camera path (section 0) |
| `components/art/SurfaceArt.tsx` | The over-under view drawn in CSS and SVG: shown first, and kept for the static tier |
| `components/art/Diver.tsx` | The diver silhouette |
| `lib/ocean/shader.ts`, `lib/ocean/renderer.ts` | The 2D water scene: one fragment shader, plain WebGL 1, no library |
| `hooks/useVideoScrub.ts` | Waits for `loadedmetadata`, routes seeks through the coordinator, detects failed sources |
| `hooks/useFrameSequence.ts` | The optional image-sequence renderer |
| `lib/video/seek-coordinator.ts` | One active seek, one latest queued seek, nothing else |
| `lib/motion/descent.ts` | Pure functions: scroll to progress and depth, footage time, frame, diver pose, smoothing |
| `lib/motion/preferences.ts` | Reduced motion, data saver, slow connection, low-end device, tier choice |
| `app/globals.css` (the "dive" block) | The stage, the static surface, the steps, the diver's bubbles |

**One scroll value.** A single `requestAnimationFrame` loop reads the page's scroll,
smooths it like a weighted camera (about 0.14 s to catch up, `follow` in
`lib/motion/descent.ts`), and derives everything from it: where the 3D camera is on
its path, the 2D water's depth, the footage time, the frame, the flat diver's
position, and the hand-off color at the end of the descent. Nothing else listens to
scroll, so nothing drifts out of sync. The loop runs only while the stage is on screen
and the tab is visible; for footage it also stops once the camera has settled. The
stage marks `data-settled` when the camera has caught up, for tests.

**No GSAP.** The earlier version loaded GSAP and ScrollTrigger (about 44 KB gzipped)
only to measure progress. The stage now needs one scroll reading and one smoothing
function, so they were removed.

**No pinning, no scroll hijacking.** The content is ordinary page content in normal
flow. The stage behind it is `position: sticky` inside the dive wrapper, so it stays
on screen exactly as long as the dive does (hero to ascent), then scrolls away with
the wave edge into the shore. Scrolling is always the browser's own.

**The hand-offs.** With the world, there is no seam inside the dive: once the world
paints, each zone's own water and flat art fade out, and the world is the one place
behind everything. At the end of the ascent the camera surfaces and a wave edge, filled
with the shore's color, carries the page onto the sand. With the 2D water, the
surface and descent are the 2D scene and the zones from the reef on paint their own
water over it: over the last screen of the descent the shader blends into `#0a3656`
(`END_COLOR` in `Dive.tsx`, `--deep` in the CSS), and once the reef's edge is on
screen, everything below it, so the edge always meets the same color. A test samples
the pixels on both sides of the seam.

**Seeking (footage only).** Setting `currentTime` starts an asynchronous seek. The
coordinator allows one seek in flight and remembers only the newest requested time
behind it. Requests in between are dropped. When a seek finishes, it waits for the
frame to reach the screen (`requestVideoFrameCallback`, or one animation frame where
that doesn't exist) before starting the queued one. Timeouts cover events that never
arrive. Tests show at most 1 in flight and 1 queued.

**Loading.**

1. The server renders the hero, the steps, and the illustrated surface as plain
   HTML and CSS. That is the first paint, with no JavaScript needed.
2. After hydration the client picks a tier. For the world it loads three.js in idle
   time, builds the scene, and fades the canvas in over the illustration once the
   first frame is drawn. For the 2D water it compiles the shader the same way. Both
   show the same over-under composition as the illustration, so the cross-fade is
   soft.
3. Footage (when present) loads in idle time after hydration, and fades in over the
   poster once its first frame is decoded.

## 7. Phones, reduced motion, and fallbacks

The client picks a tier once it is running (`chooseTier` in
`lib/motion/preferences.ts`):

| Situation | What the visitor gets |
|---|---|
| No footage (today), WebGL 2 | **world:** the 3D world, driven by scroll |
| No footage, WebGL 1 only | **scene:** the 2D water for the surface and descent, then each zone's own water and art |
| The world proves too slow, or the GPU drops it | **scene** |
| Desktop with the video files | **video:** scroll scrubs the footage through the surface and descent |
| Phone with the mobile cut | **video**, using `guided-descent-mobile.mp4` |
| Phone without the mobile cut | **world** (or **scene**) |
| `NEXT_PUBLIC_USE_FRAME_SEQUENCE=true` with frames | **frames:** a canvas image sequence |
| Both video sources fail, or the frames fail | **world** (or **scene**) |
| Reduced motion, WebGL 2, no footage | **still:** one frame of the world at the surface, drawn once; the steps in normal flow |
| Reduced motion with footage | **static**, showing the footage poster |
| Data saver, a 2G connection, or a very low-memory device | **static:** the illustrated surface, nothing downloaded |
| WebGL missing | **static** |
| No JavaScript | **static**, rendered by the server |

Phones start the world at the low preset, at a wider field of view, with the camera
turned toward each shot's subject. The 2D water on phones draws at half resolution
and 30 frames a second. With reduced motion the steps also lose their screen-tall
spacing and read as a compact list.

## 8. Performance findings

Measured on the production build:

- **First paint:** the 3D world is not in it. three.js and the world (155 KB
  gzipped) load in idle time afterwards, only when the world or still tier runs
  (tested: the chunk starts after first contentful paint).
- **The 3D world:** see section 0 for triangles, draw calls, resolution, and the
  governor. It stops drawing as soon as the dive leaves the screen (tested), and
  under reduced motion it draws exactly one frame (tested).
- **2D water:** rendered at about two thirds of screen resolution on desktops and
  half on phones, capped at 1.1 megapixels, with one draw call per frame. It stops
  drawing as soon as the stage leaves the screen (tested).
- **Downloads:** no image or video files for the stage at all without footage. With
  footage, nothing in the static tier, and the video only after hydration.
- **Layout shift while it starts:** under 0.02 (tested).
- **Seeks during rapid alternating scrolling:** never more than 1 in flight and 1
  queued (tested).
- **Memory:** heap growth under 2 MB after scrolling through 8 times (tested).
- **Not yet measured:** frame rates of the world on real phones and GPUs (the test
  browser renders in software), and real footage sizes and seek times (see the QA
  checklist).

## 9. Accessibility

- The hero has the page's one `h1`. The descent is a section with its own `h2` and an
  ordered list of steps, each read as "Step 1 of 3: On shore" with a real heading.
- The canvas, video, illustration, diver, and scrims are hidden from assistive
  technology. All meaning is in the HTML.
- Text over the world and the water passes WCAG AA, measured from the rendered
  pixels (axe cannot see into a canvas): large text at least 3:1, everything else at
  least 4.5:1. Over the world, every text in the dive is measured at ten points of the
  journey at 1440 and 375 px (`tests/world.spec.ts`); over the 2D water and the still
  tiers, the hero and steps (`tests/descent.spec.ts`). The per-shot veil and the soft
  pools make this hold wherever the light falls.
- Keyboard: nothing in the descent is hidden or pinned, so focus order is reading order.
- The depth gauge on wide screens names zones ("Surface", "The reef"), never depths in
  feet, and is hidden from assistive technology.

## 10. Testing

Automated, in `tests/world.spec.ts` and `tests/descent.spec.ts` (run with `npm test`).
Port 3100 serves the site as it ships; port 3101 is a build that treats the footage as
present, with synthetic test-pattern fixtures from `tests/fixtures/guided-descent`
served at the real paths.

The 3D world (`tests/world.spec.ts`):

- the camera path: scroll to shot index, the waterline from surface to surfacing,
  every shot's subject right of the column on wide screens and in frame on phones,
  the camera never under the sand or above the surface
- renders behind the dive, replaces the zones' flat water and art, stays pinned,
  never requests footage, loads three.js only after first paint
- follows the camera path section by section in the page
- text contrast over the world at 1440 and 375 px, at ten points of the journey
- stops drawing off screen; draws one frame under reduced motion; a forced tier does
  not override reduced motion
- hands over to the 2D water when WebGL 2 is missing or the context is lost
- layout shift while it starts
- screenshots of the surface, sinking, descent, reef, snorkeling, deeper, safety
  stop, surfacing, and booking at 375×812, 768×1024, and 1440×900 in
  `test-results/screenshots/world-*.png`

The descent, the 2D water, and footage (`tests/descent.spec.ts`):

- the scroll mapping, smoothing, footage time, frames, and the diver on phones
- the seek coordinator: one active and one queued seek, direction changes, frame
  presentation, timeouts, cleanup
- the 2D water scene: renders, sticks, gives way to the reef's own water, never
  requests footage, stops drawing off screen, hands off to the reef without a seam
- contrast of the hero and step text over the water at 1440 and 375 px, live and still
- WebGL unavailable, reduced motion, and no JavaScript
- layout shift while it starts
- footage: metadata, scrubbing forward and back, rapid direction changes, resize,
  back and forward navigation, MP4 or WebM failing, both failing, reduced motion with
  the poster, a slow connection, memory after repeated scrolling
- phones with the mobile cut, the phone poster, and the frame-sequence renderer
- screenshots at 0, 25, 50, 75, and 100% at 375×812, 768×1024, and 1440×900 in
  `test-results/screenshots/`

### Manual QA checklist (before launch)

- [ ] iPhone Safari and Android Chrome on a mid-range phone: the world is smooth (or
      hands over to the 2D water within a few seconds), scrolling never stutters,
      the page scrolls through the dive normally. Note which tier and `data-scale`
      the stage settles on
- [ ] A recent laptop with integrated graphics, and a desktop GPU: the world holds
      full resolution (`data-scale` absent or 1.00)
- [ ] Desktop Safari, Chrome, Firefox, Edge: forward, back, fast flicks, trackpad and wheel
- [ ] Reduced motion on (macOS and iOS settings): one still frame, compact steps
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
- **A real-time 3D world instead of footage or an illustration** while no footage
  exists, behind the whole dive rather than only the descent (section 0). No
  generated video was used: no generation service was available, and generated
  footage could be mistaken for Tabitha's real trips.
- **MP4 first, WebM second.** Based on the measurements in section 4.
- **The gauge shows zone names, not depths in feet,** so nothing reads as a measured
  dive depth.

## 12. Open decisions

- **Footage:** whether to film at all. The world is a finished design on its own;
  footage would add real place and people (see section 1). With footage, the surface
  and descent show it, and the zones after it show their own water rather than the
  world.
- **Phones:** if footage is made, whether to make the 960 px mobile cut. Without it,
  phones keep the world.
- **Generated video:** if a generation service is ever used for atmosphere, approve
  costs first, pilot one clip, and never present it as Tabitha's trips or site.
- **Frame sequence:** stays off unless real-device testing shows video seeking is not
  good enough.
- **Audio:** none. Add only if Tabitha asks, and never autoplay it.
