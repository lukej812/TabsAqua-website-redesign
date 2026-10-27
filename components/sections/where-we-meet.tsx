import { courseDetails, isAsk, meetCopy, meetingPoint } from "@/content/site";
import { BridgeArt, SurfaceEdge } from "../art/BridgeArt";
import { ExternalIcon, PinIcon } from "../icons";
import { AskTabitha, CopyButton } from "../ui";

/** Back on shore: the meeting point at Phil Foster Park, under Blue Heron Bridge. */
export function WhereWeMeet() {
  const address = `${meetingPoint.name}, ${meetingPoint.street}, ${meetingPoint.locality}`;
  return (
    <section id="where-we-meet" className="zone zone--shore" data-tone="light" data-anim aria-labelledby="meet-title">
      <SurfaceEdge />
      <div className="wrap zone__inner meet">
        <div className="meet__text">
          <p className="kicker">{meetCopy.kicker}</p>
          <h2 id="meet-title" className="display" data-reveal>
            {meetCopy.title}
          </h2>
          <p className="lede">{meetCopy.intro}</p>
          <p className="meet__address">
            <PinIcon size={22} />
            <span>
              <strong>{meetingPoint.name}</strong>
              <span>{meetingPoint.street}</span>
              <span>{meetingPoint.locality}</span>
            </span>
          </p>
          <p className="meet__note">{meetCopy.note}</p>
          <div className="meet__actions">
            <a className="btn btn--primary" href={meetingPoint.mapsUrl}>
              {meetCopy.mapsLabel}
              <ExternalIcon size={17} />
            </a>
            <CopyButton value={address} label="Address" />
          </div>
          {isAsk(courseDetails.location) && <AskTabitha topic={courseDetails.location} />}
        </div>
        <BridgeArt className="meet__art" />
      </div>
    </section>
  );
}
