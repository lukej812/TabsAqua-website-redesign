/**
 * Blue Heron Bridge from the park shore, in line art: the bridge deck and piers,
 * a palm, the meeting pin, and the water below with seagrass. Drawn in
 * currentColor, so it takes the color of the text around it.
 */
export function BridgeArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 560 420" aria-hidden="true" focusable="false">
      {/* Water below the line, a pale wash. */}
      <path d="M0 196q20-10 40 0t40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0V420H0Z" fill="currentColor" opacity="0.07" />
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Sun */}
        <circle cx="468" cy="52" r="22" />
        <path d="M468 14v-8M506 52h8M495 25l6-6M430 52h-8M441 25l-6-6" strokeOpacity="0.6" />
        {/* Bridge deck and rail */}
        <path d="M-10 108C140 70 420 70 570 108" />
        <path d="M-10 122C140 84 420 84 570 122" />
        <path d="M-10 96C140 58 420 58 570 96" strokeOpacity="0.5" />
        {/* Piers */}
        <path d="M250 88v102M266 88v102M362 88v102M378 88v102M472 96v94M488 96v94" />
        {/* Park shore and a palm */}
        <path d="M0 178c50-12 120-14 190 2 14 3 26 7 34 12" />
        <path d="M70 178c2-22 8-40 20-56" />
        <path d="M90 122c-14-6-28-4-38 6M90 122c-4-14-14-22-28-24M90 122c10-12 24-16 38-12M90 122c12 2 22 10 26 22" />
        {/* Underwater piers, fainter */}
        <path d="M250 200v150M266 200v150M362 200v150M378 200v150M472 200v150M488 200v150" strokeOpacity="0.3" />
        {/* Fish */}
        <path d="M300 262c8-8 18-10 28-6-10 6-18 8-28 6Zm28-6 8-5v10Z" />
        <path d="M318 288c7-7 15-9 23-5-8 5-15 7-23 5Zm23-5 7-4v8Z" />
        <path d="M414 276c6-6 13-8 20-4-7 4-13 6-20 4Zm20-4 6-4v8Z" />
        {/* Seagrass and the sandy bottom */}
        <path d="M96 392c-4-20 2-38 10-50M106 392c2-16 10-28 18-34M84 394c-6-12-6-26-2-38" />
        <path d="M418 386c-4-18 0-34 8-46M430 386c4-14 12-24 20-28" />
        <path d="M0 396c80-14 170-18 280-6s200 12 280-4" />
        {/* Bubbles */}
        <circle cx="200" cy="300" r="5" />
        <circle cx="208" cy="276" r="3.5" />
        <circle cx="203" cy="256" r="2.5" />
      </g>
      {/* The meeting pin, in the flag's red. */}
      <path d="M150 168s-18-17-18-30a18 18 0 0 1 36 0c0 13-18 30-18 30Z" fill="#d9483b" />
      <circle cx="150" cy="138" r="6" fill="#ffffff" />
      {/* Dotted waterline */}
      <path
        d="M0 196q20-10 40 0t40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeDasharray="0.1 8"
      />
    </svg>
  );
}

/**
 * The surface seen on the way up: the boundary between the blue sections and
 * the shore. A wave edge in the shore color, with a bright line along its crest.
 */
export function SurfaceEdge() {
  return (
    <svg className="surface-edge" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path
        d="M0 64C120 44 240 44 360 60S600 84 720 66 960 40 1080 56 1320 82 1440 62V120H0Z"
        fill="var(--shore)"
      />
      <path
        className="surface-edge__crest"
        d="M0 64C120 44 240 44 360 60S600 84 720 66 960 40 1080 56 1320 82 1440 62"
        fill="none"
        stroke="#e8fbfd"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
