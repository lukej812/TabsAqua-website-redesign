import { descent, services } from "@/content/site";
import { BookButton } from "../ui";

/**
 * The descent: how a first scuba experience goes, one step per screen, while
 * the water behind it darkens. Plain HTML in normal flow; the motion lives in
 * the ocean stage behind it, so nothing here waits on script to be read.
 */
export function FirstDive() {
  const { steps, close } = descent;
  return (
    <section id="first-dive" className="descent" data-tone="dark" aria-labelledby="descent-title">
      <div className="descent__intro wrap">
        <p className="kicker">{descent.kicker}</p>
        <h2 id="descent-title" className="descent__title" data-reveal>
          {descent.title}
        </h2>
      </div>
      <ol className="descent__steps wrap">
        {steps.map((step, i) => (
          <li key={step.id} className="descent__step" aria-labelledby={`step-${step.id}`}>
            <div className="descent__card" data-reveal>
              <p className="descent__label">
                <span className="descent__num" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="sr-only">Step {i + 1} of {steps.length}: </span>
                {step.label}
              </p>
              <h3 id={`step-${step.id}`}>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="descent__close wrap" data-reveal>
        <h3>{close.title}</h3>
        <p>{close.text}</p>
        <div className="descent__actions">
          <BookButton id="discover-scuba" label={`Book Discover Scuba, ${services["discover-scuba"].price}`} />
          <a className="btn btn--ghost" href={close.secondary.href}>
            {close.secondary.label}
          </a>
        </div>
      </div>
    </section>
  );
}
