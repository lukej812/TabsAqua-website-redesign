type Props = {
  className?: string;
  /** A scuba diver with a tank, or a snorkeler floating at the surface. */
  variant?: "diver" | "snorkeler";
};

const NEAR = "var(--figure, #062039)";
const FAR = "var(--figure-far, #0a2b47)";

/**
 * A diver in silhouette, swimming to the right. Drawn from simple shapes so it
 * reads at any size and can never be mistaken for a photo of a real person.
 * Decorative: the text around it carries the meaning.
 */
export function Diver({ className, variant = "diver" }: Props) {
  const scuba = variant === "diver";
  return (
    <svg
      className={className}
      viewBox="0 0 560 220"
      aria-hidden="true"
      focusable="false"
      overflow="visible"
    >
      <g transform={scuba ? "rotate(10 330 110)" : "rotate(-2 330 110)"} strokeLinecap="round" strokeLinejoin="round">
        {/* The far leg and fin sit behind, a shade lighter. */}
        <g fill={FAR} stroke={FAR}>
          <path d="M144 124 L 48 117 Q 36 118 38 130 L 49 152 Q 56 157 63 152 L 140 141 Z" strokeWidth="2" />
          <path d="M258 118 L 202 134 L 144 132" fill="none" strokeWidth="19" />
        </g>
        <g fill={NEAR} stroke={NEAR}>
          <path d="M146 101 L 36 66 Q 24 66 25 79 L 37 104 Q 43 110 52 107 L 140 119 Z" strokeWidth="2" />
          <path d="M262 108 L 198 116 L 146 110" fill="none" strokeWidth="21" />
          <ellipse cx="270" cy="113" rx="28" ry="21" />
          <ellipse cx="338" cy="113" rx="70" ry="25" />
          <ellipse cx="356" cy="118" rx="50" ry="23" />
          {scuba && (
            <>
              <rect x="268" y="74" width="122" height="30" rx="15" />
              <rect x="386" y="79" width="16" height="11" rx="3" />
              <path d="M400 85 C 428 78, 446 96, 444 124" fill="none" strokeWidth="4" />
              <circle cx="444" cy="126" r="6" />
            </>
          )}
          <ellipse cx="405" cy="110" rx="17" ry="16" />
          <circle cx="430" cy="112" r="19" />
          <rect x="438" y="103" width="18" height="18" rx="6" />
          {!scuba && <path d="M424 96 L 420 40 Q 419 30 428 29" fill="none" strokeWidth="6" />}
          <path d="M392 122 L 418 146 L 452 150" fill="none" strokeWidth="13" />
        </g>
        {/* A glint of light on the mask glass. */}
        <rect x="447" y="106" width="6" height="11" rx="2.5" fill="#9fe0e8" opacity="0.55" />
      </g>
    </svg>
  );
}
