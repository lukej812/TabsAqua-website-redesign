/**
 * Every business fact on the site lives in this file.
 *
 * Rule zero (see CLAUDE.md): only verified facts go here. When Tabitha has not
 * confirmed something, use `ask("...")` instead of guessing. Components render an
 * "Ask Tabitha" contact prompt wherever they find one, and docs/content-needed.md
 * tracks what each gap blocks.
 */

/** A fact the owner has not confirmed yet. Rendered as an "Ask Tabitha" prompt. */
export type Ask = { ask: string };

/** Either a confirmed value or an open question for Tabitha. */
export type Fact<T> = T | Ask;

export const ask = (topic: string): Ask => ({ ask: topic });

export function isAsk(value: unknown): value is Ask {
  return typeof value === "object" && value !== null && "ask" in value;
}

/* ------------------------------------------------------------------ */
/* Business                                                            */
/* ------------------------------------------------------------------ */

export const business = {
  name: "Tabs AquaQuest Diving",
  owner: "Tabitha",
  /**
   * Canonical URL used for metadata, the sitemap, and Open Graph tags.
   * Confirm the final domain before launch (see docs/content-needed.md).
   */
  siteUrl: "https://www.tabsaquaquestdiving.com",
  /**
   * Where the Wix booking pages live. Every Book button is built from this.
   * If this site takes over the www domain, move Wix booking to its own host,
   * change this value, and turn on the redirects in next.config.ts.
   */
  bookingBase: "https://www.tabsaquaquestdiving.com",
  /**
   * Whether direct bookings include free underwater videos. Not verified:
   * her marketplace listings include videos, but at different prices than her
   * own site. Keep false until Tabitha confirms. True shows the videos section.
   */
  videosIncluded: false,
} as const;

export const seo = {
  title: "Tabs AquaQuest Diving | Snorkeling and scuba with Tabitha",
  description:
    "Instructor-led snorkeling, Discover Scuba for first-timers, guided tours for certified divers, and certification courses with Tabitha. Snorkel and scuba experiences meet at Phil Foster Park at Blue Heron Bridge, Riviera Beach, FL.",
  ogImageAlt:
    "Tabs AquaQuest Diving. Take your first breath underwater, or your next great dive.",
} as const;

/* ------------------------------------------------------------------ */
/* Contact                                                             */
/* ------------------------------------------------------------------ */

export const contact = {
  phone: {
    display: "904.482.2453",
    href: "tel:+19044822453",
  },
  email: {
    display: "info@tabsaquaquestdiving.com",
    href: "mailto:info@tabsaquaquestdiving.com",
  },
} as const;

/* ------------------------------------------------------------------ */
/* Services, prices, and booking links                                 */
/* ------------------------------------------------------------------ */

export type ServiceId =
  | "discover-scuba"
  | "snorkeling"
  | "guided-tours"
  | "open-water"
  | "advanced"
  | "rescue";

export type Service = {
  id: ServiceId;
  name: string;
  /** Shown exactly as written. */
  price: string;
  /** Path on the Wix booking site. */
  bookingPath: string;
};

const serviceList = [
  {
    id: "discover-scuba",
    name: "Discover Scuba",
    price: "$99.99",
    bookingPath: "/booking-calendar/discover-scuba-no-experience-needed-1",
  },
  {
    id: "snorkeling",
    name: "Snorkeling with marine life",
    price: "$79.99",
    bookingPath: "/booking-calendar/snorkeling-with-marine-life-1",
  },
  {
    id: "guided-tours",
    name: "Professional guided tours",
    price: "$99",
    bookingPath: "/booking-calendar/professional-guided-tours",
  },
  {
    id: "open-water",
    name: "Open Water Diver",
    price: "$600",
    bookingPath: "/booking-calendar/open-water-diver",
  },
  {
    id: "advanced",
    name: "Advanced Diver",
    price: "$400",
    bookingPath: "/booking-calendar/advanced-diver",
  },
  {
    id: "rescue",
    name: "Rescue Diver",
    price: "$500",
    bookingPath: "/booking-calendar/rescue-diver",
  },
] as const satisfies readonly Service[];

