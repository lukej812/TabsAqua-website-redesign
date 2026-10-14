import { bookingUrl, business, contact, seo, services, type ServiceId } from "@/content/site";

/**
 * JSON-LD for search engines: an Organization with its contact details and
 * its services as an OfferCatalog. Deliberately no address: the meeting
 * point is a public park, not a business location, and Tabitha has not
 * confirmed one (see docs/content-needed.md).
 */
export function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: business.name,
    url: business.siteUrl,
    description: seo.description,
    telephone: contact.phone.href.replace("tel:", ""),
    email: contact.email.display,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Snorkeling, scuba, and dive courses",
      itemListElement: (Object.keys(services) as ServiceId[]).map((id) => ({
        "@type": "Offer",
        url: bookingUrl(id),
        price: services[id].price.replace("$", ""),
        priceCurrency: "USD",
        itemOffered: { "@type": "Service", name: services[id].name },
      })),
    },
  };

  return (
    <script
      type="application/ld+json"
      // Our own content, serialized; "<" is escaped so it can never close the tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
