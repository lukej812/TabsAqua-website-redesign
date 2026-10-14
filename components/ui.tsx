import Image from "next/image";
import type { ReactNode } from "react";
import {
  bookingUrl,
  contact,
  photos,
  services,
  type Ask,
  type Photo,
  type PhotoId,
  type ServiceId,
} from "@/content/site";
import { CameraIcon, ChatIcon, CopyIcon, ExternalIcon, MailIcon, PhoneIcon } from "./icons";

/* ------------------------------------------------------------------ */
/* Book buttons: every one links out to the Wix booking calendar       */
/* ------------------------------------------------------------------ */

export function BookButton({ id, small = false }: { id: ServiceId; small?: boolean }) {
  // Colors come from the panel's tone: blue on light panels, white on blue ones.
  return (
    <a
      className={`btn btn--primary${small ? " btn--small" : ""}`}
      href={bookingUrl(id)}
    >
      See dates and book<span className="sr-only"> {services[id].name}</span>
      <ExternalIcon size={18} />
    </a>
  );
}

/* ------------------------------------------------------------------ */
/* Ask Tabitha: shown wherever a fact is not confirmed yet             */
/* ------------------------------------------------------------------ */

/** A full prompt with phone and email, for open questions in a section. */
export function AskTabitha({ topic, children }: { topic: Ask; children?: ReactNode }) {
  return (
    <div className="ask">
      <p className="ask__title">
        <ChatIcon />
        Ask Tabitha about {topic.ask}
      </p>
      <p className="ask__text">
        {children ?? "Not listed here yet. Call or email and Tabitha can tell you."}
      </p>
      <p className="ask__links">
        <a className="text-link" href={contact.phone.href}>
          Call {contact.phone.display}
        </a>
        <a className="text-link" href={contact.email.href}>
          Email Tabitha
        </a>
      </p>
    </div>
  );
}

/** A compact "Ask Tabitha" link for a single missing value, such as a spec row. */
export function AskInline({ topic }: { topic: Ask }) {
  return (
    <a className="ask-inline" href="#contact">
      Ask Tabitha<span className="sr-only"> about {topic.ask}</span>
    </a>
  );
}

/* ------------------------------------------------------------------ */
/* Contact lines: selectable text, a copy button, and a tel/mailto link */
/* ------------------------------------------------------------------ */

export function CopyButton({ value, label }: { value: string; label: string }) {
  // Wired up by components/descent.tsx. Hidden until that script runs.
  return (
    <button
      type="button"
      className="btn btn--quiet btn--small js-only"
      data-copy={value}
      data-copy-label={label}
    >
      <CopyIcon size={18} />
      <span data-copy-text>Copy</span>
      <span className="sr-only"> {label.toLowerCase()}</span>
    </button>
  );
}

export function ContactLines() {
  return (
    <div className="contact-lines">
      <div className="contact-line">
        <span className="contact-line__label">
          Phone
        </span>
        <div className="contact-line__row">
          <span className="contact-line__value">
            {contact.phone.display}
          </span>
          <a className="btn btn--quiet btn--small" href={contact.phone.href}>
            <PhoneIcon size={18} />
            Call
          </a>
          <CopyButton value={contact.phone.display} label="Phone number" />
        </div>
      </div>
      <div className="contact-line">
        <span className="contact-line__label">
          Email
        </span>
        <div className="contact-line__row">
          <span className="contact-line__value">
            {contact.email.display}
          </span>
          <a className="btn btn--quiet btn--small" href={contact.email.href}>
            <MailIcon size={18} />
            Email
          </a>
          <CopyButton value={contact.email.display} label="Email address" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Photo slots: a labeled placeholder until content/site.ts gives the  */
/* photo a src. Every slot is listed in docs/asset-manifest.md.        */
/* ------------------------------------------------------------------ */

export function PhotoSlot({
  id,
  ratio = "4 / 3",
  panel = false,
  sizes = "(min-width: 900px) 50vw, 100vw",
}: {
  id: PhotoId;
  ratio?: string;
  /** Fill a split panel's height instead of keeping a ratio (wide screens). */
  panel?: boolean;
  sizes?: string;
}) {
  const photo: Photo = photos[id];
  return (
    <figure
      className={`photo-slot${panel ? " photo-slot--panel" : ""}`}
      style={{ aspectRatio: ratio }}
      data-asset={id}
    >
      {photo.src ? (
        <Image src={photo.src} alt={photo.alt} fill sizes={sizes} className="photo-slot__img" />
      ) : (
        <>
          <svg
            className="photo-slot__art"
            viewBox="0 0 400 300"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
            focusable="false"
          >
            <g fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.5" strokeLinecap="round">
              <path d="M-10 70c40-12 70-12 110 0s70 12 110 0 70-12 110 0 70 12 110 0" strokeDasharray="0.1 7" />
              <path d="M-10 110c40-10 70-10 110 0s70 10 110 0 70-10 110 0 70 10 110 0" />
            </g>
            <g fill="none" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.5">
              <circle cx="300" cy="150" r="7" />
              <circle cx="310" cy="124" r="4.5" />
              <circle cx="304" cy="104" r="3" />
            </g>
          </svg>
          <figcaption>
            <CameraIcon size={20} />
            <span>
              <strong>Photo coming soon.</strong> {photo.caption}
            </span>
          </figcaption>
        </>
      )}
    </figure>
  );
}
