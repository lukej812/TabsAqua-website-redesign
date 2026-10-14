import { GuidedDescentSection } from "@/components/immersive/GuidedDescentSection";
import { PageScript } from "@/components/page-script";
import { About } from "@/components/sections/about";
import { BookBar } from "@/components/sections/book-bar";
import { Contact } from "@/components/sections/contact";
import { Courses } from "@/components/sections/courses";
import { Experiences } from "@/components/sections/experiences";
import { Facts } from "@/components/sections/facts";
import { Faq } from "@/components/sections/faq";
import { SiteFooter } from "@/components/sections/footer";
import { Groups } from "@/components/sections/groups";
import { SiteHeader } from "@/components/sections/header";
import { Hero } from "@/components/sections/hero";
import { ServicesMarquee } from "@/components/sections/marquee";
import { Statement } from "@/components/sections/statement";
import { UnderwaterVideos } from "@/components/sections/videos";
import { WhereWeMeet } from "@/components/sections/where-we-meet";
import { StructuredData } from "@/components/structured-data";

/**
 * One long page of rounded frames floating on deep water. The hero is the
 * reference frame; every section below carries its language: dark water,
 * thin type with italic accents, frosted glass, and uppercase micro-labels.
 */
export default function Home() {
  return (
    <>
      <div id="scroll-sentinel" className="scroll-sentinel" aria-hidden="true" />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="page">
        <Hero />
        <ServicesMarquee />
        <GuidedDescentSection />
        <Facts />
        <Experiences />
        <Statement />
        <Courses />
        <UnderwaterVideos />
        <About />
        <Groups />
        <WhereWeMeet />
        <Faq />
        <Contact />
      </main>
      <SiteFooter />
      <BookBar />
      <PageScript />
      <StructuredData />
    </>
  );
}
