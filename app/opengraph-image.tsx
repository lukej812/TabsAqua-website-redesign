import { ImageResponse } from "next/og";
import { business, hero, seo } from "@/content/site";

export const alt = seo.ogImageAlt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Share card: the headline centered on the site's ocean blue, like the hero. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "72px 80px",
          background: "linear-gradient(180deg, #f3f7fb 0%, #dfeaf4 48%, #6596c0 49%, #1f5b8a 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="64" height="48" viewBox="0 0 32 24">
            <rect x="0.75" y="0.75" width="30.5" height="22.5" rx="2.5" fill="#d9483b" stroke="#173a5c" strokeWidth="1.5" />
            <path d="M1.5 1.5h6.2l22.8 17.6v3.4h-6.2L1.5 4.9Z" fill="#f3faf8" />
          </svg>
          <div style={{ fontSize: 36, color: "#173a5c" }}>{business.name}</div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 64,
            lineHeight: 1.08,
            color: "#ffffff",
            maxWidth: 960,
            textAlign: "center",
            justifyContent: "center",
          }}
        >
          {hero.title}
        </div>
      </div>
    ),
    size,
  );
}
