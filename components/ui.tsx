import Image from "next/image";
import type { ReactNode } from "react";
import {
  bookingUrl,
  contact,
  experiencesCopy,
  photos,
  services,
  type Ask,
  type PhotoId,
  type ServiceId,
} from "@/content/site";
import { photoSrc } from "@/lib/photos";
import { ArrowRightIcon, CameraIcon, ChatIcon, CopyIcon, MailIcon, PhoneIcon } from "./icons";

/* ------------------------------------------------------------------ */
/* Book buttons: every one links to that service's Wix booking page,   */
/* in the same tab (it is her own domain).                              */
/* ------------------------------------------------------------------ */

export function BookButton({ id, label = experiencesCopy.bookLabel }: { id: ServiceId; label?: string }) {
  return (
    <a className="btn btn--primary" href={bookingUrl(id)} data-magnetic data-book={id}>
      {label}
      <span className="sr-only">: {services[id].name}</span>
      <ArrowRightIcon size={18} className="btn__icon btn__icon--nudge" />
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
        <ChatIcon size={20} />
        Ask Tabitha about {topic.ask}
      </p>
      <p className="ask__text">{children ?? "Not listed here yet. Call or email and Tabitha can tell you."}</p>
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

/** Wired up by components/page-script.tsx. Hidden until that script runs. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  return (
    <button
      type="button"
      className="btn btn--glass btn--small js-only"
      data-copy={value}
      data-copy-label={label}
      data-action="copy"
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
        <span className="contact-line__label label">Phone</span>
        <div className="contact-line__row">
          <span className="contact-line__value">{contact.phone.display}</span>
          <a className="btn btn--glass btn--small" href={contact.phone.href}>
            <PhoneIcon size={18} />
            Call
          </a>
          <CopyButton value={contact.phone.display} label="Phone number" />
        </div>
      </div>
      <div className="contact-line">
        <span className="contact-line__label label">Email</span>
        <div className="contact-line__row">
          <span className="contact-line__value">{contact.email.display}</span>
          <a className="btn btn--glass btn--small" href={contact.email.href}>
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
/* Photo slots: a labeled placeholder until a photo exists at          */
/* public/photos/<slot id>.*. Every slot is in docs/asset-manifest.md. */
/* ------------------------------------------------------------------ */

export function PhotoSlot({
  id,
  ratio = "4 / 5",
  sizes = "(min-width: 1024px) 40vw, 100vw",
  className = "",
}: {
  id: PhotoId;
  ratio?: string;
  sizes?: string;
  className?: string;
}) {
  const photo = photos[id];
  const src = photoSrc(id);
  return (
    <figure className={`photo-slot ${className}`} style={{ aspectRatio: ratio }} data-asset={id}>
      {src ? (
        <Image src={src} alt={photo.alt} fill sizes={sizes} className="photo-slot__img" />
      ) : (
        <>
          <svg
            className="photo-slot__art"
            viewBox="0 0 400 500"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
            focusable="false"
          >
            <g fill="none" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round">
              <path d="M-10 120c40-10 70-10 110 0s70 10 110 0 70-10 110 0 70 10 110 0" />
              <path d="M60 0 20 500M150 0l-30 500M260 0l40 500" strokeOpacity="0.12" strokeWidth="30" />
              <circle cx="300" cy="300" r="7" />
              <circle cx="310" cy="270" r="4.5" />
              <circle cx="304" cy="248" r="3" />
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
