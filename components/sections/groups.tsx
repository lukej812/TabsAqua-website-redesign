import { groups, groupsCopy, isAsk } from "@/content/site";
import { AskTabitha, PhotoSlot } from "../ui";

/** A big photo panel with the heading over it, like the reference's "Health in one glass". */
export function Groups() {
  return (
    <section id="groups" className="stack" aria-labelledby="groups-title">
      <div className="panel groups-hero">
        <PhotoSlot id="group" panel />
        <div className="groups-hero__head" data-tone="dark">
          <h2 id="groups-title" className="display">
            {groupsCopy.title}
          </h2>
          <p className="lede">{groupsCopy.intro}</p>
        </div>
      </div>
      <div className="panel panel--white" data-tone="light">
        <div className="panel__inner wrap">
          <ul className="occasions">
            {groups.occasions.map((occasion) => (
              <li key={occasion}>{occasion}</li>
            ))}
          </ul>
          <div className="centered">
            <p className="lede">{groups.note}</p>
            <p>
              <a className="text-link" href="#discover-scuba">
                See Discover Scuba
              </a>
            </p>
            {isAsk(groups.sizeLimits) && (
              <AskTabitha topic={groups.sizeLimits}>{groupsCopy.askText}</AskTabitha>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
