import type { ReactNode } from "react";
import { about, aboutCopy, essentials, isAsk, testimonial } from "@/content/site";
import { CardIcon, ChatIcon, MaskIcon, PeopleIcon, WavesIcon, WeatherIcon } from "../icons";
import { AskTabitha, PhotoFrame } from "../ui";

const ESSENTIAL_ICON: Record<(typeof essentials)[number]["icon"], ReactNode> = {
  briefing: <ChatIcon size={22} />,
  shallow: <WavesIcon size={22} />,
  gear: <MaskIcon size={22} />,
  age: <PeopleIcon size={22} />,
  cert: <CardIcon size={22} />,
  weather: <WeatherIcon size={22} />,
};

/**
 * The safety stop, on the way back up: who Tabitha is, the practical facts a
 * nervous beginner wants first, and the one real review, in her customer's words.
 */
export function MeetTabitha() {
  return (
    <section id="tabitha" className="zone zone--safety" data-tone="dark" data-zone aria-labelledby="tabitha-title">
      <div className="zone__rays zone__rays--return" aria-hidden="true" />
      <div className="wrap zone__inner">
        <div className="about">
          <div className="about__text">
            <p className="kicker">{aboutCopy.kicker}</p>
            <h2 id="tabitha-title" className="display" data-reveal>
              {aboutCopy.title}
            </h2>
            <PhotoFrame id="tabitha-portrait" className="about__photo" />
            {about.intro.map((paragraph) => (
              <p className="about__para" key={paragraph}>
                {paragraph}
              </p>
            ))}
            {isAsk(about.credentials) ? (
              <AskTabitha topic={about.credentials} />
            ) : (
              <p className="about__para">{about.credentials}</p>
            )}
          </div>
          <div className="essentials" data-reveal>
            <h3 className="essentials__title">{aboutCopy.essentialsTitle}</h3>
            <ul className="essentials__list">
              {essentials.map((item) => (
                <li key={item.icon}>
                  <span className="essentials__icon">{ESSENTIAL_ICON[item.icon]}</span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <figure className="quote" data-reveal>
          <blockquote>
            <p>{testimonial.quote}</p>
          </blockquote>
          <figcaption>{testimonial.name}</figcaption>
        </figure>
      </div>
      <div className="rising" aria-hidden="true">
        {Array.from({ length: 7 }, (_, i) => (
          <span key={i} />
        ))}
      </div>
    </section>
  );
}
