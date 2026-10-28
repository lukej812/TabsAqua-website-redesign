# Design system

How the site looks and moves, and why. The tokens live on `:root` in
`app/globals.css`; the 3D world's light and color live in `lib/world/look.ts`. Change
them there, then run `npm test`: the contrast checks measure rendered pixels.

## The idea

The page is one dive. You start at the surface, sink through the water while learning
how a first dive goes, travel along the reef where the experiences are, go deeper for
certification, make a safety stop with Tabitha, ascend with your group, and surface at
the shore to book.

Two layers make that work:

- **The world**: a real-time 3D underwater scene behind the page. One camera travels
  through it as you scroll. It is atmosphere and place, never information.
- **The dive log**: the content, in plain HTML, in one editorial column on the left.
  Everything a visitor needs (prices, steps, booking, contact) is here, readable with
  the world switched off.

On wide screens the camera measures where the column ends and turns so the world's
subject (the diver, the snorkelers, the descent line) sits right of it, a little
under halfway into the open water. On portrait screens the text spans the width and
the subject sits just right of center, behind the text, under a deeper veil.

## Color

A disciplined ocean palette: blues that darken with depth and lighten on the ascent,
one accent on dark water, sand-white on shore.

| Token | Value | Use |
|---|---|---|
| `--surface-water` | `#5fc3ce` | Sunlit shallows in the static art |
| `--lagoon` | `#176a93` | Mid water |
| `--deep` | `#0a3656` | Bottom of the descent, top of the reef; the 2D water's hand-off color |
| `--reef-bg` | `#072a46` | The reef's own water (when the world is off) |
| `--abyss` | `#051d33` | Courses, the deepest water |
| `--ink` | `#041b2d` | Header once scrolled, footer, page background; the veil over the world |
| `--ascent`, `--ascent-top` | `#135880`, `#17628a` | The way back up |
| `--shore` | `#f4f1ea` | Where we meet, FAQ |
| `--sky`, `--foam` | `#dcedf4`, `#eef7f8` | Booking, light washes |
| `--navy` | `#173a5c` | Text on light |
| `--muted` | `#47627c` | Secondary text on light |
| `--on-dark-muted` | `#c9dde9` | Secondary text on dark |
| `--ocean`, `--ocean-deep` | `#1f5b8a`, `#17476d` | Primary buttons on light, hover |
| `--aqua` | `#a6e6e3` | The one accent, on dark water only: kickers, focus rings, italic accents |
| `--flag-red` | `#d9483b` | Only the diver-down flag, the buoy, and the meeting pin |

Not in the palette: purple, glowing gradients, neon. The world's coral and sponges use
muted, sun-filtered tints (`lib/world/reef.ts`), never saturated reds or pinks.

### Tone

Every section sets `data-tone="light"` or `data-tone="dark"`. Tone sets text, rules,
focus rings, and button colors (`--fg`, `--fg-muted`, `--accent`, `--rule`,
`--focus`, `--btn-*`). Components never pick a text color directly.

## Typography

- **Newsreader** (`--font-display-stack`) for headlines, prices, the testimonial, and
  occasions. Weight 400, tight tracking (-0.02em to -0.03em), italic for accents.
- **Instrument Sans** (`--font-body-stack`) for everything else. Body 1.0625rem at
  1.6 line height.
- Loaded through `next/font`, self-hosted, no layout shift.

| Role | Size |
|---|---|
| Hero headline | `clamp(2.25rem, min(5.6vw, 8.6vh), 5.25rem)` |
| Section headline (`.display`) | `clamp(2.5rem, 5.4vw, 4.75rem)` |
| Entry headline (experiences, steps) | about `clamp(2.25rem, 4vw, 3.5rem)` |
| Price | `clamp(2rem, 3vw, 2.5rem)` |
| Testimonial | `clamp(1.75rem, 3.3vw, 2.75rem)` |
| Lede | `clamp(1.0625rem, 1.4vw, 1.1875rem)` |
| Body | `1.0625rem` |
| Small, labels | `0.875rem` to `0.9375rem`, 600 weight |

Sentence case everywhere. Section labels (`.kicker`) are a short rule and a
sentence-case name of the zone: Surface, Your first dive, The reef, Deeper, Safety
stop, Ascent, Back on shore, Back at the surface. No all-caps labels. Headlines are
one color, except "Three ways *into the water*".

## Space and layout

- `--gutter`: `clamp(1.25rem, 5vw, 4rem)` side padding; 16px minimum on phones.
- `.wrap`: up to 78rem wide, centered.
- The column: content blocks stop at 44rem (`.zone__head`, `.exp-list`, `.about`,
  `.groups__text`, `.quote`); slates (the planner) at 34rem.
- Section padding: `clamp(5rem, 13vh, 9rem)` top and bottom, so each section has room
  for the camera to arrive.
- `--header-h`: 4.25rem. The header is clear over the sky and solid ink once scrolled.

Avoid generic three-card rows. Experiences are editorial entries in the column (pitch,
price, Book, then steps and specs), courses hang from a descent line, essentials are a
ruled list.

