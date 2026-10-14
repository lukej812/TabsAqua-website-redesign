/**
 * Illustrations. All decorative unless they say otherwise.
 * None of these stand in for photos of Tabitha, her customers, or her dive sites.
 */

import type { CSSProperties, ReactNode } from "react";

/** Layered sea under the hero headline, with a diver-down buoy on the swell. */
export function HeroSea() {
  return (
    <svg
      className="hero__scene"
      viewBox="0 0 1440 360"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="sea-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c6d9e9" />
          <stop offset="1" stopColor="#a9c6de" />
        </linearGradient>
        <linearGradient id="sea-mid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9bbedb" />
          <stop offset="1" stopColor="#6f9fc6" />
        </linearGradient>
        <linearGradient id="sea-near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6596c0" />
          <stop offset="1" stopColor="#3b77a6" />
        </linearGradient>
        <linearGradient id="sea-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2f6c9c" />
          <stop offset="1" stopColor="#1f5b8a" />
        </linearGradient>
      </defs>

      <path d="M0 46C240 38 480 52 720 44s480-6 720 2V360H0Z" fill="url(#sea-far)" />
      <path d="M0 112c160-16 320 12 480-4s320-12 480 4 320 12 480-6V360H0Z" fill="url(#sea-mid)" />
      <path d="M0 190c200-24 400 16 600-6s400-20 600 4 180 8 240-8V360H0Z" fill="url(#sea-near)" />
      <path d="M0 268c220-28 440 18 720-10s480-22 720 4V360H0Z" fill="url(#sea-front)" />

      <g fill="none" stroke="#ffffff" strokeLinecap="round">
        <path d="M0 46C240 38 480 52 720 44s480-6 720 2" strokeOpacity="0.7" strokeWidth="1.5" />
        <path d="M0 112c160-16 320 12 480-4s320-12 480 4 320 12 480-6" strokeOpacity="0.55" strokeWidth="1.5" />
        <path d="M0 190c200-24 400 16 600-6s400-20 600 4 180 8 240-8" strokeOpacity="0.5" strokeWidth="2" />
        <path d="M0 268c220-28 440 18 720-10s480-22 720 4" strokeOpacity="0.4" strokeWidth="2" />
        {/* Sun on the water */}
        <path
          d="M300 70h40M520 84h24M860 64h56M1120 88h30M640 140h36M980 150h22M240 156h28"
          strokeOpacity="0.75"
          strokeWidth="2"
        />
      </g>

      {/* Diver-down buoy, floating where the near swell crosses x = 1080 */}
      <g transform="translate(1080 176)">
        <path d="M0 -4v-54" stroke="#173a5c" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="1" y="-57" width="30" height="22" rx="1.5" fill="#d9483b" stroke="#173a5c" strokeWidth="1.5" />
        <path d="M2 -56h6l22.5 16.3v3.7h-6L2 -52.3Z" fill="#ffffff" />
        <ellipse cx="0" cy="0" rx="18" ry="7.5" fill="#ffffff" stroke="#173a5c" strokeWidth="2" />
        <path d="M-14 -3c4 2 9 3 14 3s10-1 14-3" fill="none" stroke="#d9483b" strokeWidth="3" />
      </g>
    </svg>
  );
}

/**
 * The line-art scuba tank. Its bubbles repeat facts from the text beside it,
 * so it is hidden from screen readers.
 */
