import type { Ref } from "react";
import type { DescentChapter } from "@/content/site";

type Props = {
  chapters: readonly DescentChapter[];
  ref?: Ref<HTMLDivElement>;
};

/**
 * A thin gauge on the edge of the stage. It shows chapter names, not real dive
 * depths. Screen readers get one progressbar whose value text names the
 * current chapter; it is never a live region, so scrolling makes no announcements.
 * The parent updates the needle (--p) and the aria values directly, without re-rendering.
 */
export function DepthIndicator({ chapters, ref }: Props) {
  return (
    <div
      ref={ref}
      className="gd-depth"
      role="progressbar"
      aria-label="Guided descent progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
      aria-valuetext={`Chapter 1 of ${chapters.length}: ${chapters[0].label}`}
    >
      <div className="gd-depth__track" aria-hidden="true">
        <span className="gd-depth__fill" />
        <span className="gd-depth__needle" />
      </div>
      <ol className="gd-depth__labels" aria-hidden="true">
        {chapters.map((chapter, i) => (
          <li
            key={chapter.id}
            data-active={i === 0 ? "" : undefined}
            style={{ top: `${chapter.range[0] * 100}%` }}
          >
            {chapter.label}
          </li>
        ))}
      </ol>
    </div>
  );
}
