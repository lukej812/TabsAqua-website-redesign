# The guided descent: video production and engineering notes

A scroll-scrubbed underwater sequence directly under the hero. Scrolling down plays
the footage forward from the surface to the reef; scrolling up plays it back. Four
text chapters, a depth gauge, and the color of the water follow the same scroll
position.

**Status:** built and tested. **No footage has been supplied yet**, so the live site
shows the illustrated version (an illustrated water column the stage pans down). Add
the files below and rebuild to switch the footage on.

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

One continuous shot, or a few with soft dissolves, 10 to 18 seconds long. Slow,
steady camera movement throughout. No cuts, shake, flashes, or heavy color grading. No
text in the footage: all words on screen are HTML laid over it.

| Scroll | Chapter | On screen | Text over it |
|---|---|---|---|
| 0 to 22% | Surface | Starts just under the waterline in sunlight. Bright aqua. A diver gets ready to descend. This first frame is also the poster. | "Your next adventure starts at the surface." |
| 22 to 48% | First breath | The camera sinks below the surface. The diver breathes out bubbles in clear turquoise water. Calm and slow. | "Take your first breath underwater." |
| 48 to 75% | The reef | A slow glide toward the reef. Natural color, not oversaturated blue. A calm diver and a sense of discovery. | "Enter a world most people never get to see." |
| 75 to 100% | Your adventure | The view opens into a wide, steady underwater scene. Leave calm open water in the lower left, where the text and the Explore dives button sit. | "Ready to go deeper?" |

Requirements for the master:

- 16:9 landscape, at least 1920 × 1080, 25 or 30 fps
- Ends on a stable frame (the last frame holds while the last chapter is read)
- Real Tabs AquaQuest footage wherever possible, with the permission of anyone shown
- Nothing that suggests a sighting is guaranteed. The site adds "Marine life and
  conditions vary from dive to dive." whenever footage plays
- Audio is removed during preparation

Never use stock or AI-generated footage presented as Tabitha, her customers, or her
dive site.

## 2. Files and size budget

All paths are under `public/`. The site checks which exist **at build time**
(`components/immersive/GuidedDescentSection.tsx`), so add them and redeploy.

| File | Required | Budget | Notes |
|---|---|---|---|
| `video/guided-descent.mp4` | Yes | 8 MB max, aim for 4 to 6 MB | H.264, 1920 wide. Primary source. |
| `video/guided-descent.webm` | Yes | 8 MB max | VP9. Fallback source. |
| `images/guided-descent-poster.webp` | Yes | 250 KB max | First frame, 1920 wide. Shown before and instead of the video. |
| `images/guided-descent-mobile.webp` | Yes | 150 KB max | First frame, 4:5 crop, 1080 wide. Phone poster. |
| `video/guided-descent-mobile.mp4` | Optional | 3 MB max | 960 wide. Without it, phones get the still version. |
| `video/frames/` + `manifest.json` | Optional | 6 MB max | Only with `NEXT_PUBLIC_USE_FRAME_SEQUENCE=true`. See section 5. |

While any required file is missing, `npm run dev` shows a yellow "Development only"
note on the section listing what's missing. Production never shows it.

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

**Video was selected.** With 8-frame keyframes, Chrome seeks in about 16 ms on
average, so scrubbing stays smooth without an image sequence. Video also costs far
less transfer and memory: one 4 to 7 MB file versus hundreds of images, each decoded
into memory.

The image-sequence renderer is built and tested but **off**, behind
`NEXT_PUBLIC_USE_FRAME_SEQUENCE=true`. Turn it on only if real-device testing shows
video seeking is visibly unreliable on an important browser (iPhone Safari is the
usual suspect). Before turning it on:

1. Build frames: `npm run video:prepare -- master.mov --frames 90`.
2. Measure: total size of `public/video/frames` (budget 6 MB), and memory in the
   browser's task manager while scrolling the section.
3. Set the flag in Vercel's environment variables and redeploy.

How it behaves: one canvas, resolution capped at 1.5×. The first frame loads at
once, frames nearest the current position load next (4 at a time), and the rest
wait for idle time. It always draws the nearest decoded frame, so fast scrolling
never shows a blank. Phones load at most 60 frames spread evenly across the clip,
desktops at most 180. Leaving the page releases every image.

## 6. How it works

