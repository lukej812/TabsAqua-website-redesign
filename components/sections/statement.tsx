import { statement } from "@/content/site";
import { plain } from "../emph";

/** The statement's words, each marked italic or not, from the *asterisk* convention. */
function words(text: string) {
  return text.split("*").flatMap((part, i) =>
    part
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => ({ word, em: i % 2 === 1 })),
  );
}

/**
 * One full-width line that lights up word by word as you scroll through it
 * (components/motion/scroll-scenes.tsx). Without that script, or under
 * reduced motion, every word stays fully lit.
 */
export function Statement() {
  return (
    <section className="statement" aria-label="A note from the water" data-statement>
      <p className="statement__text">
        <span className="sr-only">{plain(statement)}</span>
        <span aria-hidden="true">
          {words(statement).map(({ word, em }, i) => (
            <span key={i} className="statement__word" data-word>
              {em ? <em>{word}</em> : word}{" "}
            </span>
          ))}
        </span>
      </p>
    </section>
  );
}
