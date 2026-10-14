import { firstDive } from "@/content/site";
import { ScallopLink, TankArt, WaveLine } from "../illustrations";

/** The blue line-art panel: a scuba tank where the reference had a water bottle. */
export function FirstDive() {
  return (
    <section
      id="first-dive"
      className="panel panel--blue first-dive"
      data-tone="dark"
      data-anim
      aria-labelledby="first-dive-title"
    >
      <div className="panel__inner wrap">
        <div className="first-dive__grid">
          <div className="first-dive__left">
            <div className="first-dive__head">
              <h2 id="first-dive-title">{firstDive.title}</h2>
              <WaveLine />
            </div>
            <p>{firstDive.text}</p>
          </div>
          <TankArt bubbles={firstDive.bubbles} label={firstDive.tankLabel} />
          <div className="first-dive__right">
            <div className="first-dive__head">
              <h3>{firstDive.sideTitle}</h3>
              <WaveLine />
            </div>
            <p>{firstDive.sideText}</p>
            <ScallopLink href="#experiences">{firstDive.badge}</ScallopLink>
          </div>
        </div>
      </div>
    </section>
  );
}