| File | Role |
|---|---|
| `content/site.ts` (`guidedDescent`) | Chapter copy, scroll ranges, asset paths, footage note |
| `components/immersive/GuidedDescentSection.tsx` | Server component. Checks which files exist at build time. |
| `components/immersive/GuidedDescent.tsx` | Client component. Picks the tier, loads GSAP, owns the one progress controller. |
| `components/immersive/StoryChapter.tsx` | One chapter: label, heading, text, and the call to action on the last one |
| `components/immersive/DepthIndicator.tsx` | The gauge, and the progressbar screen readers read |
| `components/immersive/DescentScene.tsx` | The illustrated water column used while there is no poster |
| `hooks/useVideoScrub.ts` | Waits for `loadedmetadata`, routes seeks through the coordinator, detects failed sources |
| `hooks/useFrameSequence.ts` | The optional image-sequence renderer |
| `lib/video/seek-coordinator.ts` | One active seek, one latest queued seek, nothing else |
| `lib/motion/descent.ts` | Pure functions: progress to chapter, opacity, video time, frame |
| `lib/motion/preferences.ts` | Reduced motion, data saver, slow connection, low-end device, layout query |
| `styles/guided-descent.css` | Both layouts and the overlay |

**One progress value.** A single ScrollTrigger tween (scrub 0.4 s) produces progress
from 0 to 1. One `render(progress)` function sets the video time, each chapter's
opacity and offset, the overlay (`--p`), and the gauge. Nothing else listens to
scroll, so nothing can drift out of sync. Scrub smoothing is 0.4 s, the middle of the brief's
0.25 to 0.6 range. It has not been tuned against real footage yet: try 0.3 and 0.5
on a phone and a trackpad once the clip exists (`SCRUB` in `GuidedDescent.tsx`).

