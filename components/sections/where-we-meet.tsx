import { courseDetails, isAsk, meetCopy, meetingPoint } from "@/content/site";
import { Emph } from "../emph";
import { DirectionsIcon } from "../icons";
import { BridgeLineArt } from "../illustrations";
import { AskTabitha, CopyButton } from "../ui";

export function WhereWeMeet() {
  const address = `${meetingPoint.name}, ${meetingPoint.street}, ${meetingPoint.locality}`;
  return (
    <section id="where" className="frame section where" aria-labelledby="where-title">
      <div className="container where__grid">
        <div className="where__text" data-reveal>
          <h2 id="where-title" className="h2">
            <Emph text={meetCopy.title} />
          </h2>
          <p className="where__label label">{meetCopy.label}</p>
          <address className="where__address">
            <span>{meetingPoint.name}</span>
            <span>{meetingPoint.street}</span>
            <span>{meetingPoint.locality}</span>
          </address>
          <p className="muted">{meetCopy.note}</p>
          <div className="where__actions">
            <a className="btn btn--primary" href={meetingPoint.mapsUrl} target="_blank" rel="noopener noreferrer" data-magnetic>
              <DirectionsIcon size={18} />
              {meetCopy.directions}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <CopyButton value={address} label="Address" />
          </div>
          {isAsk(courseDetails.location) && <AskTabitha topic={courseDetails.location} />}
        </div>
        <div className="where__map" data-reveal>
          <BridgeLineArt className="where__art" />
        </div>
      </div>
    </section>
  );
}
