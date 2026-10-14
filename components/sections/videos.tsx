import { business, videos } from "@/content/site";
import { PhotoSlot } from "../ui";

/** Only renders when business.videosIncluded is true in content/site.ts. */
export function UnderwaterVideos() {
  if (!business.videosIncluded) return null;
  return (
    <section id="videos" className="frame section videos" aria-labelledby="videos-title">
      <div className="container split">
        <div className="section-head" data-reveal>
          <h2 id="videos-title" className="h2">
            {videos.title}
          </h2>
          <p className="lead">{videos.text}</p>
        </div>
        <PhotoSlot id="underwater-video" ratio="4 / 3" />
      </div>
    </section>
  );
}