## Buttons and links

- **Primary** (`.btn--primary`): a 48px pill. White with ink text on dark water, ocean
  blue with white text on light. Hover lifts 1px with a soft shadow in the tone's
  color.
- **Ghost** (`.btn--ghost`): transparent with a 1.5px inset rule; fills with a faint
  wash on hover.
- **Small** (`.btn--small`): 44px, for dense rows.
- **Text links** (`.text-link`): 600 weight, underlined in the accent, 44px tall hit
  area.
- **Book buttons** always open Tabitha's Wix booking page and say so ("See dates and
  book", with an external-link icon).
- Focus: a 3px ring in `--focus` (aqua on dark, ocean on light), 3px offset. Never
  removed.

## Forms

The group planner and the booking chooser are the only forms.

- Labels above fields, always visible. Optional fields say "(optional)".
- Fields: 48px tall, 1.5px border (`#9fb3c5`, ocean blue on focus), 0.75rem radius,
  focus ring as above.
- Checkboxes and radios are real inputs inside 44px-tall labels.
- Errors show next to the field in `--error`, and the form's status line (a
  `role="status"` region) announces what happened.
- The planner drafts an email in the visitor's own mail app and says so. It never
  claims to send, and never shows a "sent" or "booked" state.
- The chooser is radio buttons and CSS, so it works without script.

## Motion

Scroll is native. Nothing pins the page, smooths the scroll, or traps it.

- **The camera** follows scroll with a 0.14s lag (`follow` in `lib/motion/descent.ts`),
  like a weighted camera on a slider. Between shots it moves on a smooth curve.
- **The world** moves on its own, slowly: surge in the sea rods and seagrass, fish
  circling, the diver's kick, rising bubbles, caustics on the sand, drifting light
  shafts. Nothing bounces, spins, or loops fast.
- **Reveals**: content that starts below the screen fades up 1.75rem over about a
  second, once. Printing shows everything.
- **Off screen**: drawing stops when the dive leaves the viewport or the tab hides.
- **Reduced motion**: no world animation (one still frame), no reveals, no floating or
  flowing CSS, the descent reads as a compact list. All content stays.

## The world's look

One light model for everything (`lib/world/glsl.ts`), so nothing looks pasted in:

- The sun enters from the upper right, about 47 degrees from vertical under water.
- Sunlight loses red first, then green, with depth (`absorb`).
- Caustics are projected along the light onto every surface, fading with depth.
- Distance fog (`extinction`) pulls everything toward the water's own color, which is
  pale cyan looking up, blue at eye level, and navy looking down.
- Rim light from the surrounding water keeps silhouettes readable.
- Surfaces: the sand has ripples and seagrass beds; the reef is rock mounds with sea
  rods, sea fans, brain and star coral heads, barrel and tube sponges, generic and
  Florida-appropriate. Fish are generic silvery schools.
- Above the waterline (hero and surfacing): a sky, a sun glow, and a sea in
  perspective, with a bright meniscus at the line.

Quality presets (`QUALITY` in `lib/world/look.ts`): high, medium, low change the
drawing resolution and how much grass, fish, particles, and small reef growth there
are. A frame-time governor lowers resolution if frames run long and hands over to the
2D water if even the lowest setting is too slow.

## Text over the world

Never trust the picture to be dark enough. Three layers keep text at WCAG AA:

1. A veil of deep water (`--ink`) behind the text column: 30% always, plus up to 55%
   more per shot (`scrim` in `lib/world/path.ts`), more where the camera looks up at
   the bright surface. It holds to just past the column's measured right edge, then
   fades over about 22rem, before the subject, so it reads as shade. On screens
   under 900px wide it covers the frame.
2. Soft pools for text outside the column: the hero facts sit on their own radial
   pool that fades to nothing at its edges.
3. A shade under the header and above the bottom edge.

`tests/world.spec.ts` hides the words, screenshots the world, and measures every
text's contrast against the brightest pixels behind it, at ten points of the journey
on desktop and phone.

## Images and video

- **Real photos only** for people and places: Tabitha, her customers, her dive sites.
  Never generated or stock images presented as hers. See `docs/asset-manifest.md`.
- Photos sit flat in the column with a 4px radius (`--radius-photo`), no shadow, no
  tilt, no floating cards.
- **The world is illustration.** It shows a generic Florida reef, not Blue Heron
  Bridge, and promises no particular sighting. Its diver and snorkelers are
  silhouettes, never stand-ins for Tabitha or her customers.
- **Footage**, when it exists, replaces the world for the surface and descent (see
  `docs/video-production.md`). It must be Tabitha's own or clearly licensed, and
  generated footage must never be presented as her trips.
- No "photo coming soon" boxes in production.

## Accessibility

- One h1, a skip link, landmarks, visible focus, 44px targets.
- Every section is readable without JavaScript and without WebGL.
- Decorative layers (the stage, the art, the canvas) are `aria-hidden`.
- No sound, ever.
