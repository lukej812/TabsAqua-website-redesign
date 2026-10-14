import { Fragment, type CSSProperties } from "react";

/**
 * Renders copy where *asterisks* mark the italic words, the convention used
 * for headlines in content/site.ts.
 */
export function Emph({ text }: { text: string }) {
  return (
    <>
      {text.split("*").map((part, i) =>
        i % 2 === 1 ? <em key={i}>{part}</em> : <Fragment key={i}>{part}</Fragment>,
      )}
    </>
  );
}

/** The same copy without the markers, for alt text, titles, and screen readers. */
export function plain(text: string): string {
  return text.replaceAll("*", "");
}

/**
 * A headline whose letters rise on first paint (CSS only, so it plays before
 * hydration). Screen readers get the whole line once; the letters are hidden.
 */
export function RiseText({ text }: { text: string }) {
  let index = 0;
  const segments = text.split("*").map((part, i) => ({ part, em: i % 2 === 1 }));
  const words = segments.flatMap(({ part, em }) =>
    part
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => ({ word, em })),
  );

  return (
    <>
      <span className="sr-only">{plain(text)}</span>
      <span aria-hidden="true">
        {words.map(({ word, em }, w) => {
          const letters = Array.from(word).map((letter) => (
            <span key={index} className="rise-letter" style={{ "--i": index++ } as CSSProperties}>
              {letter}
            </span>
          ));
          const inner = <span className="rise-word">{letters}</span>;
          return (
            <Fragment key={w}>
              {em ? <em>{inner}</em> : inner}
              {w < words.length - 1 ? " " : null}
            </Fragment>
          );
        })}
      </span>
    </>
  );
}
