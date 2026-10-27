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
import { AskTabitha, BookButton, listOf, PhotoFrame } from "../ui";

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

/** How each unconfirmed detail is named in the one "Ask Tabitha" line. */
const OPEN_LABEL = {
  steps: "what happens",
  duration: "how long it runs",
  minimumAge: "ages",
  included: "what's included",
} as const;

const SPECS = [
  { key: "duration", label: "Time" },
  { key: "minimumAge", label: "Ages" },
  { key: "included", label: "Included" },
] as const;

/** One experience as an editorial spread: the pitch on the left, the dive log on the right. */
function ExperienceEntry({ experience }: { experience: Experience }) {
  const { serviceId } = experience;
  const service = services[serviceId];
  const titleId = `${serviceId}-title`;
  const photo = PHOTO[serviceId];
  const open = (Object.keys(OPEN_LABEL) as (keyof typeof OPEN_LABEL)[])
    .filter((key) => isAsk(experience[key]))
    .map((key) => OPEN_LABEL[key]);
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
        {!isAsk(experience.steps) && (
          <>
            <h4 className="exp__label">{experiencesCopy.stepsLabel}</h4>
            <ol className="steps">
              {experience.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </>
        )}
        <dl className="specs">
          {SPECS.map(({ key, label }) => {
            const value: Fact<string> = experience[key];
            return isAsk(value) ? null : (
              <div key={key}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            );
          })}
          {experience.requirement && (
            <div>
              <dt>Requires</dt>
              <dd>{experience.requirement}</dd>
            </div>
          )}
        </dl>
        {open.length > 0 && (
          <AskTabitha topic={{ ask: `${service.name.toLowerCase()} details` }}>
            Before you book, ask Tabitha about {listOf(open)}.
          </AskTabitha>
        )}
      </div>
    </article>
  );
}

/** The reef: the three experiences, over reef silhouettes and a passing school of fish. */
export function Experiences() {
  return (
    <section id="experiences" className="zone zone--reef" data-tone="dark" data-anim aria-labelledby="experiences-title">
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
      <Reef className="reef--floor" />
    </section>
  );
}
