import { reefLayer, seaFanAccent, seagrassAccent, type ReefOptions, type StrokeGroup } from "@/lib/art/reef";

const WIDTH = 1600;
const HEIGHT = 420;

type Layer = Omit<ReefOptions, "width" | "height"> & {
  /** CSS color, usually a custom property. */
  color: string;
  /** Parallax depth: 0 is far, 2 is near. */
  depth: 0 | 1 | 2;
};

function Strokes({ groups, color }: { groups: StrokeGroup[]; color: string }) {
  return (
    <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
      {groups.map((g) => (
        <path key={g.width} strokeWidth={g.width} d={g.d} />
      ))}
    </g>
  );
}

/**
 * The reef, as layered silhouettes along the bottom of a section. Far layers
 * are paler (water haze) and move less as you scroll, so the reef has depth.
 * Generated at build time; the page ships plain SVG.
 */
export function Reef({ layers, className = "", accents = true }: { layers: Layer[]; className?: string; accents?: boolean }) {
  const fan = accents ? seaFanAccent(3, 150, HEIGHT + 4, 300, 0.3) : null;
  const grass = accents ? seagrassAccent(9, 1460, HEIGHT + 6, 210) : null;
  return (
    <div className={`reef ${className}`} aria-hidden="true">
      {layers.map((layer) => {
        const shape = reefLayer({ ...layer, width: WIDTH, height: HEIGHT });
        return (
          <svg
            key={layer.seed}
            className="reef__layer"
            data-depth={layer.depth}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            preserveAspectRatio="xMidYMax slice"
            focusable="false"
          >
            <Strokes groups={shape.strokes} color={layer.color} />
            <path fill={layer.color} opacity={0.55} d={shape.mesh} />
            <path fill={layer.color} d={shape.fill} />
          </svg>
        );
      })}
      {fan && grass && (
        <svg
          className="reef__layer reef__accents"
          data-depth="3"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="xMidYMax slice"
          focusable="false"
        >
          <path fill="var(--reef-near)" opacity={0.6} d={fan.mesh} />
          <Strokes groups={fan.strokes} color="var(--reef-near)" />
          <Strokes groups={grass} color="var(--reef-near)" />
        </svg>
      )}
    </div>
  );
}
