import type { CSSProperties } from "react";
import { certificationCopy, courseDetails, courseStages, courses, isAsk, services } from "@/content/site";
import { Emph } from "../emph";
import { LaptopIcon, PoolIcon, WavesIcon } from "../icons";
import { AskInline, BookButton } from "../ui";

const STAGE_ICONS = [<LaptopIcon key="online" size={22} />, <PoolIcon key="confined" size={22} />, <WavesIcon key="open" size={22} />];

/**
 * Open Water, then Advanced, then Rescue: three steps joined by a beam that
 * fills as you scroll (components/motion/scroll-scenes.tsx). Horizontal on
 * wide screens, vertical on phones. The beam rests full without that script.
 * No certifying agency is named anywhere.
 */
export function Courses() {
  const details = [
    { label: certificationCopy.askLabels.location, fact: courseDetails.location },
    { label: certificationCopy.askLabels.schedule, fact: courseDetails.schedule },
    { label: certificationCopy.askLabels.inclusions, fact: courseDetails.inclusions },
  ];

  return (
    <section id="courses" className="frame section courses" aria-labelledby="courses-title">
      <div className="rays" aria-hidden="true" data-parallax />
      <div className="container">
        <div className="section-head" data-reveal>
          <h2 id="courses-title" className="h2">
            <Emph text={certificationCopy.title} />
          </h2>
          <p className="lead">{certificationCopy.intro}</p>
        </div>

        <div className="course-path" data-beam>
          <div className="course-path__beam" aria-hidden="true">
            <span className="course-path__fill" data-beam-fill />
          </div>
          <ol className="course-path__list" aria-label="Courses, in order">
          {courses.map((course, i) => {
            const service = services[course.serviceId];
            return (
              <li
                key={course.serviceId}
                id={course.serviceId}
                className="course"
                data-reveal
                style={{ "--i": i } as CSSProperties}
              >
                <span className="course__node" aria-hidden="true">
                  {i + 1}
                </span>
                <div className="course__body glass">
                  <p className="course__step label">
                    {certificationCopy.stepLabel} {i + 1}
                  </p>
                  <h3 className="course__name">{service.name}</h3>
                  <p className="course__price">
                    <span className="sr-only">Price: </span>
                    {service.price}
                  </p>
                  <p className="course__summary">{course.summary}</p>
                  <dl className="course__details">
                    {details.map(({ label, fact }) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{isAsk(fact) ? <AskInline topic={fact} /> : fact}</dd>
                      </div>
                    ))}
                  </dl>
                  <BookButton id={course.serviceId} />
                </div>
              </li>
            );
          })}
          </ol>
        </div>

        <div className="stages" data-reveal>
          <h3 className="stages__title h3">{certificationCopy.stagesTitle}</h3>
          <ol className="stages__list">
            {courseStages.map((stage, i) => (
              <li key={stage.title} className="stage">
                <span className="stage__icon" aria-hidden="true">
                  {STAGE_ICONS[i]}
                </span>
                <h4 className="stage__title">{stage.title}</h4>
                <p className="stage__text">{stage.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
