import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { business, hero } from "@/content/site";

export const shareSize = { width: 1200, height: 630 };

const font = (file: string) => readFile(path.join(process.cwd(), "assets/fonts", file));

// Read once at module load, outside any request, so the images stay prerendered.
const [light, lightItalic, regular] = await Promise.all([
  font("Raleway-ExtraLight.ttf"),
  font("Raleway-ExtraLightItalic.ttf"),
  font("Raleway-Regular.ttf"),
]);

/** The emblem from components/emblem.tsx, inlined for Satori. */
function Emblem({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="#eaf4f8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="32" cy="32" r="30.5" />
      <path d="M13.5 53.5c-.3-4.6 1.4-8.6 4.6-11.6M19.5 57.5c-.4-6 1.8-11 6-14.5M26 60c.2-4.6 2.2-8 5.6-10.2M37.5 60.2c-.4-3.8.9-7 3.8-9M43.5 58c-1-5 .2-9.2 3.8-12.4M50 52.4c-.2-3.6 1.2-6.4 4-8.4" />
      <path d="M24.2 20.7 36.2 23.5a2.2 2.2 0 0 1-1 4.3l-12-2.8a2.2 2.2 0 0 1 1-4.3Z" />
      <circle cx="19.6" cy="27" r="3.3" />
      <path d="M16.1 26.1h2.6M22.6 28.4c4.6.4 9.4 1.4 13.6 2.8M24.4 29.2 19 32.6l-4 .2M36.2 31.2 42 29.6l5 1.8M36 32.2l5.2 3.2 4.4 2.8M47 31.4l6.4-2.8-.6 4.4ZM45.6 38.2l6.4.2-2.6 3.6Z" />
      <circle cx="16.6" cy="19.6" r="1.2" />
      <circle cx="14.6" cy="15.6" r="0.9" />
    </svg>
  );
}

/**
 * The share card, in the deep-sea style: a rounded frame of dim water lit
 * from the surface, the headline bottom left in thin Raleway, and the
 * diver-down flag. Used for Open Graph and Twitter.
 */
export function shareImage() {
  const [lead, em] = hero.title.split("*");

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", padding: 22, background: "#0b1a2a" }}>
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: "52px 64px",
            borderRadius: 34,
            overflow: "hidden",
            background: "linear-gradient(180deg, #2f6f8f 0%, #1c4566 34%, #143553 66%, #0e2539 100%)",
            color: "#eaf4f8",
          }}
        >
          {/* Light from the surface */}
          {[
            { left: 300, width: 120, rotate: 14, opacity: 0.1 },
            { left: 560, width: 70, rotate: 8, opacity: 0.08 },
            { left: 760, width: 150, rotate: -6, opacity: 0.09 },
            { left: 960, width: 90, rotate: -14, opacity: 0.07 },
          ].map((ray) => (
            <div
              key={ray.left}
              style={{
                position: "absolute",
                top: -60,
                left: ray.left,
                width: ray.width,
                height: 720,
                background: `linear-gradient(180deg, rgba(200,240,238,${ray.opacity * 3}) 0%, rgba(127,214,208,0) 75%)`,
                transform: `rotate(${ray.rotate}deg)`,
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(0deg, rgba(11,26,42,0.85) 0%, rgba(11,26,42,0) 60%)",
            }}
          />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <Emblem size={64} />
              <div style={{ fontFamily: "Raleway", fontWeight: 400, fontSize: 30 }}>{business.name}</div>
            </div>
            <svg width="64" height="48" viewBox="0 0 32 24">
              <rect x="0.75" y="0.75" width="30.5" height="22.5" rx="2.5" fill="#e2363f" stroke="#0b1a2a" strokeWidth="1.5" />
              <path d="M1.5 1.5h6.2l22.8 17.6v3.4h-6.2L1.5 4.9Z" fill="#f3faf8" />
            </svg>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontFamily: "Raleway", fontWeight: 200, fontSize: 104, lineHeight: 1, letterSpacing: -3 }}>
              {lead.trim()}
            </div>
            <div style={{ display: "flex", fontFamily: "Raleway", fontStyle: "italic", fontWeight: 200, fontSize: 104, lineHeight: 1.08, letterSpacing: -3 }}>
              {em}
            </div>
            <div style={{ display: "flex", marginTop: 22, fontFamily: "Raleway", fontStyle: "italic", fontWeight: 200, fontSize: 38, color: "rgba(234,244,248,0.85)" }}>
              {hero.leadLine}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...shareSize,
      fonts: [
        { name: "Raleway", data: light, weight: 200, style: "normal" },
        { name: "Raleway", data: lightItalic, weight: 200, style: "italic" },
        { name: "Raleway", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}
