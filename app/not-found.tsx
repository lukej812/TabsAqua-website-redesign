import Link from "next/link";
import { notFoundCopy } from "@/content/site";
import { Emblem } from "@/components/emblem";
import { Emph } from "@/components/emph";
import { ArrowUpIcon } from "@/components/icons";

export const metadata = { title: "Page not found | Tabs AquaQuest Diving" };

/** 404, in the same deep water: one line of copy and the way back up. */
export default function NotFound() {
  return (
    <main id="main" className="page">
      <section className="frame not-found" aria-labelledby="not-found-title">
        <div className="hero__bg" aria-hidden="true">
          <div className="hero__scrim" />
        </div>
        <div className="not-found__inner">
          <Emblem className="emblem not-found__emblem" />
          <h1 id="not-found-title" className="display not-found__title">
            <Emph text={notFoundCopy.title} />
          </h1>
          <p className="lead">{notFoundCopy.text}</p>
          <Link className="btn btn--primary" href="/">
            <ArrowUpIcon size={18} className="btn__icon btn__icon--nudge-up" />
            {notFoundCopy.cta}
          </Link>
        </div>
      </section>
    </main>
  );
}
