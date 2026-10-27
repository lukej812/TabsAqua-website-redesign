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

/** Updated each year at rebuild time. */
export const copyrightYear = 2026;

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
/* The page reads as one dive: surface, descent, reef, deeper, safety  */
/* stop, ascent, back on shore, and booking at the surface.            */
/* ------------------------------------------------------------------ */

export const hero = {
  kicker: "Snorkel and scuba with Tabitha in Riviera Beach, Florida",
  title: "Take your first breath underwater,",
  titleTail: "or your next great dive.",
  lede: "Snorkeling, Discover Scuba, guided tours for certified divers, and certification courses. No experience needed for Discover Scuba.",
  primaryCta: "Explore dives",
  secondaryCta: "New to scuba? Start here",
  scrollCue: "Scroll to descend",
} as const;

/** The quick facts along the bottom of the hero. Prices come from `serviceList`. */
export const heroFacts = [
  { label: "Snorkeling", value: `From ${services.snorkeling.price}` },
  { label: "Discover Scuba", value: services["discover-scuba"].price },
  { label: "Time", value: "About 90 minutes" },
  { label: "Gear", value: "Equipment provided" },
] as const;

/**
 * The descent: how a first scuba experience goes, one step per screen, as the
 * water darkens behind it. Every line here comes from her own listings.
 */
export const descent = {
  kicker: "Your first dive",
  title: "New to scuba? Here is how your first dive goes.",
  steps: [
    {
      id: "briefing",
      label: "On shore",
      title: "It starts with a briefing on shore.",
      text: "Snorkel and scuba experiences start on shore, so you know what comes next before you get wet. Nervous is normal. That is what the briefing is for.",
    },
    {
      id: "practice",
      label: "In the shallows",
      title: "Then you practice in about three feet of water.",
      text: "Your first breaths underwater happen in the shallows, before the dive itself. Take them one at a time.",
    },
    {
      id: "dive",
      label: "The dive",
      title: "Then a guided dive of roughly 30 minutes.",
      text: "When the practice feels easy, you head out with your guide. Marine life and conditions vary from dive to dive.",
    },
  ],
  close: {
    title: "About 90 minutes, start to finish.",
    text: "Briefing included and equipment provided. Scuba starts at age 10. Snorkeling starts at 8 and follows the same rhythm: a safety briefing on shore, shallow-water practice, then a guided tour.",
    secondary: { label: "Compare all experiences", href: "#experiences" },
  },
  /** Shown whenever real footage plays, so nothing reads as a promise. */
  footageNote: "Marine life and conditions vary from dive to dive.",
  /**
   * Optional footage, relative to public/. The site checks at build time which
   * exist. Without footage the live water scene runs instead. See docs/video-production.md.
   */
  assets: {
    webm: "/video/guided-descent.webm",
    mp4: "/video/guided-descent.mp4",
    /** Optional lighter cut for phones. Without it, phones get the live water scene. */
    mobileMp4: "/video/guided-descent-mobile.mp4",
    poster: "/images/guided-descent-poster.webp",
    mobilePoster: "/images/guided-descent-mobile.webp",
    /** Only used when NEXT_PUBLIC_USE_FRAME_SEQUENCE=true. */
    framesManifest: "/video/frames/manifest.json",
  },
} as const;

/**
 * The page's depth zones, top to bottom, for the depth gauge. The names are
 * atmosphere, not real depths: no feet or meters anywhere.
 */
export const zones = [
  { id: "top", label: "Surface" },
  { id: "first-dive", label: "Descent" },
  { id: "experiences", label: "The reef" },
  { id: "certification", label: "Deeper" },
  { id: "tabitha", label: "Safety stop" },
  { id: "groups", label: "Ascent" },
  { id: "where-we-meet", label: "Shore" },
  { id: "book", label: "Surface" },
] as const;

export const experiencesCopy = {
  kicker: "The reef",
  title: "Three ways",
  titleSoft: "into the water",
  intro: "Snorkel and scuba experiences meet at Phil Foster Park at Blue Heron Bridge. Good to know before you book:",
  stepsLabel: "How it goes",
} as const;

export const certificationCopy = {
  kicker: "Deeper",
  title: "Get certified",
  intro: "Certification goes step by step. Start with Open Water Diver, then build on it with Advanced and Rescue.",
  startHere: "Start here",
  stagesTitle: "How courses run",
} as const;

export const aboutCopy = {
  kicker: "Safety stop",
  title: "Meet Tabitha",
  essentialsTitle: "Good to know before you go",
} as const;