export const services = Object.fromEntries(
  serviceList.map((s) => [s.id, s]),
) as Record<ServiceId, Service>;

export function bookingUrl(id: ServiceId): string {
  return `${business.bookingBase}${services[id].bookingPath}`;
}

/* ------------------------------------------------------------------ */
/* Experiences                                                         */
/* ------------------------------------------------------------------ */

export type Experience = {
  serviceId: Extract<ServiceId, "discover-scuba" | "snorkeling" | "guided-tours">;
  /** Short tag next to the name, such as who it is for. */
  tag: Fact<string>;
  summary: string;
  /** What happens, in order. */
  steps: Fact<string[]>;
  duration: Fact<string>;
  minimumAge: Fact<string>;
  /** What's included. */
  included: Fact<string>;
  requirement?: string;
};

export const experiences: Experience[] = [
  {
    serviceId: "discover-scuba",
    tag: "No experience needed",
    summary:
      "Never breathed underwater before? Start here. You learn the basics on land and in shallow water before your first real dive.",
    steps: [
      "A briefing on shore",
      "Practice in about three feet of water",
      "A guided dive of roughly 30 minutes",
    ],
    duration: "About 90 minutes, briefing included",
    minimumAge: "10 and up",
    included: "Equipment",
  },
  {
    serviceId: "snorkeling",
    tag: "From age 8",
    summary:
      "A guided snorkel tour, with time to get comfortable in shallow water first.",
    steps: [
      "A safety briefing on shore",
      "Practice in shallow water",
      "A guided snorkel tour",
    ],
    duration: "About 90 minutes, briefing included",
    minimumAge: "8 and up",
    included: "Equipment",
  },
  {
    serviceId: "guided-tours",
    tag: "Certified divers",
    summary: "Already certified? Come out for a guided dive and see the marine life at Blue Heron Bridge with Tabitha.",
    steps: ask("what happens on a guided tour"),
    duration: ask("how long a guided tour runs"),
    minimumAge: ask("the minimum age for guided tours"),
    included: ask("what a guided tour includes"),
    requirement: "Diving certification",
  },
];

/** Applies to the snorkel and scuba experiences, from her own listings. */
export const experienceTerms = [
  "Weather dependent",
  "Reservation required",
  "Waiver required",
] as const;

/* ------------------------------------------------------------------ */
/* Certification                                                       */
/* ------------------------------------------------------------------ */

export type Course = {
  serviceId: Extract<ServiceId, "open-water" | "advanced" | "rescue">;
  summary: string;
};

/** In order. Do not name a certifying agency. */
export const courses: Course[] = [
  {
    serviceId: "open-water",
    summary: "Your first scuba certification. Start here if you have never been certified.",
  },
  {
    serviceId: "advanced",
    summary: "The next step after Open Water.",
  },
  {
    serviceId: "rescue",
    summary: "The next step after Advanced.",
  },
];

/** Generic course structure. The only place numbered markers are allowed. */
export const courseStages = [
  {
    title: "Online learning",
    text: "Learn the theory online before you get in the water.",
  },
  {
    title: "Confined-water practice",
    text: "Practice the core skills in calm, confined water.",
  },
  {
    title: "Open-water dives",
    text: "Put those skills to work on real dives in open water.",
  },
] as const;

export const courseDetails = {
  location: ask("where certification courses take place") as Fact<string>,
  schedule: ask("upcoming course dates") as Fact<string>,
  inclusions: ask("what each course price includes") as Fact<string>,
};

/* ------------------------------------------------------------------ */
/* Underwater videos (hidden unless business.videosIncluded is true)  */
/* ------------------------------------------------------------------ */

export const videos = {
  title: "Free underwater videos",
  text: "Your experience comes with underwater video, so you can relive the dive and share it.",
} as const;

/* ------------------------------------------------------------------ */
/* Tabitha and the testimonial                                         */
/* ------------------------------------------------------------------ */

