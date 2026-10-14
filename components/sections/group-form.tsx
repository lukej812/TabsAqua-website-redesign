"use client";

import { useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { contact, groupForm, groups } from "@/content/site";
import { CheckIcon, SendIcon } from "../icons";

/** Formspree-compatible endpoint. Set it in Vercel; see README. */
const ENDPOINT = process.env.NEXT_PUBLIC_FORM_ENDPOINT;

type Status = "idle" | "sending" | "sent" | "mailto";
type Field = "name" | "email" | "occasion" | "date" | "size";
type Errors = Partial<Record<Field, string>>;
type Values = {
  name: string;
  email: string;
  phone: string;
  occasion: string;
  date: string;
  size: string;
  message: string;
};

const FIELD_ORDER: Field[] = ["name", "email", "occasion", "date", "size"];

const noSubscription = () => () => {};

/** Today as YYYY-MM-DD in the visitor's own time zone. */
function today(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function read(form: HTMLFormElement): Values {
  const data = new FormData(form);
  const get = (key: string) => String(data.get(key) ?? "").trim();
  return {
    name: get("name"),
    email: get("email"),
    phone: get("phone"),
    occasion: get("occasion"),
    date: get("date"),
    size: get("size"),
    message: get("message"),
  };
}

function validate(values: Values): Errors {
  const errors: Errors = {};
  if (!values.name) errors.name = groupForm.errors.name;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = groupForm.errors.email;
  if (!values.occasion) errors.occasion = groupForm.errors.occasion;
  if (values.date && values.date < today()) errors.date = groupForm.errors.date;
  if (values.size && !/^[1-9]\d*$/.test(values.size)) errors.size = groupForm.errors.size;
  return errors;
}

function mailtoUrl(values: Values): string {
  const subject = `${groupForm.subject}: ${values.occasion || groupForm.occasionOther}`;
  const lines = [
    `Name: ${values.name}`,
    `Email: ${values.email}`,
    values.phone && `Phone: ${values.phone}`,
    `Occasion: ${values.occasion}`,
    values.date && `Preferred date: ${values.date}`,
    values.size && `Group size: ${values.size}`,
    values.message && `\n${values.message}`,
  ].filter(Boolean);
  return `${contact.email.href}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
}

/**
 * Group inquiry form, after the portfolio's ContactForm. With
 * NEXT_PUBLIC_FORM_ENDPOINT set it POSTs JSON there (with a honeypot field
 * for bots). Otherwise, or if that request fails, it opens a pre-filled email
 * to Tabitha. No server code. Without JavaScript the browser submits it as a
 * plain mailto form, so it still works.
 */
export function GroupForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [summary, setSummary] = useState("");
  const [mailto, setMailto] = useState("");
  const attempted = useRef(false);

  // Read in the browser only: the page is static, so a build-time date would go stale.
  const minDate = useSyncExternalStore(noSubscription, today, () => undefined);

  const recheck = (form: HTMLFormElement | null) => {
    if (!form || !attempted.current) return;
    const next = validate(read(form));
    setErrors(next);
    if (!Object.keys(next).length) setSummary("");
  };

  const openMail = (values: Values) => {
    const url = mailtoUrl(values);
    setMailto(url);
    setStatus("mailto");
    window.location.href = url;
  };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    attempted.current = true;
    const values = read(form);
    const found = validate(values);
    setErrors(found);
    const first = FIELD_ORDER.find((field) => found[field]);
    if (first) {
      setSummary(groupForm.errors.summary);
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setSummary("");

    // Bots fill the hidden field. Act as if it worked and send nothing.
    if (String(new FormData(form).get("_gotcha") ?? "")) {
      setStatus("sent");
      return;
    }

    if (!ENDPOINT) {
      openMail(values);
      return;
    }

    setStatus("sending");
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          ...values,
          _subject: `${groupForm.subject}: ${values.occasion}`,
          _gotcha: "",
        }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setStatus("sent");
      form.reset();
      attempted.current = false;
    } catch {
      openMail(values);
    }
  }

  const describedBy = (field: Field, hint?: string) =>
    [hint, errors[field] ? `group-${field}-error` : undefined].filter(Boolean).join(" ") || undefined;

  const error = (field: Field) =>
    errors[field] ? (
      <p id={`group-${field}-error`} className="field__error">
        {errors[field]}
      </p>
    ) : null;

  return (
    <form
      className="form glass"
      action={contact.email.href}
      method="post"
      encType="text/plain"
      noValidate
      onSubmit={onSubmit}
      onBlur={(event) => recheck(event.currentTarget)}
      onChange={(event) => recheck(event.currentTarget)}
      aria-labelledby="group-form-title"
      aria-describedby="group-form-status"
    >
      <div className="form__head">
        <h3 id="group-form-title" className="h3">
          {groupForm.title}
        </h3>
        <p className="muted">{groupForm.intro}</p>
      </div>

      <div className="form__grid">
        <div className="field">
          <label htmlFor="group-name">{groupForm.labels.name}</label>
          <input
            id="group-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy("name")}
          />
          {error("name")}
        </div>
        <div className="field">
          <label htmlFor="group-email">{groupForm.labels.email}</label>
          <input
            id="group-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy("email")}
          />
          {error("email")}
        </div>
        <div className="field">
          <label htmlFor="group-phone">
            {groupForm.labels.phone} <span className="field__optional">({groupForm.optional})</span>
          </label>
          <input id="group-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" />
        </div>
        <div className="field">
          <label htmlFor="group-occasion">{groupForm.labels.occasion}</label>
          <select
            id="group-occasion"
            name="occasion"
            required
            defaultValue=""
            aria-invalid={errors.occasion ? true : undefined}
            aria-describedby={describedBy("occasion")}
          >
            <option value="" disabled>
              {groupForm.occasionPlaceholder}
            </option>
            {groups.occasions.map((occasion) => (
              <option key={occasion} value={occasion}>
                {occasion}
              </option>
            ))}
            <option value={groupForm.occasionOther}>{groupForm.occasionOther}</option>
          </select>
          {error("occasion")}
        </div>
        <div className="field">
          <label htmlFor="group-date">
            {groupForm.labels.date} <span className="field__optional">({groupForm.optional})</span>
          </label>
          <input
            id="group-date"
            name="date"
            type="date"
            min={minDate}
            aria-invalid={errors.date ? true : undefined}
            aria-describedby={describedBy("date")}
          />
          {error("date")}
        </div>
        <div className="field">
          <label htmlFor="group-size">
            {groupForm.labels.size} <span className="field__optional">({groupForm.optional})</span>
          </label>
          <input
            id="group-size"
            name="size"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            aria-invalid={errors.size ? true : undefined}
            aria-describedby={describedBy("size")}
          />
          {error("size")}
        </div>
        <div className="field field--wide">
          <label htmlFor="group-message">
            {groupForm.labels.message} <span className="field__optional">({groupForm.optional})</span>
          </label>
          <textarea id="group-message" name="message" rows={4} />
        </div>
      </div>

      {/* Honeypot: hidden from people and assistive technology, filled only by bots. */}
      <div className="form__trap" aria-hidden="true">
        <label htmlFor="group-gotcha">Leave this empty</label>
        <input id="group-gotcha" name="_gotcha" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="form__foot">
        <button
          type="submit"
          className="btn btn--primary"
          disabled={status === "sending"}
          aria-disabled={status === "sending" ? true : undefined}
          data-action="submit"
        >
          {status === "sending" ? groupForm.sending : groupForm.submit}
          <SendIcon size={18} className="btn__icon btn__icon--nudge-up" />
        </button>
        <p className="form__via">{ENDPOINT ? groupForm.viaEndpoint : groupForm.viaEmail}</p>
      </div>

      <div id="group-form-status" className="form__status" aria-live="polite">
        {summary && <p className="field__error">{summary}</p>}
        {!summary && status === "sent" && (
          <p className="form__success">
            <CheckIcon size={20} />
            {groupForm.sent}
          </p>
        )}
        {!summary && status === "mailto" && (
          <p className="form__success">
            <CheckIcon size={20} />
            <span>
              {groupForm.mailto}{" "}
              <a className="text-link" href={mailto} data-mailto>
                {groupForm.mailtoLink}
              </a>
              .
            </span>
          </p>
        )}
      </div>
    </form>
  );
}
