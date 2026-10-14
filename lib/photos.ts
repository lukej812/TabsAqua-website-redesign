import { heroVideo, photos, type Photo, type PhotoId } from "@/content/site";
import { publicFileExists } from "./public-files";

const EXTENSIONS = ["avif", "webp", "jpg", "jpeg", "png"] as const;

/**
 * The photo for a slot, if one exists at build time: the explicit `src` in
 * content/site.ts, or a file at public/photos/<slot id>.<ext>.
 */
export function photoSrc(id: PhotoId): string | undefined {
  const photo: Photo = photos[id];
  if (photo.src) return photo.src;
  for (const ext of EXTENSIONS) {
    const candidate = `/photos/${id}.${ext}`;
    if (publicFileExists(candidate)) return candidate;
  }
  return undefined;
}

/** The hero video's files, if the mp4 exists at build time. */
export function heroVideoSources() {
  if (!publicFileExists(heroVideo.mp4)) return undefined;
  return {
    mp4: heroVideo.mp4,
    webm: publicFileExists(heroVideo.webm) ? heroVideo.webm : undefined,
    poster: publicFileExists(heroVideo.poster) ? heroVideo.poster : undefined,
  };
}
