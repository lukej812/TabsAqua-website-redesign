import type { NextConfig } from "next";

/**
 * Wix booking placeholder.
 *
 * Every Book button links to Wix booking pages under /booking-calendar/*, and
 * Tabitha's existing links point at /book-online. Today both live on
 * www.tabsaquaquestdiving.com. If this site takes over that domain, those paths
 * must keep resolving: move Wix booking to its own host (for example a
 * book. subdomain), set WIX_BOOKING_ORIGIN to it, and update
 * business.bookingBase in content/site.ts to match. See README.md.
 */
const WIX_BOOKING_ORIGIN: string | null = null;

/**
 * Security headers, as in the portfolio. No Content-Security-Policy: a strict
 * one would block the Google Maps embed behind "Show map".
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Photo slots (public/photos/*) are served as AVIF or WebP at the sizes each slot asks for.
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75],
  },
  // Tests build into their own folder so they never clash with a running dev server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  async redirects() {
    if (!WIX_BOOKING_ORIGIN) return [];
    return [
      {
        source: "/book-online",
        destination: `${WIX_BOOKING_ORIGIN}/book-online`,
        permanent: false,
      },
      {
        source: "/booking-calendar/:path*",
        destination: `${WIX_BOOKING_ORIGIN}/booking-calendar/:path*`,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