export const about = {
  intro: [
    "Tabs AquaQuest Diving is Tabitha's small, instructor-led dive business.",
    "Snorkel and scuba experiences start on shore with a briefing, so you know what comes next before you get wet. Nervous is normal. That is what the briefing is for.",
  ],
  credentials: ask("her training and certifications") as Fact<string>,
} as const;

/** The only testimonial. Use verbatim. */
export const testimonial = {
  quote:
    "I'll admit it, I was terrified about breathing underwater for the first time. But Tabitha broke it all down and made it so simple to understand. I felt safe the whole time, and honestly, I can't wait to go back out again.",
  name: "Mandi K.",
} as const;

/* ------------------------------------------------------------------ */
/* Groups                                                              */
/* ------------------------------------------------------------------ */

export const groups = {
  occasions: ["Birthdays", "Bachelorette trips", "Family reunions", "Friend groups"],
  note: "Some options need no experience at all, like Discover Scuba, so first-timers can join in.",
  sizeLimits: ask("group sizes") as Fact<string>,
} as const;

/* ------------------------------------------------------------------ */
/* Meeting point                                                       */
/* ------------------------------------------------------------------ */

/**
 * A public park and a meeting point, not a business address.
 * Never use it as the LocalBusiness location in structured data.
 */
export const meetingPoint = {
  name: "Phil Foster Park at Blue Heron Bridge",
  street: "900 Blue Heron Blvd",
  locality: "Riviera Beach, FL 33404",
  appliesTo: "Snorkel and scuba experiences",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Phil+Foster+Park%2C+900+Blue+Heron+Blvd%2C+Riviera+Beach%2C+FL+33404",
} as const;

/* ------------------------------------------------------------------ */
/* Groupon                                                             */
/* ------------------------------------------------------------------ */

export const groupon = {
  title: "Have a Groupon?",
  text: "Call or email to schedule your experience.",
} as const;

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */

export type FaqEntry = {
  id: string;
  question: string;
  answer?: string;
  /** Rendered as an "Ask Tabitha" prompt under the answer. */
  open?: Ask;
};

export const faq: FaqEntry[] = [
  {
    id: "experience",
    question: "Do I need any experience?",
    answer:
      "Not for Discover Scuba. It is made for people who have never dived. Professional guided tours are for certified divers.",
  },
  {
    id: "age",
    question: "How old do you have to be?",
    answer: "Snorkeling starts at age 8. Scuba starts at age 10.",
  },
  {
    id: "duration",
    question: "How long does it take?",
    answer: "Snorkel and scuba experiences run about 90 minutes, including the briefing.",
  },
  {
    id: "first-dive",
    question: "What happens on a first scuba dive?",
    answer:
      "You start with a briefing on shore. Then you practice in about three feet of water. When that feels easy, you head out on a guided dive of roughly 30 minutes.",
  },
  {
    id: "gear",
    question: "Do I need my own gear?",
    answer: "No. Equipment is provided for snorkel and scuba experiences.",
  },
  {
    id: "meet",
    question: "Where do we meet?",
    answer:
      "Snorkel and scuba experiences meet at Phil Foster Park at Blue Heron Bridge, 900 Blue Heron Blvd, Riviera Beach, FL 33404.",
  },
  {
    id: "weather",
    question: "What if the weather turns?",
    answer: "Experiences are weather dependent.",
    open: ask("cancellations and weather refunds"),
  },
  {
    id: "paperwork",
    question: "Is there paperwork?",
    answer: "Yes. Everyone signs a waiver, and every experience needs a reservation.",
  },
  {
    id: "group-size",
    question: "How many people can come in a group?",
    open: ask("group sizes"),
  },
  {
    id: "groupon",
    question: "I have a Groupon. How do I book?",
    answer: "Call or email to schedule your experience.",
  },
  {
    id: "course-location",
    question: "Where do certification courses happen?",
    open: ask("course locations and dates"),
  },
];

