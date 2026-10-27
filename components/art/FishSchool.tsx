import { r1, seeded } from "@/lib/art/random";

/** A generic reef fish, nose at the origin, facing left. About 40 units long. */
const FISH = "M0 0C8-7 22-8 32-2L40-7 38 0 40 7 32 2C22 8 8 7 0 0Z";

type Props = {
  seed: number;
  count: number;
  className?: string;
  /** Overall size multiplier. */
  scale?: number;
};

/**
 * A loose school of small fish swimming left, in silhouette. Each fish bobs a
 * little on its own; the school drifts as a whole (see .school in globals.css).
 * Positions are seeded, so the school is the same on every build.
 */
export function FishSchool({ seed, count, className = "", scale = 1 }: Props) {
  const rnd = seeded(seed);
  const fish = Array.from({ length: count }, (_, i) => {
    // An ellipse-shaped school, denser in the middle.
    const angle = rnd.range(0, Math.PI * 2);
    const radius = Math.sqrt(rnd.next());
    return {
      x: r1(220 + Math.cos(angle) * radius * 200),
      y: r1(80 + Math.sin(angle) * radius * 60),
      size: rnd.range(0.55, 1.05) * scale,
      delay: -r1(rnd.range(0, 40)) / 10,
      i,
    };
  }).sort((a, b) => a.size - b.size);

  return (
    <svg className={`school ${className}`} viewBox="0 0 440 160" aria-hidden="true" focusable="false">
      {fish.map((f) => (
        <g key={f.i} transform={`translate(${f.x} ${f.y}) scale(${f.size.toFixed(2)})`}>
          <path className="school__fish" d={FISH} style={{ animationDelay: `${f.delay}s` }} />
        </g>
      ))}
    </svg>
  );
}