**Seeking.** Setting `currentTime` starts an asynchronous seek. The coordinator
allows one seek in flight and remembers only the newest requested time behind it.
Requests in between are dropped. When a seek finishes, it waits for the frame to
reach the screen (`requestVideoFrameCallback`, or one animation frame where that
doesn't exist) before starting the queued one. Timeouts cover events that never
arrive. Fast scrolling can never build a backlog: tests show at most 1 in flight and
1 queued.

**Pinning.** The stage is pinned with CSS `position: sticky`, not GSAP's pin. Sticky
needs no pin-spacer, so starting the effect adds no layout shift, and the stage
behaves the same with or without script. ScrollTrigger only measures progress, from
when the stage sticks under the header until it unsticks.

**Loading.**

1. The server renders all four chapters as plain HTML in the editorial layout.
2. After hydration, in idle time, the client loads GSAP and ScrollTrigger (about
   45 KB gzipped, never in the initial bundle).
3. If the section is still below the screen, it switches to the immersive layout.
   Nothing the visitor can see moves.
4. The video element is only created once the section is within 1.5 screens, and
   fades in over the poster when its first frame is ready.

## 7. Phones, reduced motion, and fallbacks

The client picks a tier once it is running (`chooseTier` in
`lib/motion/preferences.ts`):

| Situation | What the visitor gets |
|---|---|
| Desktop with the video files | **video:** scroll scrubs the footage |
| Phone with the mobile cut | **video**, using `guided-descent-mobile.mp4` |
| Phone without the mobile cut, or no video files at all | **still:** the poster (or illustration) with scroll-driven chapters, overlay, and pan |
| Reduced motion, data saver, a 2G connection, or a very low-memory device | **editorial:** still image, four chapters in normal flow, no video download |
| No JavaScript, GSAP fails to load, or the visitor reaches the section before GSAP | **editorial** |
| Window under 34rem tall (200% zoom, landscape phones) | **editorial**, so text can reflow |
| Both video sources fail to load | **still**, with the poster |

Phones also get a shorter section (280vh instead of 420vh), no film grain, no
bubbles, no blur, chapter cards placed above the Book bar, and `playsInline`, muted
video with no controls. The video never autoplays: a muted play-and-pause once it
loads unlocks frame painting on iPhone Safari, then it only ever seeks.

## 8. Performance findings

Measured on the production build (`npm test`):

- **Initial JavaScript:** GSAP and ScrollTrigger are not in it. They load later as two
  chunks of 27 KB and 17 KB gzipped. The section's own component adds 12.5 KB gzipped
  to the page.
- **Video download:** none until the section is within 1.5 screens, and none at all
  in the editorial tier.
- **Layout shift while it starts:** under 0.01 (tested).
- **Seeks during rapid alternating scrolling:** never more than 1 in flight and 1
  queued (tested).
- **Memory:** heap growth under 2 MB after scrolling through the section 8 times
  (tested).
- **Overlay:** opacity and transform only, so it stays on the graphics compositor.
  No backdrop blur and no permanent `will-change`. Grain and bubbles only from 768px
  up, and bubbles pause offscreen.
- **Not yet measured:** real footage sizes and seek times on a mid-range phone (see
  the QA checklist).

## 9. Accessibility

- The section has a heading for screen readers: "The guided descent: from the surface
  to the reef."
- Each chapter is a list item with a real heading, in reading order, readable without
  script or motion.
- The video, illustration, overlay, and bubbles are hidden from assistive technology.
  All meaning is in the HTML.
- The gauge is one `progressbar` whose value text names the chapter ("Chapter 2 of 4:
  First breath"). It is not a live region, so scrolling makes no announcements. The
  gauge labels and the chapter label show the current chapter visually too.
- Chapter cards sit on near-opaque navy, so white text passes WCAG AA even over a
  pure white frame (worst case 7.98:1 for headings and body, 6.10:1 for the muted
  label; gauge labels 6.69:1).
- Keyboard: focusing a link in a hidden chapter scrolls that chapter into view. Focus
  is never moved.
- Short windows and 200% zoom get the editorial layout, so nothing is cut off.

## 10. Testing

Automated, in `tests/guided-descent.spec.ts` (run with `npm test`). Port 3100 serves
the site as it ships; port 3101 is a build that treats the media as present, with
synthetic test-pattern fixtures from `tests/fixtures/guided-descent` served at the
real paths:

- progress mapping at 0, 25, 50, 75, and 100%, one chapter visible at a time
- the seek coordinator: one active and one queued seek, direction changes, frame
  presentation, timeouts, cleanup
- missing media: illustration, no video requests, no dev warning in production
- metadata loading, scrubbing forward and back, rapid direction changes
- resize and orientation change, back and forward navigation
- MP4 failing (WebM used), WebM failing (MP4 used), both failing (poster)
- reduced motion (no pinning, no video download), no JavaScript, GSAP failing,
  reaching the section before GSAP
- keyboard focus, the call to action, the accessible progress value
- layout shift, slow connection, memory after repeated scrolling
- phone with the mobile cut, phone without it, the frame-sequence renderer
- screenshots of every chapter at 375×812, 768×1024, and 1440×900 in
  `test-results/screenshots/`

### Manual QA checklist (with real footage, before launch)

- [ ] iPhone Safari: footage appears (not a black box), scrubs both ways, no fullscreen,
      no controls, page scrolls past the section normally
- [ ] Android Chrome on a mid-range phone: scrubbing stays smooth; record seek times
      with remote debugging
- [ ] Desktop Safari, Chrome, Firefox, Edge: forward, back, fast flicks, trackpad and wheel
- [ ] Every chapter's text is readable over its part of the footage
- [ ] The last frame leaves room for the text and buttons in the lower left
- [ ] Reduced motion on (macOS and iOS settings): editorial layout, no video request in
      the network panel
- [ ] Throttle to Slow 4G: poster first, chapters and Explore dives work before the video arrives
- [ ] 200% browser zoom: editorial layout, nothing clipped
- [ ] Keyboard only: Tab reaches Explore dives, the chapter comes into view, focus stays put
- [ ] VoiceOver and NVDA: heading, four chapters, progress value read once, video not announced
- [ ] Lighthouse on mobile: no layout shift from the section; record LCP and TBT
- [ ] Record final file sizes and seek times in section 2

## 11. Where this differs from the brief

- **CSS sticky instead of GSAP pin.** Same visual result, with no pin-spacer layout
  shift. ScrollTrigger still drives progress (section 6).
- **MP4 first, WebM second.** Based on the measurements in section 4.
- **The immersive layout switches on after GSAP loads,** not from the first paint, and
  only while the section is below the screen. If the visitor gets there first, they
  get the editorial layout for that visit. This keeps every chapter readable if any
  script fails, with no visible jump.
- **The gauge shows chapter names, not depths in feet,** so nothing reads as a
  measured dive depth.
- **Copy:** "small groups" was removed from chapter 2 (group size is unconfirmed, see
  `docs/content-needed.md`). The em dash in chapter 4 became a comma (house style).
  Chapter 2 also mentions the briefing on shore, which is verified.
- **Phones without a mobile cut get the still version** instead of scrubbing the
  1080p file.

## 12. Open decisions

- **Footage:** who films it, where, and with whose permission (see section 1).
- **Phones:** whether to make the 960 px mobile cut. With it, phones get the footage;
  without it, they get the still version.
- **Frame sequence:** stays off unless real-device testing shows video seeking is not
  good enough.
- **Audio:** none. Add only if Tabitha asks, and never autoplay it.
- **Hero overlap:** chapter 2's heading repeats most of the hero headline ("Take your
  first breath underwater"). Keep it, or reword one of the two.
