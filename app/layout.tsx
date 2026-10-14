import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Raleway } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { business, seo } from "@/content/site";
import "./globals.css";

// Thin geometric display face, after the reference. Used at 200 and 300, upright
// and italic. It's a variable font, so one file per style covers both weights.
// The only preloaded font, because the hero headline is set in it.
const display = Raleway({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

// A clean grotesk for body copy, labels, and buttons.
const body = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  preload: false,
});

/**
 * Vercel Web Analytics: cookieless page views (no banner needed), plus a
 * "Book click" event per booking link (components/page-script.tsx). Only in
 * builds on Vercel, which set VERCEL=1, so local builds and tests load nothing.
 */
const ANALYTICS = process.env.VERCEL === "1";

// The whole site is prerendered. The build fails if anything makes it request-time.
export const ensureStatic = "navigation";

export const metadata: Metadata = {
  metadataBase: new URL(business.siteUrl),
  title: seo.title,
  description: seo.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: business.name,
    title: seo.title,
    description: seo.description,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: seo.title,
    description: seo.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1a2a",
  colorScheme: "dark",
  viewportFit: "cover",
};

/**
 * Runs before first paint. Marks the page as scripted, so content below the
 * fold may start hidden for its reveal, and sets a failsafe: if the reveal
 * observer has not started within 3 seconds, everything shows.
 */
const bootScript = `(function(){var d=document.documentElement;d.classList.add("js");setTimeout(function(){if(!window.__revealReady)d.classList.add("reveal-all")},3000)})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        {children}
        {ANALYTICS && <Analytics />}
      </body>
    </html>
  );
}
