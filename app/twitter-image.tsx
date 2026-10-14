import { seo } from "@/content/site";
import { shareImage } from "@/lib/share-image";

export const alt = seo.ogImageAlt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Same card as the Open Graph image, for X (Twitter). */
export default function TwitterImage() {
  return shareImage();
}
