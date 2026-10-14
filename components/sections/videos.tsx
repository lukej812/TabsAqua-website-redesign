import { business, videos } from "@/content/site";
import { PhotoSlot } from "../ui";

/** Only renders when business.videosIncluded is true in content/site.ts. */
export function UnderwaterVideos() {
  if (!business.videosIncluded) return null;
  return (
    <section id="videos" className="split" aria-labelledby="videos-title">
      <div className="panel panel--ice panel__inner centered" data-tone="light">
        <h2 id="videos-title" className="display">
          {videos.title}
        </h2>
        <p className="lede">{videos.text}</p>
      </div>
      <PhotoSlot id="underwater-video" panel />
    </section>
  );
}