/* ------------------------------------------------------------------ */
/* Page copy                                                           */
/* Headings and intros for each section. Facts above, words here.      */
/* ------------------------------------------------------------------ */

export const hero = {
  title: "Take your first breath underwater, or your next great dive.",
  lede: "Snorkeling, Discover Scuba, guided tours, and certification courses with Tabitha. Snorkel and scuba experiences meet at Phil Foster Park at Blue Heron Bridge, Riviera Beach, FL.",
  primaryCta: "Explore dives",
  secondaryCta: "New to scuba? Start here",
} as const;

/**
 * The blue line-art panel. The bubbles in the tank illustration repeat facts
 * from the text beside them, so keep the two in step.
 */
export const firstDive = {
  title: "Your first breath, made simple",
  text: "Snorkel and scuba experiences start with a briefing on shore. Then you practice in shallow water before heading out with a guide.",
  sideTitle: "Gear and briefing included",
  sideText: "Plan on about 90 minutes from briefing to finish. Snorkeling starts at age 8 and scuba at 10. On Discover Scuba you practice in about three feet of water, then take a guided dive of roughly 30 minutes.",
  bubbles: ["8+", "10+", "3 ft", "30 min"],
  tankLabel: "90 min",
  badge: "See all dives",
} as const;

export type StartPath = {
  label: string;
  /** The price shown is this service's price, with "From" in front when `from` is true. */
  price: { from: boolean; serviceId: ServiceId };
  detail: string;
  href: string;
  link: string;
};

/** The price row under the blue panel. Prices come from `serviceList`. */
export const startHere: {
  title: string;
  titleSoft: string;
  intro: string;
  paths: StartPath[];
} = {
  title: "Three ways",
  titleSoft: "into the water",
  intro: "Pick the one that sounds like you.",
  paths: [
    {
      label: "Never dived",
      price: { from: true, serviceId: "snorkeling" },
      detail: "Snorkeling or Discover Scuba",
      href: "#discover-scuba",
      link: "See beginner options",
    },
    {
      label: "Want to get certified",
      price: { from: false, serviceId: "open-water" },
      detail: "Open Water Diver",
      href: "#certification",
      link: "See courses",
    },
    {
      label: "Already certified",
      price: { from: false, serviceId: "guided-tours" },
      detail: "Professional guided tours",
      href: "#guided-tours",
      link: "See guided tours",
    },
  ],
};

export const experiencesCopy = {
  title: "Experiences",
  intro: "Snorkel and scuba experiences meet at Phil Foster Park at Blue Heron Bridge. Good to know before you book:",
  stepsLabel: "How it goes",
} as const;

export const certificationCopy = {
  title: "Get certified",
  intro: "Certification goes step by step. Start with Open Water Diver, then build on it with Advanced and Rescue.",
  stagesTitle: "How courses run",
} as const;

export const aboutCopy = {
  title: "Meet Tabitha",
  badge: "Instructor-led snorkel and scuba",
} as const;

export const groupsCopy = {
  title: "Bring your people",
  intro: "Celebrate in the water. Tabitha hosts groups for:",
  askText: "Tell Tabitha your date, your headcount, and the occasion.",
} as const;

export const meetCopy = {
  title: "Where we meet",
  intro: "Snorkel and scuba experiences meet here:",
  note: "It's a public park and our meeting point.",
  mapsLabel: "Open in Google Maps",
} as const;

export const faqCopy = {
  title: "Questions before you book",
  intro: "Short answers to what people ask most. Anything else, just ask.",
} as const;

export const finalCopy = {
  title: "Ready when you are",
  lede: "Pick an experience and book online, or reach out first. Nervous questions are welcome.",
  cta: "Choose an experience",
} as const;

/* ------------------------------------------------------------------ */
/* The guided descent                                                  */
/* A scroll-scrubbed video sequence under the hero. Copy here; the     */
/* footage itself is decorative and carries no text.                   */
/* ------------------------------------------------------------------ */

