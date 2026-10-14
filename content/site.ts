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
  title: "Tabs AquaQuest Diving | Snorkeling, Discover Scuba, and dive courses with Tabitha",
  description:
    "Instructor-led snorkeling, Discover Scuba for first-timers, guided tours for certified divers, and certification courses with Tabitha. Snorkel and scuba experiences meet at Phil Foster Park at Blue Heron Bridge.",
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
    summary: "Already certified? Book a guided dive.",
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
  /** Loaded only after a visitor presses "Show map". */
  embedUrl: "https://www.google.com/maps?q=Phil+Foster+Park+Riviera+Beach+FL&output=embed",
} as const;

/* ------------------------------------------------------------------ */
/* Groupon                                                             */
/* ------------------------------------------------------------------ */

export const groupon = {
  title: "Have a Groupon?",
  text: "Call or email to schedule your experience.",
  toggle: "How to use it",
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
/* In headings, *asterisks* mark the words set in italic.              */
/* ------------------------------------------------------------------ */

/** Header and menu links, in page order. Each `id` is a section on the page. */
export const nav = [
  { id: "experiences", label: "Experiences" },
  { id: "courses", label: "Courses" },
  { id: "about", label: "About" },
  { id: "groups", label: "Groups" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact" },
] as const;

export const headerCopy = {
  bookCta: "Book a dive",
  menuOpen: "Open menu",
  menuClose: "Close menu",
} as const;

/**
 * Social profiles. Only add a link once Tabitha confirms the account is hers.
 * The hero rail and footer show an icon for each entry; none are verified yet.
 */
export const social: { label: string; href: string }[] = [];

export const hero = {
  eyebrow: "Snorkel · Scuba · Certification",
  title: "Take your first breath *underwater.*",
  leadLine: "Or your next great dive.",
  lede: "Snorkeling, Discover Scuba, guided tours, and certification courses, all with Tabitha.",
  primaryCta: { label: "Explore dives", href: "#experiences" },
  secondaryCta: { label: "New to scuba? Start here", href: "#discover-scuba" },
  scrollCue: "Scroll",
  /** A verbatim excerpt of the testimonial. A test checks it still matches. */
  quoteChip: "I felt safe the whole time",
  /** The hero's glass cards. Each fact must be verified above. */
  cards: [
    {
      serviceId: "discover-scuba",
      fact: "No experience needed. You practice in about three feet of water first.",
    },
    {
      serviceId: "snorkeling",
      fact: "From age 8. A safety briefing on shore, then a guided tour.",
    },
    {
      serviceId: "guided-tours",
      fact: "For certified divers who want a guided dive.",
    },
  ] satisfies { serviceId: Experience["serviceId"]; fact: string }[],
  /** The media card when no footage exists yet. */
  meetCard: { title: "Meet at Blue Heron Bridge", link: "See where we meet" },
  /** The media card once guided descent footage exists. */
  videoCard: {
    title: "The guided descent",
    play: "Play the guided descent video",
    close: "Close video",
  },
  rail: {
    call: `Call ${contact.phone.display}`,
    email: "Email Tabitha",
    directions: "Get directions",
  },
} as const;

export type Stat = {
  id: string;
  /** Small word above the figure, such as "About". */
  lead?: string;
  /** Numbers that count up. Their final values are in the server HTML. */
  figures?: { value: number; suffix?: string }[];
  /** Used instead of figures when the stat is not a number. */
  word?: string;
  unit?: string;
  caption: string;
};

/** The count-up row under the guided descent. Verified numbers only. */
export const facts: { title: string; intro: string; items: Stat[] } = {
  title: "Your first dive, *in numbers.*",
  intro: "No surprises. Here is what a snorkel or scuba experience with Tabitha looks like.",
  items: [
    { id: "duration", lead: "About", figures: [{ value: 90 }], unit: "min", caption: "per experience, briefing included" },
    { id: "practice", lead: "About", figures: [{ value: 3 }], unit: "ft", caption: "of water for your first practice" },
    { id: "dive", lead: "About", figures: [{ value: 30 }], unit: "min", caption: "on your guided Discover Scuba dive" },
    {
      id: "ages",
      lead: "Ages",
      figures: [{ value: 8, suffix: "+" }, { value: 10, suffix: "+" }],
      caption: "8 and up to snorkel, 10 and up for scuba",
    },
    { id: "gear", lead: "All", word: "Gear", unit: "provided", caption: "for snorkel and scuba experiences" },
  ],
};

export const experiencesCopy = {
  title: "Find your way *into the water.*",
  intro:
    "Snorkel and scuba experiences start with a briefing on shore and meet at Phil Foster Park at Blue Heron Bridge.",
  stepsLabel: "How it goes",
  timeLabel: "Time",
  agesLabel: "Ages",
  includedLabel: "Included",
  requiresLabel: "Requires",
  bookLabel: "Book now",
  bookNote: "You'll pick a time on our booking calendar.",
} as const;

/** The line that lights up word by word. It must not state anything unverified. */
export const statement = "The first breath feels strange. The second feels like *flying.*";

export const certificationCopy = {
  title: "Get *certified.*",
  intro: "Certification goes step by step. Start with Open Water Diver, then build on it with Advanced and Rescue.",
  stepLabel: "Step",
  stagesTitle: "How every course runs",
  askLabels: { location: "Where", schedule: "When", inclusions: "Included" },
} as const;

export const aboutCopy = {
  title: "Meet *Tabitha.*",
  portraitLabel: "Tabitha",
} as const;

export const groupsCopy = {
  title: "Bring your *people.*",
  intro: "Celebrate in the water. Tabitha hosts groups for:",
  askText: "Tell Tabitha your date, your headcount, and the occasion.",
} as const;

/** The group inquiry form. See README for the Formspree setup. */
export const groupForm = {
  title: "Plan a group outing",
  intro: "Tell Tabitha your date, your headcount, and the occasion. She will get back to you.",
  labels: {
    name: "Your name",
    email: "Email",
    phone: "Phone",
    occasion: "Occasion",
    date: "Preferred date",
    size: "Group size",
    message: "Anything else Tabitha should know?",
  },
  optional: "optional",
  occasionPlaceholder: "Choose one",
  occasionOther: "Something else",
  submit: "Send inquiry",
  sending: "Sending...",
  viaEndpoint: "Sends to Tabitha's inbox.",
  viaEmail: "Opens your email app.",
  sent: "Thanks. Your inquiry is on its way to Tabitha.",
  mailto: "Your email app should open with everything filled in. If it doesn't,",
  mailtoLink: "email Tabitha directly",
  errors: {
    name: "Add your name so Tabitha knows who is asking.",
    email: "Add an email address like name@example.com.",
    occasion: "Choose an occasion, or pick Something else.",
    date: "Pick today or a later date.",
    size: "Enter how many people, as a whole number.",
    summary: "Check the highlighted fields.",
  },
  subject: "Group inquiry",
} as const;

export const meetCopy = {
  title: "Where we *meet.*",
  label: "Meeting point for snorkel and scuba experiences",
  note: "It's a public park and our meeting point.",
  directions: "Get directions",
  showMap: "Show map",
  mapNote: "The map loads from Google when you ask for it.",
  mapTitle: "Map of Phil Foster Park at Blue Heron Bridge",
} as const;

export const faqCopy = {
  title: "Questions before you *book.*",
  intro: "Short answers to what people ask most. Anything else, just ask.",
} as const;

export const finalCopy = {
  title: "Ready when *you are.*",
  lede: "Call, email, or pick an experience and book online. Nervous questions are welcome.",
} as const;

export const footerCopy = {
  backToTop: "Back to top",
  /** Names the booking host, so it stays right if Wix booking moves. */
  bookingNote: `Booking happens on ${new URL(business.bookingBase).hostname.replace(/^www\./, "")}.`,
} as const;

export const notFoundCopy = {
  title: "This page *drifted off.*",
  text: "The link may be old, or the page moved. Everything you need is back at the surface.",
  cta: "Back to the surface",
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
  secondary: { label: "New to scuba? Start here", href: "#discover-scuba" },
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
/* None supplied yet. Drop a file at public/photos/<slot id>.jpg (or   */
/* .webp, .avif, .png) and rebuild: the slot switches on by itself.    */
/* Then rewrite its `alt` below to describe what is actually in it.    */
/* See docs/asset-manifest.md for sizes and what each photo shows.     */
/* ------------------------------------------------------------------ */

export type Photo = {
  /** Shown on the placeholder until a real photo arrives. */
  caption: string;
  /** Alt text for the real photo. Describe what is actually in it. */
  alt: string;
  /** Optional explicit path. Without it, public/photos/<slot id>.* is used. */
  src?: string;
};

export const photos = {
  /** Optional. Until it exists, the hero shows the drawn underwater scene. */
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

/**
 * Optional looping hero video, relative to public/. When the mp4 exists it
 * becomes the hero's base layer, with only the drawn caustics on top.
 * Muted, no text, no audio. Under 4 MB.
 */
export const heroVideo = {
  mp4: "/video/hero.mp4",
  webm: "/video/hero.webm",
  poster: "/images/hero-poster.webp",
} as const;
