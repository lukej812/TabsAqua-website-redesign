import type { CSSProperties } from "react";
import { facts } from "@/content/site";
import { Emph } from "../emph";

/**
 * Verified numbers that count up the first time they come into view
 * (components/page-script.tsx). The final values are in this HTML and in
 * screen-reader-only text, and they stay still under reduced motion.
 */
export function Facts() {
  return (
    <section id="first-dive" className="frame section facts" aria-labelledby="facts-title">
      <div className="rays" aria-hidden="true" data-parallax />
      <div className="container">
        <div className="section-head" data-reveal>
          <h2 id="facts-title" className="h2">
            <Emph text={facts.title} />
          </h2>
          <p className="lead">{facts.intro}</p>
        </div>
        <ul className="facts__list">
          {facts.items.map((item, i) => {
            const spoken = item.figures
              ? item.figures.map((f) => `${f.value}${f.suffix ?? ""}`).join(" and ")
              : item.word;
            return (
              <li key={item.id} className="fact" data-reveal style={{ "--i": i } as CSSProperties}>
                <p className="fact__figure">
                  {item.lead && <span className="fact__lead label">{item.lead} </span>}
                  <span className="sr-only">
                    {spoken} {item.unit}
                  </span>
                  <span className={`fact__value${item.figures ? "" : " fact__value--word"}`} aria-hidden="true">
                    {item.figures
                      ? item.figures.map((figure, f) => (
                          <span key={f} className="fact__number">
                            {f > 0 && <span className="fact__sep">/</span>}
                            <span data-count={figure.value}>{figure.value}</span>
                            {figure.suffix}
                          </span>
                        ))
                      : item.word}
                    {item.unit && <em className="fact__unit"> {item.unit}</em>}
                  </span>
                </p>
                <p className="fact__caption">{item.caption}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
