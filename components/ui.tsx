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
import { ChatIcon, CopyIcon, ExternalIcon, MailIcon, PhoneIcon } from "./icons";

/* ------------------------------------------------------------------ */
/* Book buttons: every one links out to the Wix booking calendar       */
/* ------------------------------------------------------------------ */

export function BookButton({
  id,
  small = false,
  label,
  variant = "primary",
}: {
  id: ServiceId;
  small?: boolean;
  /** Visible text. When omitted: "See dates and book", with the service name for screen readers. */
  label?: string;
  variant?: "primary" | "ghost";
}) {
  // Colors come from the section's tone: ocean blue on light, white on dark.
  return (
    <a className={`btn btn--${variant}${small ? " btn--small" : ""}`} href={bookingUrl(id)}>
      {label ?? (
        <>
          See dates and book<span className="sr-only"> {services[id].name}</span>
        </>
      )}
      <ExternalIcon size={17} />
      <span className="sr-only"> (booking calendar)</span>
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

export function CopyButton({ value, label }: { value: string; label: string }) {
  // Wired up by components/page-script.tsx. Hidden until that script runs.
  return (
    <button type="button" className="btn btn--quiet btn--small js-only" data-copy={value} data-copy-label={label}>
      <CopyIcon size={17} />
      <span data-copy-text>Copy</span>
      <span className="sr-only"> {label.toLowerCase()}</span>
    </button>
  );
}

export function ContactLines() {
  return (
    <div className="contact-lines">
      <div className="contact-line">
        <span className="contact-line__label">Phone</span>
        <span className="contact-line__value">{contact.phone.display}</span>
        <div className="contact-line__actions">
          <a className="btn btn--primary btn--small" href={contact.phone.href}>
            <PhoneIcon size={17} />
            Call
          </a>
          <CopyButton value={contact.phone.display} label="Phone number" />
        </div>
      </div>
      <div className="contact-line">
        <span className="contact-line__label">Email</span>
        <span className="contact-line__value">{contact.email.display}</span>
        <div className="contact-line__actions">
          <a className="btn btn--primary btn--small" href={contact.email.href}>
            <MailIcon size={17} />
            Email
          </a>
          <CopyButton value={contact.email.display} label="Email address" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Photos: real photos only. Until content/site.ts gives a slot a src, */
/* the section shows its illustration (`fallback`) instead. Every slot */
/* is listed in docs/asset-manifest.md.                                */
/* ------------------------------------------------------------------ */

export function PhotoFrame({
  id,
  fallback = null,
  className = "",
  sizes = "(min-width: 900px) 40vw, 100vw",
}: {
  id: PhotoId;
  fallback?: ReactNode;
  className?: string;
  sizes?: string;
}) {
  const photo: Photo = photos[id];
  if (photo.src) {
    return (
      <figure className={`photo ${className}`} data-asset={id}>
        <Image src={photo.src} alt={photo.alt} fill sizes={sizes} className="photo__img" />
      </figure>
    );
  }
  // Development builds mark where a photo will go, so the owner can see the gap.
  const hint =
    process.env.NODE_ENV === "development" ? (
      <p className="photo-hint" role="note">
        Photo slot &ldquo;{id}&rdquo;: {photo.caption} See docs/asset-manifest.md.
      </p>
    ) : null;
  if (!fallback && !hint) return null;
  return (
    <>
      {fallback}
      {hint}
    </>
  );
}