export type DescentChapter = {
  id: string;
  /** Short name, shown on the depth gauge and read as "Chapter 2 of 4: First breath". */
  label: string;
  title: string;
  text: string;
  /** Scroll progress where the chapter starts and ends, 0 to 1. */
  range: readonly [number, number];
};

export const guidedDescent = {
  /** Read by screen readers as the section heading. */
  title: "The guided descent: from the surface to the reef",
  chapters: [
    {
      id: "surface",
      label: "Surface",
      title: "Your next adventure starts at the surface.",
      text: "Take a breath, meet your instructor, and discover how simple your first underwater experience can feel.",
      range: [0, 0.22],
    },
    {
      id: "first-breath",
      label: "First breath",
      title: "Take your first breath underwater.",
      // "Small groups" was in the brief but group size is unconfirmed, so it is left out.
      text: "Beginner-friendly instruction and patient guidance help you feel comfortable from the very beginning. Snorkel and scuba experiences start with a briefing on shore.",
      range: [0.22, 0.48],
    },
    {
      id: "reef",
      label: "The reef",
      title: "Enter a world most people never get to see.",
      text: "Explore local marine life through guided dives, snorkeling adventures, and certification courses.",
      range: [0.48, 0.75],
    },
    {
      id: "adventure",
      label: "Your adventure",
      title: "Ready to go deeper?",
      text: "Find the experience that fits you, from your first scuba session to your next guided dive.",
      range: [0.75, 1],
    },
  ] satisfies DescentChapter[],
  cta: { label: "Explore dives", href: "#experiences" },
  secondary: { label: "New to scuba? Start here", href: "#start-here" },
  /** Shown whenever real footage plays, so nothing reads as a promise. */
  footageNote: "Marine life and conditions vary from dive to dive.",
  /**
   * Media files, relative to public/. The site checks at build time which exist.
   * Missing files fall back to a still image or an illustration. See docs/video-production.md.
   */
  assets: {
    webm: "/video/guided-descent.webm",
    mp4: "/video/guided-descent.mp4",
    /** Optional lighter cut for phones. Without it, phones get the still version. */
    mobileMp4: "/video/guided-descent-mobile.mp4",
    poster: "/images/guided-descent-poster.webp",
    mobilePoster: "/images/guided-descent-mobile.webp",
    /** Only used when NEXT_PUBLIC_USE_FRAME_SEQUENCE=true. */
    framesManifest: "/video/frames/manifest.json",
  },
} as const;

/* ------------------------------------------------------------------ */
/* Photos                                                              */
/* None supplied yet. Each slot shows a labeled placeholder until it   */
/* gets a `src`. Put the file in public/photos/ and set src here, for  */
/* example src: "/photos/tabitha-portrait.jpg". See                    */
/* docs/asset-manifest.md for sizes and what each photo should show.   */
/* ------------------------------------------------------------------ */

export type Photo = {
  /** Shown on the placeholder until a real photo arrives. */
  caption: string;
  /** Alt text for the real photo. Describe what is actually in it. */
  alt: string;
  src?: string;
};

export const photos = {
  /** Optional. Until it has a src, the hero shows an illustrated sea instead. */
  hero: {
    caption: "Calm water at the meeting point.",
    alt: "",
  },
  "discover-scuba": {
    caption: "A first-time diver practicing in shallow water.",
    alt: "A first-time diver practicing in shallow water with Tabitha.",
  },
  snorkeling: {
    caption: "Snorkelers on a guided tour.",
    alt: "Snorkelers on a guided tour.",
  },
  "tabitha-portrait": {
    caption: "Tabitha at the water's edge.",
    alt: "Tabitha, owner of Tabs AquaQuest Diving.",
  },
  group: {
    caption: "A group celebrating in the water.",
    alt: "A group celebrating together in the water.",
  },
  "underwater-video": {
    caption: "A still from a customer's underwater video.",
    alt: "A still from an underwater video of a customer's dive.",
  },
} satisfies Record<string, Photo>;

export type PhotoId = keyof typeof photos;
