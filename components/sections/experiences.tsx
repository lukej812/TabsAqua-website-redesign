import type { ReactNode } from "react";
import {
  experienceTerms,
  experiences,
  experiencesCopy,
  isAsk,
  services,
  type Experience,
  type Fact,
  type PhotoId,
} from "@/content/site";
import { CheckIcon, FishIcon, MaskIcon, TankIcon } from "../icons";
import { RingBadge } from "../illustrations";
import { AskInline, BookButton, PhotoSlot } from "../ui";

const ICON = {
  "discover-scuba": <TankIcon size={26} />,
  snorkeling: <MaskIcon size={26} />,
  "guided-tours": <FishIcon size={26} />,
} as const;

/** Photo slot for each experience that has one. */
const PHOTO: Partial<Record<Experience["serviceId"], PhotoId>> = {
  "discover-scuba": "discover-scuba",
  snorkeling: "snorkeling",
};

function Value({ fact }: { fact: Fact<string> }) {
  return isAsk(fact) ? <AskInline topic={fact} /> : <>{fact}</>;
}

function Details({ experience }: { experience: Experience }) {
  return (
    <div className="exp__details">
      <h4 className="steps-label">{experiencesCopy.stepsLabel}</h4>
      {isAsk(experience.steps) ? (
        <p>
          <AskInline topic={experience.steps} />
        </p>
      ) : (
        <ol className="steps">
          {experience.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}
      <dl className="log">
        <div className="log__row">
          <dt>Time</dt>
          <dd>
            <Value fact={experience.duration} />
          </dd>
        </div>
        <div className="log__row">
          <dt>Ages</dt>
          <dd>
            <Value fact={experience.minimumAge} />
          </dd>
        </div>
        <div className="log__row">
          <dt>Included</dt>
          <dd>
            <Value fact={experience.included} />
          </dd>
        </div>
        {experience.requirement && (
          <div className="log__row">
            <dt>Requires</dt>
            <dd>{experience.requirement}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

function Foot({ experience }: { experience: Experience }) {
  const service = services[experience.serviceId];
  return (
    <div className="exp__foot">
      <p className="price">
        <span className="sr-only">Price: </span>
        {service.price}
      </p>
      <BookButton id={experience.serviceId} />
    </div>
  );
}

function Badge({ experience }: { experience: Experience }) {
  if (isAsk(experience.tag)) return null;
  return <RingBadge id={experience.serviceId} text={experience.tag} icon={ICON[experience.serviceId]} />;
}

/** Text panel beside a photo panel, like the reference's "Our philosophy". */
function SplitExperience({ experience, reverse }: { experience: Experience; reverse?: boolean }) {
  const { serviceId } = experience;
  const titleId = `${serviceId}-title`;
  const photo = PHOTO[serviceId];
  return (
    <div className={`split${reverse ? " split--reverse" : ""}`}>
      <article
        id={serviceId}
        className="panel panel--ice panel__inner exp exp--split"
        data-tone="light"
        data-anim
        aria-labelledby={titleId}
      >
        <Badge experience={experience} />
        <h3 id={titleId}>{services[serviceId].name}</h3>
        <p className="exp__summary">{experience.summary}</p>
        <Details experience={experience} />
        <Foot experience={experience} />
      </article>
      {photo && <PhotoSlot id={photo} panel />}
    </div>
  );
}

/** A full-width blue panel for an experience with no photo yet. */
function WideExperience({ experience }: { experience: Experience }) {
  const { serviceId } = experience;
  const titleId = `${serviceId}-title`;
  return (
    <article
      id={serviceId}
      className="panel panel--blue panel__inner exp exp--wide"
      data-tone="dark"
      data-anim
      aria-labelledby={titleId}
    >
      <div className="exp__intro">
        <Badge experience={experience} />
        <h3 id={titleId}>{services[serviceId].name}</h3>
        <p className="exp__summary">{experience.summary}</p>
        <Foot experience={experience} />
      </div>
      <Details experience={experience} />
    </article>
  );
}

export function Experiences(): ReactNode {
  return (
    <section id="experiences" className="stack" aria-labelledby="experiences-title">
      <div className="panel panel--white" data-tone="light">
        <div className="panel__inner wrap centered">
          <h2 id="experiences-title" className="display">
            {experiencesCopy.title}
          </h2>
          <p className="lede">{experiencesCopy.intro}</p>
          <ul className="terms">
            {experienceTerms.map((term) => (
              <li key={term}>
                <CheckIcon size={18} />
                {term}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {experiences.map((experience, i) =>
        PHOTO[experience.serviceId] ? (
          <SplitExperience experience={experience} reverse={i % 2 === 1} key={experience.serviceId} />
        ) : (
          <WideExperience experience={experience} key={experience.serviceId} />
        ),
      )}
    </section>
  );
}
