import type { CSSProperties } from "react";
import { groups, groupsCopy, isAsk } from "@/content/site";
import { Emph } from "../emph";
import { UsersIcon } from "../icons";
import { AskTabitha } from "../ui";
import { GroupForm } from "./group-form";

export function Groups() {
  return (
    <section id="groups" className="frame section groups" aria-labelledby="groups-title">
      <div className="rays" aria-hidden="true" data-parallax />
      <div className="container groups__grid">
        <div className="groups__intro">
          <div className="section-head" data-reveal>
            <h2 id="groups-title" className="h2">
              <Emph text={groupsCopy.title} />
            </h2>
            <p className="lead">{groupsCopy.intro}</p>
          </div>
          <ul className="chips">
            {groups.occasions.map((occasion, i) => (
              <li key={occasion} className="chip glass" data-reveal style={{ "--i": i } as CSSProperties}>
                <UsersIcon size={18} />
                {occasion}
              </li>
            ))}
          </ul>
          <p className="groups__note" data-reveal>
            {groups.note}{" "}
            <a className="text-link" href="#discover-scuba">
              See Discover Scuba
            </a>
          </p>
          {isAsk(groups.sizeLimits) && (
            <div data-reveal>
              <AskTabitha topic={groups.sizeLimits}>{groupsCopy.askText}</AskTabitha>
            </div>
          )}
        </div>
        <div data-reveal style={{ "--i": 1 } as CSSProperties}>
          <GroupForm />
        </div>
      </div>
    </section>
  );
}
