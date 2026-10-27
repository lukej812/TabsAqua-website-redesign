import { certificationCopy, courseDetails, courseStages, courses, isAsk, services } from "@/content/site";
import { DiveFlag } from "../icons";
import { AskTabitha, BookButton, listOf } from "../ui";

/**
 * Deeper: the certification courses hang off a descent line, the rope divers
 * follow down from a surface buoy. Each course sits a little deeper than the last.
 */
export function Certification() {
  const open = [courseDetails.location, courseDetails.schedule, courseDetails.inclusions].filter(isAsk);

  return (
    <section
      id="certification"
      className="zone zone--deeper"
      data-tone="dark"
      aria-labelledby="certification-title"
    >
      <div className="wrap zone__inner">
        <header className="zone__head zone__head--split">
          <div>
            <p className="kicker">{certificationCopy.kicker}</p>
            <h2 id="certification-title" className="display" data-reveal>
              {certificationCopy.title}
            </h2>
          </div>
          <p className="lede">{certificationCopy.intro}</p>
        </header>

        <div className="line">
          <div className="line__rope" aria-hidden="true">
            <DiveFlag className="line__buoy" />
          </div>
          <ol className="line__courses" aria-label="Courses, in order">
            {courses.map((course, i) => {
              const service = services[course.serviceId];
              return (
                <li className="course" key={course.serviceId} id={course.serviceId} data-reveal>
                  <div className="course__text">
                    {i === 0 && <p className="course__flag">{certificationCopy.startHere}</p>}
                    <h3>{service.name}</h3>
                    <p>{course.summary}</p>
                  </div>
                  <div className="course__buy">
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
        </div>

        <div className="stages">
          <h3 className="stages__title">{certificationCopy.stagesTitle}</h3>
          <ol className="stages__list">
            {courseStages.map((stage, i) => (
              <li key={stage.title} data-reveal>
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
          <AskTabitha topic={{ ask: "course details" }}>Ask Tabitha about {listOf(open.map((a) => a.ask))}.</AskTabitha>
        )}
      </div>
    </section>
  );
}