/** Practical facts, all from her own listings. Shown as a list beside "Meet Tabitha". */
export const essentials = [
  { icon: "briefing", text: "Every snorkel and scuba experience starts with a briefing on shore." },
  { icon: "shallow", text: "You practice in shallow water before heading out with a guide." },
  { icon: "gear", text: "Equipment is provided for snorkel and scuba experiences." },
  { icon: "age", text: "Snorkeling starts at age 8. Scuba starts at age 10." },
  { icon: "cert", text: "Guided tours are for divers with a diving certification." },
  { icon: "weather", text: "Experiences are weather dependent. Reservation and waiver required." },
] as const;

export const groupsCopy = {
  kicker: "Ascent",
  title: "Bring your people",
  intro: "Celebrate in the water. Tabitha hosts groups for:",
  askText: "Tell her your date, your headcount, and the occasion.",
} as const;

/**
 * The group planner composes an email in the visitor's own mail app. Nothing
 * is sent from this site, so it never claims a message went through.
 */
export const planner = {
  title: "Plan a group outing",
  intro: "Fill this in and your email app opens with a message to Tabitha, ready to send.",
  occasions: [...groups.occasions, "Something else"],
  interests: ["Snorkeling", "Discover Scuba", "Guided tours for certified divers", "Not sure yet"],
  submit: "Write the email",
  opened: "Your email app should open with the message. Nothing is sent until you press send there.",
  noApp: "No email app on this device? Copy the message and send it from anywhere, or call.",
  subject: "Group outing",
} as const;

export const meetCopy = {
  kicker: "Back on shore",
  title: "Where we meet",
  intro: "Snorkel and scuba experiences meet here:",
  note: "It's a public park and our meeting point.",
  mapsLabel: "Open in Google Maps",
} as const;

export const faqCopy = {
  title: "Questions before you book",
  intro: "Short answers to what people ask most. Anything else, just ask.",
} as const;

export type ChooserPath = {
  id: string;
  /** The answer the visitor picks. */
  label: string;
  /** What the site suggests for that answer. */
  title: string;
  text: string;
  services: ServiceId[];
  /** For answers that point at a section rather than a booking page. */
  link?: { label: string; href: string };
};

export const bookCopy = {
  kicker: "Back at the surface",
  title: "Ready when you are",
  lede: "Pick an experience and book online, or reach out first. Nervous questions are welcome.",
  chooserTitle: "Where are you starting from?",
  listTitle: "Every experience and course",
  contactTitle: "Talk to Tabitha first",
  paths: [
    {
      id: "new",
      label: "I've never dived",
      title: "Start with Discover Scuba or snorkeling",
      text: "No experience needed for Discover Scuba. Scuba starts at age 10 and snorkeling at 8.",
      services: ["discover-scuba", "snorkeling"],
    },
    {
      id: "certify",
      label: "I want to get certified",
      title: "Start with Open Water Diver",
      text: "Your first scuba certification: online learning, then confined-water practice, then open-water dives.",
      services: ["open-water"],
      link: { label: "See how courses run", href: "#certification" },
    },
    {
      id: "certified",
      label: "I'm already certified",
      title: "Come out on a guided tour, or keep training",
      text: "Guided tours need a diving certification. Advanced follows Open Water, and Rescue follows Advanced.",
      services: ["guided-tours", "advanced", "rescue"],
    },
    {
      id: "group",
      label: "I'm bringing a group",
      title: "Plan it with Tabitha",
      text: "Birthdays, bachelorette trips, family reunions, and friend groups. Some options need no experience at all.",
      services: ["discover-scuba", "snorkeling"],
      link: { label: "Plan a group outing", href: "#groups" },
    },
  ] satisfies ChooserPath[],
} as const;

/** Who each service is for, in a few words, for the full price list. */
export const serviceFor: Record<ServiceId, string> = {
  "discover-scuba": "No experience needed. Ages 10 and up",
  snorkeling: "Ages 8 and up",
  "guided-tours": "Certified divers",
  "open-water": "Your first certification",
  advanced: "After Open Water",
  rescue: "After Advanced",
};

/* ------------------------------------------------------------------ */
/* Photos                                                              */
/* None supplied yet. Until a slot gets a `src`, its section shows     */
/* illustration instead (never a stock or AI photo). Put the file in   */
/* public/photos/ and set src here, for example                        */
/* src: "/photos/tabitha-portrait.jpg". See docs/asset-manifest.md.    */
/* ------------------------------------------------------------------ */

export type Photo = {
  /** What the photo should show. Development builds label the empty slot with it. */
  caption: string;
  /** Alt text for the real photo. Describe what is actually in it. */
  alt: string;
  src?: string;
};

export const photos = {
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
