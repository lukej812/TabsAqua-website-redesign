import { courseDetails, isAsk, meetCopy, meetingPoint } from "@/content/site";
import { ExternalIcon } from "../icons";
import { BridgeLineArt } from "../illustrations";
import { AskTabitha, CopyButton } from "../ui";

export function WhereWeMeet() {
  const address = `${meetingPoint.name}, ${meetingPoint.street}, ${meetingPoint.locality}`;
  return (
    <section id="where-we-meet" className="split split--reverse" aria-labelledby="meet-title">
      <div className="panel panel--ice panel__inner centered" data-tone="light">
        <h2 id="meet-title" className="display">
          {meetCopy.title}
        </h2>
        <p className="lede">{meetCopy.intro}</p>
        <p className="meet__address">
          <span>{meetingPoint.name}</span>
          <span>{meetingPoint.street}</span>
          <span>{meetingPoint.locality}</span>
        </p>
        <p className="meet__note">{meetCopy.note}</p>
        <div className="meet__actions">
          <a className="btn btn--primary" href={meetingPoint.mapsUrl}>
            {meetCopy.mapsLabel}
            <ExternalIcon size={18} />
          </a>
          <CopyButton value={address} label="Address" />
        </div>
        {isAsk(courseDetails.location) && <AskTabitha topic={courseDetails.location} />}
      </div>
      <div className="panel panel--blue meet-art">
        <BridgeLineArt />
      </div>
    </section>
  );
}
