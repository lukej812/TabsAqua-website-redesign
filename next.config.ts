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

const nextConfig: NextConfig = {
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
