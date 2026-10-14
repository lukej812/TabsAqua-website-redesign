import Image from "next/image";
import type { CSSProperties } from "react";
import {
  experienceTerms,
  experiences,
  experiencesCopy,
  isAsk,
  photos,
  services,
  type Experience,
  type Fact,
} from "@/content/site";
import { photoSrc } from "@/lib/photos";
import { Emph } from "../emph";
import { FishIcon, MaskIcon, TankIcon } from "../icons";
import { AskInline, BookButton } from "../ui";

const ICON = {
  "discover-scuba": <TankIcon size={28} />,
  snorkeling: <MaskIcon size={28} />,
  "guided-tours": <FishIcon size={28} />,
} as const;

function Value({ fact }: { fact: Fact<string> }) {
  return isAsk(fact) ? <AskInline topic={fact} /> : <>{fact}</>;
}

/**
 * One large glass card. Tilt and the cursor spotlight are added by
 * components/page-script.tsx on fine pointers (data-tilt). Its id lets the
 * hero carousel deep link to it.
 */
function ExperienceCard({ experience, index }: { experience: Experience; index: number }) {
  const { serviceId } = experience;
  const service = services[serviceId];
  const titleId = `${serviceId}-title`;
  const photo = serviceId in photos ? photoSrc(serviceId as keyof typeof photos) : undefined;

  return (
    <div className="exp-slot" data-reveal style={{ "--i": index } as CSSProperties}>
      <article id={serviceId} className="exp-card glass spotlight" data-tilt aria-labelledby={titleId}>
        <span className="shimmer" aria-hidden="true">
          <span />
        </span>
        {photo && (
          <div className="exp-card__photo">
            <Image
              src={photo}
              alt={photos[serviceId as keyof typeof photos].alt}
              fill
              sizes="(min-width: 1024px) 30vw, 100vw"
            />
          </div>
        )}
        <header className="exp-card__head">
          <span className="exp-card__icon">{ICON[serviceId]}</span>
          <p className="exp-card__price">
            <span className="sr-only">Price: </span>
            {service.price}
          </p>
        </header>
        <h3 id={titleId} className="exp-card__name">
          {service.name}
        </h3>
        {!isAsk(experience.tag) && <p className="exp-card__tag label">{experience.tag}</p>}
        <p className="exp-card__summary">{experience.summary}</p>

        <h4 className="exp-card__label label">{experiencesCopy.stepsLabel}</h4>
        {isAsk(experience.steps) ? (
          <p className="exp-card__ask">
            <AskInline topic={experience.steps} />
          </p>
        ) : (
          <ol className="exp-card__steps">
            {experience.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        )}

        <dl className="exp-card__specs">
          <div>
            <dt>{experiencesCopy.timeLabel}</dt>
            <dd>
              <Value fact={experience.duration} />
            </dd>
          </div>
          <div>
            <dt>{experiencesCopy.agesLabel}</dt>
            <dd>
              <Value fact={experience.minimumAge} />
            </dd>
          </div>
          <div>
            <dt>{experiencesCopy.includedLabel}</dt>
            <dd>
              <Value fact={experience.included} />
            </dd>
          </div>
          {experience.requirement && (
            <div>
              <dt>{experiencesCopy.requiresLabel}</dt>
              <dd>{experience.requirement}</dd>
            </div>
          )}
        </dl>

        <p className="exp-card__fine">{experienceTerms.join(". ")}.</p>

        <div className="exp-card__foot">
          <BookButton id={serviceId} />
          <p className="exp-card__note">{experiencesCopy.bookNote}</p>
        </div>
      </article>
    </div>
  );
}

export function Experiences() {
  return (
    <section id="experiences" className="frame section experiences" aria-labelledby="experiences-title" data-anim>
      <div className="rays" aria-hidden="true" data-parallax />
      <div className="container">
        <div className="section-head" data-reveal>
          <h2 id="experiences-title" className="h2">
            <Emph text={experiencesCopy.title} />
          </h2>
          <p className="lead">{experiencesCopy.intro}</p>
        </div>
        <div className="exp-grid">
          {experiences.map((experience, i) => (
            <ExperienceCard key={experience.serviceId} experience={experience} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
