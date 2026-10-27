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
import { FishSchool } from "../art/FishSchool";
import { Reef } from "../art/Reef";
import { CheckIcon, FishIcon, MaskIcon, TankIcon } from "../icons";
import { AskInline, BookButton, PhotoFrame } from "../ui";

const ICON = {
  "discover-scuba": <TankIcon size={22} />,
  snorkeling: <MaskIcon size={22} />,
  "guided-tours": <FishIcon size={22} />,
} as const;

/** Photo slot for each experience that has one. */
const PHOTO: Partial<Record<Experience["serviceId"], PhotoId>> = {
  "discover-scuba": "discover-scuba",
  snorkeling: "snorkeling",
};

function Value({ fact }: { fact: Fact<string> }) {
  return isAsk(fact) ? <AskInline topic={fact} /> : <>{fact}</>;
}

/** One experience as an editorial spread: the pitch on the left, the dive log on the right. */
function ExperienceEntry({ experience }: { experience: Experience }) {
  const { serviceId } = experience;
  const service = services[serviceId];
  const titleId = `${serviceId}-title`;
  const photo = PHOTO[serviceId];
  return (
    <article id={serviceId} className="exp" aria-labelledby={titleId} data-reveal>
      <div className="exp__pitch">
        {!isAsk(experience.tag) && (
          <p className="exp__tag">
            <span className="exp__icon">{ICON[serviceId]}</span>
            {experience.tag}
          </p>
        )}
        <h3 id={titleId} className="exp__name">
          {service.name}
        </h3>
        <p className="exp__summary">{experience.summary}</p>
        <div className="exp__buy">
          <p className="price">
            <span className="sr-only">Price: </span>
            {service.price}
          </p>
          <BookButton id={serviceId} />
        </div>
      </div>
      <div className="exp__log">
        {photo && <PhotoFrame id={photo} className="exp__photo" />}
        <h4 className="exp__label">{experiencesCopy.stepsLabel}</h4>
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
        <dl className="specs">
          <div>
            <dt>Time</dt>
            <dd>
              <Value fact={experience.duration} />
            </dd>
          </div>
          <div>
            <dt>Ages</dt>
            <dd>
              <Value fact={experience.minimumAge} />
            </dd>
          </div>
          <div>
            <dt>Included</dt>
            <dd>
              <Value fact={experience.included} />
            </dd>
          </div>
          {experience.requirement && (
            <div>
              <dt>Requires</dt>
              <dd>{experience.requirement}</dd>
            </div>
          )}
        </dl>
      </div>
    </article>
  );
}

/** The reef: the three experiences, over reef silhouettes and a passing school of fish. */
export function Experiences() {
  return (
    <section id="experiences" className="zone zone--reef" data-tone="dark" data-zone aria-labelledby="experiences-title">
      <div className="zone__rays" aria-hidden="true" />
      <FishSchool seed={11} count={18} className="school--reef" />
      <div className="wrap zone__inner">
        <header className="zone__head">
          <p className="kicker">{experiencesCopy.kicker}</p>
          <h2 id="experiences-title" className="display" data-reveal>
            {experiencesCopy.title} <span className="soft">{experiencesCopy.titleSoft}</span>
          </h2>
          <p className="lede">{experiencesCopy.intro}</p>
          <ul className="terms">
            {experienceTerms.map((term) => (
              <li key={term}>
                <CheckIcon size={17} />
                {term}
              </li>
            ))}
          </ul>
        </header>
        <div className="exp-list">
          {experiences.map((experience) => (
            <ExperienceEntry experience={experience} key={experience.serviceId} />
          ))}
        </div>
      </div>
      <Reef
        className="reef--floor"
        layers={[
          { seed: 7, base: 150, relief: 50, scale: 0.6, features: 26, color: "var(--reef-far)", depth: 0 },
          { seed: 21, base: 95, relief: 60, scale: 0.85, features: 22, clear: [0.3, 0.7], color: "var(--reef-mid)", depth: 1 },
          { seed: 42, base: 45, relief: 40, scale: 1.15, features: 14, clear: [0.25, 0.75], color: "var(--reef-near)", depth: 2 },
        ]}
      />
    </section>
  );
}
