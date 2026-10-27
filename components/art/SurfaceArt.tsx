/**
 * The hero's over-under view, drawn with CSS and SVG: sky and sun above the
 * waterline, sunlit water below. It is what everyone sees first, and what stays
 * for reduced motion, no JavaScript, data saver, and browsers without WebGL.
 * The live water (lib/ocean/shader.ts) draws the same composition, so the
 * hand-off between the two is a soft cross-fade, not a jump.
 *
 * Proportions match the shader at rest: the waterline sits 40% from the top,
 * the horizon 4.5% above it, and the sun 74% across.
 */
export function SurfaceArt() {
  return (
    <div className="surface-art" aria-hidden="true">
      <div className="surface-art__sun" />
      <svg className="surface-art__glitter" viewBox="0 0 400 20" preserveAspectRatio="none" focusable="false">
        <g fill="#fffbe9">
          {[
            [262, 6], [271, 12], [280, 4], [288, 9], [296, 15], [301, 7], [309, 11], [318, 5],
            [326, 13], [333, 8], [276, 16], [314, 16], [292, 3], [340, 10], [250, 11], [356, 6],
          ].map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width="1.4" height="1.6" rx="0.6" />
          ))}
        </g>
      </svg>
      <svg className="surface-art__rays" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
        <defs>
          <linearGradient id="surface-ray" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#bdf0ef" stopOpacity="0.5" />
            <stop offset="1" stopColor="#bdf0ef" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g fill="url(#surface-ray)">
          <path d="M40 0h5l-6 100h-9Z" />
          <path d="M48 0h3L50 100h-6Z" opacity="0.8" />
          <path d="M62 0h4l6 100h-8Z" opacity="0.7" />
          <path d="M72 0h3l12 100h-6Z" opacity="0.6" />
          <path d="M20 0h3L6 100H0Z" opacity="0.45" />
        </g>
      </svg>
      <svg className="surface-art__line" viewBox="0 0 1200 40" preserveAspectRatio="none" focusable="false">
        <path
          d="M0 20C80 12 150 12 230 19S390 27 470 20 630 11 710 18 870 28 950 21 1110 12 1200 18V40H0Z"
          fill="#7fd6db"
          opacity="0.55"
        />
        <path
          d="M0 20C80 12 150 12 230 19S390 27 470 20 630 11 710 18 870 28 950 21 1110 12 1200 18"
          fill="none"
          stroke="#e8fbfd"
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
