import { REEF_FILES, type ReefFile } from "@/lib/art/reef-svg";

/** Parallax depth for each file: 0 is far, 3 is the foreground accents. */
const DEPTH: Record<ReefFile, number> = { far: 0, mid: 1, near: 2, accents: 3 };

/**
 * The reef, as layered silhouettes along the bottom of a section. Far layers
 * are paler (water haze) and drift less as you scroll, so the reef has depth.
 *
 * Each layer is a small SVG generated when the site is built (app/art/), loaded
 * lazily as an image: the reef is below the first screen, so it never delays it.
 */
export function Reef({ className = "" }: { className?: string }) {
  return (
    <div className={`reef ${className}`} aria-hidden="true">
      {REEF_FILES.map((file) => (
        // Decorative, generated art: next/image would add nothing for an SVG.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={file}
          className="reef__layer"
          data-depth={DEPTH[file]}
          src={`/art/reef-${file}.svg`}
          alt=""
          loading="lazy"
          decoding="async"
        />
      ))}
    </div>
  );
}
