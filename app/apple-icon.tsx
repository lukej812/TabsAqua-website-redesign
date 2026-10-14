import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon: the diver-down flag on deep water. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #2f6f8f 0%, #1c4566 45%, #0b1a2a 100%)",
        }}
      >
        <svg width="112" height="84" viewBox="0 0 32 24">
          <rect x="0.75" y="0.75" width="30.5" height="22.5" rx="2.5" fill="#e2363f" stroke="#0b1a2a" strokeWidth="1.2" />
          <path d="M1.5 1.5h6.2l22.8 17.6v3.4h-6.2L1.5 4.9Z" fill="#f3faf8" />
        </svg>
      </div>
    ),
    size,
  );
}
