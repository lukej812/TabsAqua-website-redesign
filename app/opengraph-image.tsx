import { ImageResponse } from "next/og";
import { business, hero, seo } from "@/content/site";

export const alt = seo.ogImageAlt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Share card: the hero's over-under view, with the headline in the water. */
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
          padding: "56px 72px",
          background:
            "linear-gradient(180deg, #1c5a8a 0%, #79b7d6 24%, #d9edf2 30%, #4a95b9 30%, #1b6b94 34%, #5fc3ce 34%, #2a93ad 52%, #176a93 74%, #0e4a72 100%)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 860,
            top: 70,
            width: 64,
            height: 64,
            borderRadius: 64,
            background: "#fffdf3",
            boxShadow: "0 0 90px 50px rgba(255, 244, 220, 0.45)",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="48" height="36" viewBox="0 0 32 24">
            <rect x="0.75" y="0.75" width="30.5" height="22.5" rx="2.5" fill="#d9483b" stroke="#0a2540" strokeWidth="1.5" />
            <path d="M1.5 1.5h6.2l22.8 17.6v3.4h-6.2L1.5 4.9Z" fill="#f3faf8" />
          </svg>
          <div style={{ fontSize: 34, color: "#ffffff" }}>{business.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", color: "#ffffff", maxWidth: 900 }}>
          <div style={{ fontSize: 68, lineHeight: 1.04 }}>{hero.title}</div>
          <div style={{ fontSize: 68, lineHeight: 1.04, fontStyle: "italic" }}>{hero.titleTail}</div>
          <div style={{ marginTop: 22, fontSize: 26, color: "#e3f2f7" }}>
            Snorkel and scuba with Tabitha at Blue Heron Bridge, Riviera Beach, FL
          </div>
        </div>
      </div>
    ),
    size,
  );
}
