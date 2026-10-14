import { Fragment, type CSSProperties } from "react";
import { about, aboutCopy, isAsk, testimonial } from "@/content/site";
import { Emph } from "../emph";
import { AskTabitha, PhotoSlot } from "../ui";

/** Splits the testimonial into its sentences, so it can reveal line by line. Verbatim. */
function quoteLines(quote: string): string[] {
  return quote.match(/[^.!?]+[.!?]+/g)?.map((line) => line.trim()) ?? [quote];
}

export function About() {
  return (
    <section id="about" className="frame section about" aria-labelledby="about-title">
      <div className="rays" aria-hidden="true" data-parallax />
      <div className="container">
        <div className="about__grid">
          <div data-reveal>
            <PhotoSlot id="tabitha-portrait" className="about__portrait" />
          </div>
          <div className="about__text" data-reveal style={{ "--i": 1 } as CSSProperties}>
            <h2 id="about-title" className="h2">
              <Emph text={aboutCopy.title} />
            </h2>
            {about.intro.map((paragraph) => (
              <p key={paragraph} className="about__para">
                {paragraph}
              </p>
            ))}
            {isAsk(about.credentials) ? (
              <AskTabitha topic={about.credentials} />
            ) : (
              <p className="about__para">{about.credentials}</p>
            )}
          </div>
        </div>

        <figure id="testimonial" className="testimonial">
          <blockquote className="testimonial__quote">
            <p>
              {quoteLines(testimonial.quote).map((line, i) => (
                <Fragment key={i}>
                  {i > 0 && " "}
                  <span className="testimonial__line" data-reveal style={{ "--i": i } as CSSProperties}>
                    {line}
                  </span>
                </Fragment>
              ))}
            </p>
          </blockquote>
          <figcaption className="testimonial__by label" data-reveal>
            {testimonial.name}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
