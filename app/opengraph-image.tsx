import { seo } from "@/content/site";
import { shareImage } from "@/lib/share-image";

export const alt = seo.ogImageAlt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Share card for Open Graph. Drawn at build time; see lib/share-image.tsx. */
export default function OpengraphImage() {
  return shareImage();
}
