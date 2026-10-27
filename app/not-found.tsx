import type { Metadata } from "next";
import Link from "next/link";
import { Diver } from "@/components/art/Diver";
import { business, contact } from "@/content/site";

export const metadata: Metadata = {
  title: `Page not found | ${business.name}`,
};

/** Any address this site doesn't have. Points people home, to booking, or to Tabitha. */
export default function NotFound() {
  return (
    <main id="main" className="lost" data-tone="dark">
      <div className="lost__inner">
        <Diver className="lost__diver" />
        <p className="kicker">Off the line</p>
        <h1 className="display">We couldn&rsquo;t find that page.</h1>
        <p className="lede">
          It may have moved when the site changed. Everything is on the home page, including booking.
        </p>
        <p className="lost__actions">
          <Link className="btn btn--primary" href="/">
            Back to the surface
          </Link>
          <Link className="btn btn--ghost" href="/#book">
            Book a dive
          </Link>
        </p>
        <p className="lost__contact">
          Or call <a className="text-link" href={contact.phone.href}>{contact.phone.display}</a> and Tabitha can help.
        </p>
      </div>
    </main>
  );
}
