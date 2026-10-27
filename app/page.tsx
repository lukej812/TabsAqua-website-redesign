import { DepthGauge } from "@/components/immersive/DepthGauge";
import { Dive } from "@/components/immersive/Dive";
import { PageScript } from "@/components/page-script";
import { BookBar } from "@/components/sections/book-bar";
import { Book } from "@/components/sections/book";
import { Certification } from "@/components/sections/certification";
import { Experiences } from "@/components/sections/experiences";
import { Faq } from "@/components/sections/faq";
import { FirstDive } from "@/components/sections/first-dive";
import { SiteFooter } from "@/components/sections/footer";
import { Groups } from "@/components/sections/groups";
import { SiteHeader } from "@/components/sections/header";
import { Hero } from "@/components/sections/hero";
import { MeetTabitha } from "@/components/sections/tabitha";
import { UnderwaterVideos } from "@/components/sections/videos";
import { WhereWeMeet } from "@/components/sections/where-we-meet";
import { StructuredData } from "@/components/StructuredData";
import { zones } from "@/content/site";

/**
 * One page, read as one dive: the surface, the descent, the reef, deeper
 * water for the courses, a safety stop with Tabitha, the ascent, back on
 * shore at the meeting point, and booking at the surface.
 */
export default function Home() {
  return (
    <>
      <StructuredData />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        <Dive>
          <Hero />
          <FirstDive />
          <Experiences />
          <Certification />
          <UnderwaterVideos />
          <MeetTabitha />
          <Groups />
        </Dive>
        <WhereWeMeet />
        <Faq />
        <Book />
      </main>
      <SiteFooter />
      <BookBar />
      <DepthGauge zones={zones} />
      <PageScript />
    </>
  );
}
