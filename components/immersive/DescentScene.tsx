/**
 * Illustrated stand-in for the poster while no footage exists. A tall water
 * column, from sunlit surface to reef, in the site's line-art style. On wide
 * screens the stage pans down it as you scroll. It shows no people and no real
 * place, so it can't be mistaken for Tabitha's customers or dive site.
 */
export function DescentScene() {
  return (
    <svg
      className="gd-scene"
      viewBox="0 0 1440 2400"
      preserveAspectRatio="xMidYMin slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="gd-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dfeaf4" />
          <stop offset="0.12" stopColor="#9bc8de" />
          <stop offset="0.35" stopColor="#3f8fb5" />
          <stop offset="0.65" stopColor="#1f5b8a" />
          <stop offset="1" stopColor="#0c2e4c" />
        </linearGradient>
        <linearGradient id="gd-ray" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="1440" height="2400" fill="url(#gd-water)" />
      {/* Surface */}
      <path d="M0 230c180-30 360 18 540-6s360-28 540 0 260 22 360-4V0H0Z" fill="#f3f7fb" />
      <path d="M0 230c180-30 360 18 540-6s360-28 540 0 260 22 360-4" fill="none" stroke="#ffffff" strokeWidth="3" />
      {/* Light rays from the surface */}
      <g fill="url(#gd-ray)">
        <path d="M220 236l140 0-260 1100-120 0Z" />
        <path d="M640 230l90 0-120 1000-90 0Z" opacity="0.8" />
        <path d="M1000 228l160 0 40 1200-150 0Z" opacity="0.7" />
      </g>
      {/* Rising bubbles, drawn as outlines */}
      <g fill="none" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="2.5">
        <circle cx="300" cy="700" r="10" />
        <circle cx="318" cy="640" r="6" />
        <circle cx="306" cy="590" r="4" />
        <circle cx="1080" cy="1150" r="9" />
        <circle cx="1096" cy="1090" r="5" />
        <circle cx="1086" cy="1046" r="3.5" />
        <circle cx="700" cy="1500" r="8" />
        <circle cx="714" cy="1450" r="5" />
      </g>
      {/* Fish, a few, in line art */}
      <g fill="none" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="2.5" strokeLinejoin="round">
        <path d="M860 1320c16-16 36-20 56-12-20 12-36 16-56 12Zm56-12 16-10v20Z" />
        <path d="M900 1370c13-13 29-16 45-10-16 10-29 13-45 10Zm45-10 13-8v16Z" />
        <path d="M480 1700c14-14 31-18 49-11-17 11-31 14-49 11Zm49-11 14-9v18Z" />
      </g>
      {/* Reef and seafloor */}
      <path
        d="M0 2160c80-40 150-50 220-20 40-60 110-80 170-40 50-50 130-50 180 10 60-30 130-26 180 20 50-40 120-50 190-10 40-50 120-60 180-10 60-30 140-30 200 20 50-20 80-24 120-10V2400H0Z"
        fill="#0a2843"
      />
      <g fill="none" stroke="#7fb3d5" strokeOpacity="0.55" strokeWidth="4" strokeLinecap="round">
        <path d="M260 2170v-90m0 34-36-50m36 26 40-56m-40 92-58-20m58-4 52-30" />
        <path d="M1160 2160v-100m0 40 42-60m-42 36-46-54m46 88 62-24m-62-10-56-26" />
        <path d="M720 2180v-64m0 24-28-38m28 18 30-42" />
      </g>
      <path d="M0 2330c200-30 460-40 720-12s520 30 720-6V2400H0Z" fill="#06192b" />
    </svg>
  );
}