export function TankArt({ bubbles, label }: { bubbles: readonly string[]; label: string }) {
  const spots = [
    { x: 80, y: 184, r: 23 },
    { x: 142, y: 206, r: 23 },
    { x: 102, y: 254, r: 25 },
    { x: 140, y: 306, r: 29 },
  ];
  return (
    <svg className="tank" viewBox="0 0 220 460" aria-hidden="true" focusable="false">
      <g fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinejoin="round">
        {/* Valve and outlet */}
        <rect x="78" y="10" width="64" height="26" rx="8" />
        <rect x="142" y="16" width="20" height="14" rx="3" />
        <path d="M94 10V4h32v6" />
        <rect x="94" y="36" width="32" height="20" />
        {/* Cylinder */}
        <path d="M110 56C70 56 40 80 40 120v290c0 16 12 28 28 28h84c16 0 28-12 28-28V120c0-40-30-64-70-64Z" />
      </g>
      {bubbles.slice(0, spots.length).map((text, i) => {
        const s = spots[i];
        return (
          <g key={text} className="float" style={{ "--delay": `${i * -0.9}s` } as CSSProperties}>
            <circle cx={s.x} cy={s.y} r={s.r} fill="#ffffff" fillOpacity="0.92" />
            <text
              x={s.x}
              y={s.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#1f5b8a"
              fontSize={text.length > 4 ? 12 : 15}
              fontWeight={600}
              style={{ fontFamily: "var(--font-display-stack)" }}
            >
              {text}
            </text>
          </g>
        );
      })}
      <text
        x="110"
        y="396"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="34"
        style={{ fontFamily: "var(--font-body-stack)" }}
      >
        {label}
      </text>
    </svg>
  );
}

/** A dotted waterline. Wide enough that it never scales, so the dots stay round. */
export function WaveLine({ className = "" }: { className?: string }) {
  let d = "M0 14 Q18.75 4 37.5 14";
  for (let x = 75; x <= 2400; x += 37.5) d += ` T${x} 14`;
  return (
    <svg
      className={`wave ${className}`}
      viewBox="0 0 2400 28"
      preserveAspectRatio="xMinYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.85"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeDasharray="0.1 8"
      />
    </svg>
  );
}

/** A wavy-edged circle, like the reference's "See all products" seal. */
function scallopPath(cx = 60, cy = 60, r = 54, lobes = 16, depth = 3.2) {
  const points: string[] = [];
  for (let i = 0; i <= 360; i += 3) {
    const a = (i * Math.PI) / 180;
    const rr = r + depth * Math.cos(lobes * a);
    points.push(`${(cx + rr * Math.cos(a)).toFixed(2)} ${(cy + rr * Math.sin(a)).toFixed(2)}`);
  }
  return `M${points.join("L")}Z`;
}

export function ScallopLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="scallop" href={href}>
      <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
        <path d={scallopPath()} fill="transparent" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <span>{children}</span>
    </a>
  );
}

/** Text set around a circle with an icon in the middle. The text turns slowly. */
export function RingBadge({ id, text, icon }: { id: string; text: string; icon: ReactNode }) {
  const pathId = `ring-${id}`;
  // Short labels repeat so the letters fill the ring evenly.
  const repeats = Math.max(1, Math.round(28 / (text.length + 3)));
  const ring = Array.from({ length: repeats }, () => `${text} •`).join(" ");
  return (
    <svg className="ring-badge" viewBox="0 0 120 120" role="img" aria-label={text}>
      <defs>
        <path id={pathId} d="M60 60m-46 0a46 46 0 1 1 92 0a46 46 0 1 1-92 0" />
      </defs>
      <g className="ring-badge__spin">
        <text className="ring-badge__text">
          <textPath href={`#${pathId}`} textLength="286" lengthAdjust="spacing">
            {ring}
          </textPath>
        </text>
      </g>
      <circle cx="60" cy="60" r="25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <g transform="translate(47 47)">{icon}</g>
    </svg>
  );
}

/** White line drawing of the bridge, the park shore, and the water, for "Where we meet". */
export function BridgeLineArt() {
  return (
    <svg viewBox="0 0 560 420" aria-hidden="true" focusable="false">
      <g fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Sun */}
        <circle cx="468" cy="52" r="22" />
        {/* Bridge deck and rail */}
        <path d="M-10 108C140 70 420 70 570 108" />
        <path d="M-10 122C140 84 420 84 570 122" />
        <path d="M-10 96C140 58 420 58 570 96" strokeOpacity="0.55" />
        {/* Piers */}
        <path d="M250 88v102M266 88v102M362 88v102M378 88v102M472 96v94M488 96v94" />
        {/* Park shore and a palm */}
        <path d="M0 178c50-12 120-14 190 2 14 3 26 7 34 12" />
        <path d="M70 178c2-22 8-40 20-56" />
        <path d="M90 122c-14-6-28-4-38 6M90 122c-4-14-14-22-28-24M90 122c10-12 24-16 38-12M90 122c12 2 22 10 26 22" />
        {/* Meeting pin */}
        <path d="M150 168s-18-17-18-30a18 18 0 0 1 36 0c0 13-18 30-18 30Z" />
        <circle cx="150" cy="138" r="6" />
        {/* Underwater piers, fainter */}
        <path d="M250 200v150M266 200v150M362 200v150M378 200v150M472 200v150M488 200v150" strokeOpacity="0.35" />
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
      {/* Dotted waterline */}
      <path
        d="M0 196q20-10 40 0t40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeDasharray="0.1 8"
      />
    </svg>
  );
}
