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
import { business, contact, faq, meetingPoint, seo } from "@/content/site";

/**
 * JSON-LD structured data. The FAQ schema only includes entries with confirmed
 * answers so we never publish an unanswered question as a rich result.
 * The LocalBusiness schema omits address per docs — the meeting point is a
 * public park, not the business address.
 */
function StructuredData() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq
      .filter((entry) => entry.answer)
      .map((entry) => ({
        "@type": "Question",
        name: entry.question,
        acceptedAnswer: { "@type": "Answer", text: entry.answer },
      })),
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    description: seo.description,
    url: business.siteUrl,
    telephone: contact.phone.href.replace("tel:", ""),
    email: contact.email.href.replace("mailto:", ""),
    areaServed: {
      "@type": "Place",
      name: `${meetingPoint.name}, ${meetingPoint.locality}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
    </>
  );
}

/**
 * One page of rounded panels inside a white frame: white, ice, and ocean blue.
 * Each panel sets its own tone, so text and focus colors always match what is behind them.
 */
export default function Home() {
  return (
    <>
      <StructuredData />
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
