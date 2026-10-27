import { business, videos } from "@/content/site";
import { PhotoFrame } from "../ui";

/** Only renders when business.videosIncluded is true in content/site.ts. Sits between Deeper and the safety stop. */
export function UnderwaterVideos() {
  if (!business.videosIncluded) return null;
  return (
    <section id="videos" className="zone zone--videos" data-tone="dark" aria-labelledby="videos-title">
      <div className="wrap zone__inner videos">
        <div>
          <h2 id="videos-title" className="display">
            {videos.title}
          </h2>
          <p className="lede">{videos.text}</p>
        </div>
        <PhotoFrame id="underwater-video" className="videos__photo" />
      </div>
    </section>
  );
}
