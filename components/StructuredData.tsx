import { business, contact, faq, meetingPoint, seo } from "@/content/site";

/** JSON for a script tag: "<" is escaped so no string can close the tag early. */
const json = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");

/**
 * JSON-LD for search engines.
 *
 * The FAQ schema only includes entries with confirmed answers, so an
 * unanswered question never becomes a rich result. The LocalBusiness entry has
 * no address or geo: the meeting point is a public park, not the business
 * location, and no business address is confirmed (see docs/content-needed.md).
 * The park appears only as the area served.
 */
export function StructuredData() {
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

  const businessSchema = {
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json(businessSchema) }} />
    </>
  );
}
