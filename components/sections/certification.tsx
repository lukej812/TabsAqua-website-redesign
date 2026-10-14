import {
  certificationCopy,
  courseDetails,
  courseStages,
  courses,
  isAsk,
  services,
} from "@/content/site";
import { WaveLine } from "../illustrations";
import { AskTabitha, BookButton } from "../ui";

export function Certification() {
  const open = [courseDetails.location, courseDetails.schedule, courseDetails.inclusions].filter(isAsk);

  return (
    <section
      id="certification"
      className="panel panel--blue"
      data-tone="dark"
      data-anim
      aria-labelledby="certification-title"
    >
      <div className="panel__inner wrap">
        <div className="centered">
          <h2 id="certification-title" className="display">
            {certificationCopy.title}
          </h2>
          <p className="lede">{certificationCopy.intro}</p>
        </div>

        <ol className="ladder" aria-label="Courses, in order">
          {courses.map((course) => {
            const service = services[course.serviceId];
            return (
              <li className="ladder__step" key={course.serviceId} id={course.serviceId}>
                <div>
                  <h3>{service.name}</h3>
                  <p>{course.summary}</p>
                </div>
                <div className="ladder__buy">
                  <p className="price">
                    <span className="sr-only">Price: </span>
                    {service.price}
                  </p>
                  <BookButton id={course.serviceId} small />
                </div>
              </li>
            );
          })}
        </ol>

        <div className="stages">
          <h3>{certificationCopy.stagesTitle}</h3>
          <WaveLine />
          <ol className="stages__list">
            {courseStages.map((stage, i) => (
              <li key={stage.title}>
                <span className="stages__num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h4>{stage.title}</h4>
                <p>{stage.text}</p>
              </li>
            ))}
          </ol>
        </div>

        {open.length > 0 && (
          <AskTabitha topic={{ ask: "course details" }}>
            Not listed here yet: {open.map((a) => a.ask).join(", ")}. Call or email and Tabitha can
            tell you.
          </AskTabitha>
        )}
      </div>
    </section>
  );
}
