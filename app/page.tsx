import { GuidedDescentSection } from "@/components/immersive/GuidedDescentSection";
import { PageScript } from "@/components/page-script";
import { BookBar } from "@/components/sections/book-bar";
import { Certification } from "@/components/sections/certification";
import { Experiences } from "@/components/sections/experiences";
import { Faq } from "@/components/sections/faq";
import { FinalCall } from "@/components/sections/final-call";
import { FirstDive } from "@/components/sections/first-dive";
import { SiteFooter } from "@/components/sections/footer";
import { Groups } from "@/components/sections/groups";
import { SiteHeader } from "@/components/sections/header";
import { Hero } from "@/components/sections/hero";
import { StartHere } from "@/components/sections/start-here";
import { MeetTabitha } from "@/components/sections/tabitha";
import { UnderwaterVideos } from "@/components/sections/videos";
import { WhereWeMeet } from "@/components/sections/where-we-meet";

/**
 * One page of rounded panels inside a white frame: white, ice, and ocean blue.
 * Each panel sets its own tone, so text and focus colors always match what is behind them.
 */
export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="frame">
        <Hero />
        <GuidedDescentSection />
        <FirstDive />
        <StartHere />
        <Experiences />
        <Certification />
        <UnderwaterVideos />
        <MeetTabitha />
        <Groups />
        <WhereWeMeet />
        <Faq />
        <FinalCall />
      </main>
      <SiteFooter />
      <BookBar />
      <PageScript />
    </>
  );
}
