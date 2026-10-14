import { about, aboutCopy, isAsk, testimonial } from "@/content/site";
import { DiveFlag } from "../icons";
import { RingBadge } from "../illustrations";
import { AskTabitha, PhotoSlot } from "../ui";

export function MeetTabitha() {
  return (
    <section id="tabitha" className="stack" aria-labelledby="tabitha-title">
      <div className="split">
        <div
          className="panel panel--ice panel__inner exp exp--split about__text"
          data-tone="light"
          data-anim
        >
          <RingBadge id="tabitha" text={aboutCopy.badge} icon={<DiveFlag size={26} />} />
          <h2 id="tabitha-title" className="display">
            {aboutCopy.title}
          </h2>
          {about.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {isAsk(about.credentials) ? (
            <AskTabitha topic={about.credentials} />
          ) : (
            <p>{about.credentials}</p>
          )}
        </div>
        <PhotoSlot id="tabitha-portrait" panel />
      </div>

      <figure className="panel panel--white panel__inner quote" data-tone="light">
        <blockquote>
          <p>{testimonial.quote}</p>
        </blockquote>
        <figcaption className="caps">{testimonial.name}</figcaption>
      </figure>
    </section>
  );
}
