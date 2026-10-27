import { hero, heroFacts } from "@/content/site";
import { ArrowDownIcon, PinIcon } from "../icons";

/** The surface: the first screen, over the ocean stage. */
export function Hero() {
  return (
    <section id="top" className="hero" data-tone="dark" aria-labelledby="hero-title">
      <div className="hero__inner wrap">
        <p className="kicker hero__kicker">
          <PinIcon size={16} />
          {hero.kicker}
        </p>
        <h1 id="hero-title" className="hero__title">
          {hero.title} <em>{hero.titleTail}</em>
        </h1>
        <p className="hero__lede">{hero.lede}</p>
        <div className="hero__actions">
          <a className="btn btn--primary" href="#experiences">
            {hero.primaryCta}
          </a>
          <a className="btn btn--ghost" href="#first-dive">
            {hero.secondaryCta}
          </a>
        </div>
        <dl className="hero__facts">
          {heroFacts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <a className="hero__cue" href="#first-dive">
        <span>{hero.scrollCue}</span>
        <ArrowDownIcon size={18} />
      </a>
    </section>
  );
}
