/**
 * Placeholder emblem: a diver among sea grass in a circle, one stroke weight,
 * after the reference's round line-art mark. Stands in until Tabitha's logo
 * files arrive (see docs/asset-manifest.md). The diver bobs gently; reduced
 * motion turns that off.
 */
export function Emblem({ className = "emblem" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="32" cy="32" r="30.5" />
      {/* Sea grass */}
      <path d="M13.5 53.5c-.3-4.6 1.4-8.6 4.6-11.6M19.5 57.5c-.4-6 1.8-11 6-14.5M26 60c.2-4.6 2.2-8 5.6-10.2M37.5 60.2c-.4-3.8.9-7 3.8-9M43.5 58c-1-5 .2-9.2 3.8-12.4M50 52.4c-.2-3.6 1.2-6.4 4-8.4" />
      <g className="emblem__bob">
        {/* Tank on the back */}
        <rect x="23.4" y="21.2" width="12.6" height="4.4" rx="2.2" transform="rotate(13 29.7 23.4)" />
        {/* Head and mask */}
        <circle cx="19.6" cy="27" r="3.3" />
        <path d="M16.1 26.1h2.6" />
        {/* Body, arm, and legs */}
        <path d="M22.6 28.4c4.6.4 9.4 1.4 13.6 2.8" />
        <path d="M24.4 29.2 19 32.6l-4 .2" />
        <path d="M36.2 31.2 42 29.6l5 1.8M36 32.2l5.2 3.2 4.4 2.8" />
        {/* Fins */}
        <path d="m47 31.4 6.4-2.8-.6 4.4ZM45.6 38.2l6.4.2-2.6 3.6Z" />
        {/* Bubbles */}
        <circle cx="16.6" cy="19.6" r="1.2" />
        <circle cx="14.6" cy="15.6" r="0.9" />
        <circle cx="16.4" cy="12.2" r="0.6" />
      </g>
    </svg>
  );
}
