import type { Ref } from "react";
import type { DescentChapter } from "@/content/site";

type Props = {
  chapter: DescentChapter;
  index: number;
  total: number;
  /** Set on the last chapter: the booking call to action. */
  cta?: { label: string; href: string };
  secondary?: { label: string; href: string };
  ref?: Ref<HTMLLIElement>;
};

/**
 * One chapter of the guided descent. Plain, readable HTML in document order.
 * In the immersive layout the parent sets its opacity and offset from scroll
 * progress; nothing here depends on that to be read.
 */
export function StoryChapter({ chapter, index, total, cta, secondary, ref }: Props) {
  const titleId = `gd-${chapter.id}-title`;
  return (
    <li
      ref={ref}
      className="gd-chapter"
      data-chapter={index}
      data-active={index === 0 ? "" : undefined}
      aria-labelledby={titleId}
    >
      <div className="gd-chapter__card">
        <p className="gd-chapter__label">
          <span className="sr-only">
            Chapter {index + 1} of {total}:{" "}
          </span>
          {chapter.label}
        </p>
        <h3 id={titleId} className="gd-chapter__title">
          {chapter.title}
        </h3>
        <p className="gd-chapter__text">{chapter.text}</p>
        {cta && (
          <div className="gd-chapter__actions">
            <a className="btn btn--primary" href={cta.href}>
              {cta.label}
            </a>
            {secondary && (
              <a className="text-link" href={secondary.href}>
                {secondary.label}
              </a>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
