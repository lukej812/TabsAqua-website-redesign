import { groups, groupsCopy, isAsk } from "@/content/site";
import { FishSchool } from "../art/FishSchool";
import { GroupPlanner } from "../forms/GroupPlanner";
import { AskTabitha, PhotoFrame } from "../ui";

/** The ascent: groups and celebrations, with a planner that drafts an email to Tabitha. */
export function Groups() {
  return (
    <section id="groups" className="zone zone--ascent" data-tone="dark" data-zone aria-labelledby="groups-title">
      <FishSchool seed={5} count={12} scale={0.8} className="school--ascent" />
      <div className="wrap zone__inner groups">
        <div className="groups__text">
          <p className="kicker">{groupsCopy.kicker}</p>
          <h2 id="groups-title" className="display" data-reveal>
            {groupsCopy.title}
          </h2>
          <p className="lede">{groupsCopy.intro}</p>
          <ul className="occasions">
            {groups.occasions.map((occasion) => (
              <li key={occasion}>{occasion}</li>
            ))}
          </ul>
          <p>{groups.note}</p>
          <p>
            <a className="text-link" href="#discover-scuba">
              See Discover Scuba
            </a>
          </p>
          <PhotoFrame id="group" className="groups__photo" />
          {isAsk(groups.sizeLimits) && <AskTabitha topic={groups.sizeLimits}>{groupsCopy.askText}</AskTabitha>}
        </div>
        <div className="js-block groups__planner">
          <GroupPlanner />
        </div>
      </div>
    </section>
  );
}
